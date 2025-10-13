// app/[display_name]/page.tsx

import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import instrumentGroups from '@/data/instruments'
import provinceCity from '@/data/province_city.json'
import React from 'react'
import InviteButtons from '@/app/components/InviteButtons'
import Image from 'next/image'
import { formatTimeToPersian } from '@/app/utils/dateUtils'
import ProfileEvents from '@/app/components/ProfileEvents'
import CollaborationRequestButton from '@/app/components/CollaborationRequestButton'
import { redirect } from 'next/navigation'
import TeachingRequestButton from '@/app/components/TeachingRequestButton'
import ImageGalleryModal from '@/app/components/ImageGalleryModal'
import GallerySection from '@/app/components/GallerySection'

// تعریف ثوابت و توابع کمکی مورد نیاز در سطح ماژول برای استفاده در generateMetadata و کامپوننت
const roleLabels: Record<string, string> = {
  musician: 'نوازنده',
  teacher: 'مدرس',
  vocalist: 'خواننده',
  band: 'گروه موسیقی',
  singer: 'خواننده',
  songWriter: 'آهنگساز',
  arranger: 'تنظیم‌کننده',
  soundEngineer: 'صدابردار',
  producer: 'تهیه‌کننده',
  lyricist: 'ترانه‌سرا',
  photographer: 'عکاس/تصویربردار',
  lighting: 'نورپرداز',
  director: 'کارگردان (موزیک ویدئو)',
  manager: 'مدیر برنامه',
  school: 'آموزشگاه موسیقی',
  recordingStudio: 'استودیو ضبط',
  rehearsalSpace: 'فضای تمرین',
  venue: 'مکان اجرا',
  // ... add more as needed
};

const getCityFa = function(provinceId: string, cityId: string) {
    const p = provinceCity.find((p: any) => p['province-en'] === provinceId || p['province-fa'] === provinceId);
    if (!p) return cityId;
    const c = p.cities.find((c: any) => c['city-en'] === cityId || c['city-fa'] === cityId);
    return c ? c['city-fa'] : cityId;
}

const getInstrumentName = function(id: string) {
    for (const group of instrumentGroups) {
      
      // 1. جستجو در آرایه instruments مستقیم (برای گروه ۱، ۲، ۴، ۵، ۶)
      if (group.instruments && Array.isArray(group.instruments)) {
        // @ts-ignore
        const instrument = group.instruments.find((inst) => inst.id === id);
        if (instrument) {
          // @ts-ignore
          return instrument.name; // ⭐️ استفاده از 'name'
        }
      }

      // 2. جستجو در زیر گروه‌ها (subgroups) (برای گروه ۳: سازهای زهی)
      if (group.subgroups && Array.isArray(group.subgroups)) {
          for (const subgroup of group.subgroups) {
              if (subgroup.instruments && Array.isArray(subgroup.instruments)) {
                  // @ts-ignore
                  const instrument = subgroup.instruments.find((inst) => inst.id === id);
                  if (instrument) {
                      // @ts-ignore
                      return instrument.name; // ⭐️ استفاده از 'name'
                  }
              }
          }
      }
    }
    return ''; // اگر ساز پیدا نشد، رشته خالی برگردانده شود
}

// تابع کمکی برای ساخت عنوان
function buildDynamicTitle(profile: any, instruments: { instrument_id: string }[]): string {
  const name = profile.name || profile.display_name;
  let prefix = '';

  // بررسی نقش از طریق آرایه roles
  const isMusicianOrTeacher = profile.roles?.includes('musician') || profile.roles?.includes('teacher');
  
  // انتخاب اولین ساز واکشی شده (فقط instrument_id نیاز است)
  const mainInstrumentId = instruments.length > 0 ? instruments[0].instrument_id : '';
  const mainInstrument = mainInstrumentId ? getInstrumentName(mainInstrumentId) : '';
  

  console.log('Instrument ID:', mainInstrumentId);
  console.log('Translated Instrument Name:', mainInstrument);


  // 1. تعیین نقش/عنوان اصلی
  if (profile.category === 'band') {
    prefix = roleLabels.band;
  } else if (profile.category === 'place' && profile.roles?.includes('school')) {
    prefix = roleLabels.school;
  } else if (isMusicianOrTeacher && mainInstrument) {
    // ⭐️ اگر نقش نوازنده/مدرس دارد و ساز هم دارد: نقش + ساز ⭐️
    // با توجه به لاگ شما ('musician', 'songWriter')، نقش 'musician' انتخاب می‌شود
    const role = profile.roles?.includes('teacher') ? roleLabels.teacher : roleLabels.musician;
    
    // مثال: نوازنده گیتار
    prefix = `${role} ${mainInstrument}`; 
  } else if (profile.roles && profile.roles.length > 0) {
    // اگر ساز نداشت یا نقش دیگری بود: فقط نقش
    prefix = roleLabels[profile.roles[0]] || profile.roles[0];
  } else {
    prefix = 'پروفایل'; // عنوان پیش‌فرض
  }

  // 2. تعیین شهر
  const cityFa = profile.city ? getCityFa(profile.province, profile.city) : '';
  const citySegment = cityFa ? ` در ${cityFa}` : '';

  // 3. ترکیب نهایی
  return `${prefix}${citySegment} | ${name}`;
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ display_name: string }> }) {
  const { display_name } = await params;
  const supabase = await createClient();
  const decodedDisplayName = decodeURIComponent(display_name);

  // Get profile data first
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      profile_instruments:profile_instruments(instrument_id, skill, type),
      profile_gallery(id, type, url, title)
    `)
    .eq('display_name', decodedDisplayName)
    .single();

  if (profileError || !profile) {
    return redirect('/');
  }

  // Get current user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Ensure both IDs are strings and trim any whitespace
  const userId = user?.id?.toString().trim();
  const profileId = profile?.id?.toString().trim();
  const isOwner = userId === profileId;
  
  // Debug profile data
  if (profileError) {
    console.error('Profile error:', profileError);
  }
  
  // // Debug: Check if profile exists and has required fields
  // if (!profile) {
  //   console.error('Profile not found for display_name:', decodedDisplayName);
  //   return <div>Profile not found</div>;
  // }

  // Debug: Log profile data for troubleshooting
  console.log('Profile data:', {
    id: profile.id,
    category: profile.category,
    roles: profile.roles,
    display_name: profile.display_name
  });

  // Get upcoming events for this profile
  let upcomingEvents: any[] = [];
  let pastEvents: any[] = [];
  if (profile.category === 'band') {
    // Only for bands: split future and past events
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayISO = today.toISOString().slice(0, 10);
    // Upcoming events (today or later)
    const { data: future } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        time,
        venue,
        poster_url
      `)
      .eq('created_by', profile.display_name)
      .eq('status', 'approved')
      .gte('date', todayISO)
      .order('date', { ascending: true })
      .limit(4);
    upcomingEvents = future || [];
    // Past events (before today)
    const { data: past } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        time,
        venue,
        poster_url
      `)
      .eq('created_by', profile.display_name)
      .eq('status', 'approved')
      .lt('date', todayISO)
      .order('date', { ascending: false })
      .limit(4);
    pastEvents = past || [];
  } else {
    // For non-bands, keep the old logic
    const { data: future } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        time,
        venue,
        poster_url
      `)
      .eq('created_by', profile.display_name)
      .eq('status', 'approved')
      .order('date', { ascending: true })
      .limit(4);
    upcomingEvents = future || [];
  }

  // همه رویدادها را بدون فیلتر بگیریم تا ببینیم created_by چه مقادیری دارد
  const { data: allEvents } = await supabase
    .from('events')
    .select('id, title, created_by')
    .limit(10);
  
  

  // Get band members if profile is a band
  let bandMembers = null;
  if (profile?.category === 'band') {
    console.log('Fetching band members for profile:', profile.id);
    const { data: members, error: membersError } = await supabase
      .from('band_members')
      .select(`
        id,
        member:profiles!member_id(
          id,
          display_name,
          name,
          avatar_url
        )
      `)
      .eq('band_id', profile.id)
      .eq('status', 'accepted');
    
    if (membersError) {
      console.error('Error fetching band members:', membersError);
    }
    
    console.log('Band members fetched:', members);
    bandMembers = members;
  }

  // Get band memberships if profile is a musician/vocalist
  let bandMemberships = null;
  if (profile?.roles?.some((role: string) => ['musician', 'vocalist'].includes(role))) {
    console.log('Fetching band memberships for profile:', profile.id);
    const { data: memberships, error: membershipsError } = await supabase
      .from('band_members')
      .select(`
        id,
        band:profiles!band_id(
          id,
          display_name,
          name,
          avatar_url
        )
      `)
      .eq('member_id', profile.id)
      .eq('status', 'accepted');
    
    if (membershipsError) {
      console.error('Error fetching band memberships:', membershipsError);
    }
    
    console.log('Band memberships fetched:', memberships);
    bandMemberships = memberships;
  }

  // Get school memberships if profile is a teacher
  let schoolMemberships = null;
  if (profile?.roles?.includes('teacher')) {
    console.log('Fetching school memberships for profile:', profile.id);
    const { data: memberships, error: membershipsError } = await supabase
      .from('school_teachers')
      .select(`
        id,
        school:profiles!school_id(
          id,
          display_name,
          name,
          avatar_url
        )
      `)
      .eq('teacher_id', profile.id)
      .eq('status', 'accepted');
    
    if (membershipsError) {
      console.error('Error fetching school memberships:', membershipsError);
    }
    
    console.log('School memberships fetched:', memberships);
    schoolMemberships = memberships;
  }

  // Get teachers if profile is a school
  let schoolTeachers = null;
  if (profile?.category === 'place' && profile?.roles?.includes('school')) {
    console.log('Fetching school teachers for profile:', profile.id);
    const { data: teachers, error: teachersError } = await supabase
      .from('school_teachers')
      .select(`
        id,
        teacher:profiles!teacher_id(
          id,
          display_name,
          name,
          avatar_url
        )
      `)
      .eq('school_id', profile.id)
      .eq('status', 'accepted');
    
    if (teachersError) {
      console.error('Error fetching school teachers:', teachersError);
    }
    
    console.log('School teachers fetched:', teachers);
    
    if (teachers && teachers.length > 0) {
      for (const t of teachers) {
        const teacherObj = Array.isArray(t.teacher) ? t.teacher[0] : t.teacher;
        if (!teacherObj) continue;
        const { data: instruments } = await supabase
          .from('profile_instruments')
          .select('instrument_id, skill')
          .eq('profile_id', teacherObj.id)
          .eq('type', 'teacher');
        (teacherObj as any).instruments = instruments || [];
      }
    }
    schoolTeachers = teachers;
  }

  // Check if current user can request to join band
  const canRequestToJoin = userId && !isOwner && 
    profile.category === 'band' && 
    profile.looking_for_musician &&
    (await supabase
      .from('profiles')
      .select('category, roles')
      .eq('id', userId)
      .single()
    ).data?.roles?.some((role: string) => ['musician', 'vocalist', 'singer'].includes(role));

  // Check if current user has already sent a request or has active membership
  let hasActiveRequest = false;
  let isActiveMember = false;

  if (userId) {
    const { data: existingRequest } = await supabase
      .from('band_members')
      .select('status')
      .eq('band_id', profile.id)
      .eq('member_id', userId)
      .single();

    hasActiveRequest = existingRequest?.status === 'requested';
    isActiveMember = existingRequest?.status === 'accepted';
  }

  // Check for pending invites if user is viewing their own profile
  let pendingBandInvites = null;
  let pendingSchoolInvites = null;
  let pendingBandRequests = null;
  
  if (isOwner && userId) {
    // Check for band invites if user is a musician or vocalist
    if (profile.roles?.some((role: string) => ['musician', 'vocalist', 'singer'].includes(role))) {
      const { data: bandInvites } = await supabase
        .from('band_members')
        .select(`
          *,
          band:profiles!band_id(*)
        `)
        .eq('member_id', userId)
        .eq('status', 'pending');
      
      pendingBandInvites = bandInvites;
    }

    // Check for band requests if user is a band
    if (profile.category === 'band') {
      const { data: bandRequests } = await supabase
        .from('band_members')
        .select(`
          *,
          member:profiles!member_id(id, name, display_name, avatar_url)
        `)
        .eq('band_id', profile.id)
        .eq('status', 'requested');
      
      pendingBandRequests = bandRequests;
    }

    // Check for school invites if user is a teacher
    if (profile.roles?.includes('teacher')) {
      const { data: schoolInvites } = await supabase
        .from('school_teachers')
        .select(`
          *,
          school:profiles!school_id(id, name, display_name)
        `)
        .eq('teacher_id', userId)
        .eq('status', 'pending');
      pendingSchoolInvites = schoolInvites;
    }
  }

  // Check if current user can invite this profile
  const canInviteToBand = userId && !isOwner && 
    profile.roles?.some((role: string) => ['musician', 'vocalist', 'singer'].includes(role)) &&
    (await supabase
      .from('profiles')
      .select('category')
      .eq('id', userId)
      .eq('category', 'band')
      .single()
    ).data;

  const canInviteToSchool = userId && !isOwner && 
    profile.roles?.includes('teacher') &&
    (await supabase
      .from('profiles')
      .select('category, roles')
      .eq('id', userId)
      .eq('category', 'place')
      .contains('roles', ['school'])
      .single()
    ).data;

  // Check if current user has already sent a school invite
  const { data: existingSchoolInvite } = canInviteToSchool ? await supabase
    .from('school_teachers')
    .select('status')
    .eq('school_id', userId)
    .eq('teacher_id', profile.id)
    .single() : { data: null };

  const hasActiveSchoolInvite = existingSchoolInvite?.status === 'pending';
  const isActiveSchoolTeacher = existingSchoolInvite?.status === 'accepted';

  // Check if current user can request to teach at school
  const canRequestToTeach = userId && !isOwner && 
    profile.category === 'place' && 
    profile.roles?.includes('school') &&
    (await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single()
    ).data?.roles?.includes('teacher');

  // Check if current user has already sent a request or is an active teacher
  const { data: existingTeachingRequest } = await supabase
    .from('school_teachers')
    .select('status')
    .eq('school_id', profile.id)
    .eq('teacher_id', userId)
    .single();

  const hasActiveTeachingRequest = existingTeachingRequest?.status === 'requested';
  const isActiveTeacher = existingTeachingRequest?.status === 'accepted';

  if (profileError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">پروفایل پیدا نشد</h1>
          <p className="text-gray-600 mb-6">متأسفانه پروفایل مورد نظر یافت نشد.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">بازگشت به صفحه اصلی</Link>
        </div>
      </div>
    );
  }

  // Helper for gender
  const genderLabel = profile.gender === 'male' ? 'مرد' : profile.gender === 'female' ? 'زن' : 'مختلط';
  // Role labels in Farsi
  const roleLabels: Record<string, string> = {
    musician: 'نوازنده',
    teacher: 'مدرس',
    vocalist: 'خواننده',
    band: 'گروه',
    singer: 'خواننده',
    songWriter: 'آهنگساز',
    arranger: 'تنظیم‌کننده',
    soundEngineer: 'صدابردار',
    producer: 'تهیه‌کننده',
    lyricist: 'ترانه‌سرا',
    photographer: 'عکاس/تصویربردار',
    lighting: 'نورپرداز',
    director: 'کارگردان (موزیک ویدئو)',
    manager: 'مدیر برنامه',
    school: 'آموزشگاه موسیقی',
    recordingStudio: 'استودیو ضبط',
    rehearsalSpace: 'فضای تمرین',
    venue: 'مکان اجرا',
    // ... add more as needed
  };

  // ابزار کمکی برای نام فارسی سازها
  const getInstrumentNameLocal = getInstrumentName; // Reuse the module-level function

  // ابزار کمکی برای نام فارسی استان و شهر
  const getProvinceFa = function(id: string) {
    const p = provinceCity.find((p: any) => p['province-en'] === id || p['province-fa'] === id);
    return p ? p['province-fa'] : id;
  }

  const getCityFa = function(provinceId: string, cityId: string) {
    const p = provinceCity.find((p: any) => p['province-en'] === provinceId || p['province-fa'] === provinceId);
    if (!p) return cityId;
    const c = p.cities.find((c: any) => c['city-en'] === cityId || c['city-fa'] === cityId);
    return c ? c['city-fa'] : cityId;
  }
  // ابزار کمکی برای مهارت
  const skillLabels: Record<string, string> = {
    beginner: 'مبتدی',
    intermediate: 'متوسط',
    advanced: 'پیشرفته',
    professional: 'حرفه‌ای'
  };
  // سازها به تفکیک نوازنده و مدرس
  const instruments = profile.profile_instruments || [];
  const musicianInstruments = instruments.filter((i: any) => i.type === 'playing');
  const teacherInstruments = instruments.filter((i: any) => i.type === 'teaching');

  // محاسبه سن کاربر
  const age = profile.birth_year ? (1403 - parseInt(profile.birth_year, 10)) : null;
  // محاسبه سابقه فعالیت
  const experience = profile.music_experience ? (1403 - parseInt(profile.music_experience, 10)) : null;

  // افزودن تابع کمکی برای فرمت صحیح لینک‌ها
  const formatUrl = function(url: string) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return 'https://' + url;
  }

  const formatTelegramUrl = function(telegramInput: string) {
    if (!telegramInput) return '';
    
    // Remove @ if present at the beginning
    let username = telegramInput.replace(/^@/, '');
    
    // If it's already a full URL, return as is
    if (/^https?:\/\//i.test(telegramInput)) {
      return telegramInput;
    }
    
    // If it contains t.me, format it properly
    if (telegramInput.includes('t.me/')) {
      if (!/^https?:\/\//i.test(telegramInput)) {
        return 'https://' + telegramInput;
      }
      return telegramInput;
    }
    
    // Otherwise, treat as username and create t.me link
    return `https://t.me/${username}`;
  }

  

  return (
    <>
      <div className="min-h-screen bg-gray-900 pb-12">
        {/* Banner */}
        <div className="relative h-56 bg-gradient-to-r from-yellow-100 to-orange-100 flex items-end">
          {/* Blurred background from avatar */}
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="avatar-bg"
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
            />
          )}
          <div className="relative z-10 flex items-end w-full max-w-5xl mx-auto px-6 pb-4">
            <div className="flex items-end gap-6 w-full">
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white drop-shadow">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/80">{profile.display_name}<span className='mx-1'>@</span></span>
                  {profile.category === 'band' && (
                    <span className="bg-white/80 text-gray-800 text-xs rounded px-2 py-0.5 ml-2">گروه موسیقی</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.roles?.map((role: string) => (
                    <span key={role} className="bg-gray-500/20 text-white text-sm rounded px-2 py-0.5">
                      {roleLabels[role] || role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    {/* For debugging */}
                    {/* <div className="text-white">Category: {profile.category}</div> */}
                    
                    <Link
                      href="/profile/edit"
                      title="ویرایش پروفایل"
                      className="bg-amber-400 text-white p-2 rounded-full hover:bg-amber-500 transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Link>

                    {/* Band Management */}
                    {profile.category === 'band' && (
                      <Link
                        href="/band/members"
                        title="مدیریت اعضا"
                        className={`relative p-2 rounded-full transition-colors flex items-center justify-center ${
                          pendingBandRequests && pendingBandRequests.length > 0 
                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {pendingBandRequests && pendingBandRequests.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                            {pendingBandRequests.length}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* School Management */}
                    {profile.category === 'place' && profile.roles?.includes('school') && (
                      <Link
                        href="/school/teachers"
                        title="مدیریت اساتید"
                        className="bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition-colors flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </Link>
                    )}

                    {/* Events Management - for all users */}
                    <Link
                      href="/events/my-events"
                      title="مدیریت رویدادها"
                      className="bg-amber-600 text-white p-2 rounded-full hover:bg-amber-700 transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </Link>

                    {/* Band Invites Management - for musicians and vocalists */}
                    {profile.roles?.some((role: string) => ['musician', 'vocalist'].includes(role)) && 
                     profile.category !== 'band' && 
                     !(profile.category === 'place' && profile.roles?.includes('school')) && (
                      <Link
                        href="/invites/band"
                        title="مدیریت عضویت در گروه‌های موسیقی"
                        className="bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition-colors flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        {pendingBandInvites && pendingBandInvites.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                            {pendingBandInvites.length}
                          </span>
                        )}
                      </Link>
                    )}



                    {/* School Invites Management - for teachers */}
                    {profile.roles?.includes('teacher') && (
                      <Link
                        href="/invites/school"
                        title="مدیریت تدریس در آموزشگاه‌های موسیقی"
                        className={`relative p-2 rounded-full transition-colors flex items-center justify-center ${
                          pendingSchoolInvites && pendingSchoolInvites.length > 0 
                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        {pendingSchoolInvites && pendingSchoolInvites.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                            {pendingSchoolInvites.length}
                          </span>
                        )}
                      </Link>
                    )}
                  </>
                )}
                {canInviteToBand && (
                  <InviteButtons 
                    type="band"
                    targetId={profile.id}
                    currentUserId={userId}
                  />
                )}
                {canInviteToSchool && !hasActiveSchoolInvite && !isActiveSchoolTeacher && (
                  <form action={async () => {
                    'use server'
                    try {
                      const supabase = await createClient()
                      
                      // Check authentication first
                      const { data: { user }, error: userError } = await supabase.auth.getUser()
                      if (userError || !user) {
                        console.error('Authentication error:', userError)
                        throw new Error('Authentication required')
                      }
                      
                      console.log('User authenticated:', user.id)
                      
                      // Check if there's already an active invite
                      const { data: existingInvite, error: inviteCheckError } = await supabase
                        .from('school_teachers')
                        .select('id, status')
                        .eq('school_id', user.id)
                        .eq('teacher_id', profile.id)
                        .maybeSingle()

                      if (inviteCheckError) {
                        console.error('Error checking invite status:', inviteCheckError)
                        throw new Error(`Failed to check invite status: ${inviteCheckError.message}`)
                      }

                      if (existingInvite) {
                        throw new Error('An invite already exists')
                      }
                      
                      console.log('Inserting school teacher record...')
                      const { data, error } = await supabase
                        .from('school_teachers')
                        .insert([
                          {
                            school_id: user.id,
                            teacher_id: profile.id,
                            status: 'pending',
                            role: 'teacher'
                          }
                        ])
                        .select()

                      if (error) {
                        console.error('School teacher insert error:', error)
                        throw new Error(`Failed to send invite: ${error.message} (Code: ${error.code})`)
                      }
                      
                      console.log('Successfully inserted:', data)
                      redirect(`/profile/${decodedDisplayName}`)
                    } catch (error) {
                      console.error('Server action error:', error)
                      throw error
                    }
                  }}>
                    <button
                      type="submit"
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      <span>دعوت به همکاری</span>
                    </button>
                  </form>
                )}
                {canInviteToSchool && hasActiveSchoolInvite && (
                  <button
                    disabled
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>دعوت ارسال شده</span>
                  </button>
                )}
                {canInviteToSchool && isActiveSchoolTeacher && (
                  <button
                    disabled
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>مدرس آموزشگاه</span>
                  </button>
                )}
                {canRequestToTeach && !hasActiveTeachingRequest && !isActiveTeacher && (
                  <TeachingRequestButton 
                    schoolId={profile.id}
                    userId={userId}
                    hasActiveRequest={hasActiveTeachingRequest}
                    isActiveTeacher={isActiveTeacher}
                  />
                )}
                {hasActiveTeachingRequest && (
                  <button
                    disabled
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>درخواست در حال بررسی</span>
                  </button>
                )}
                {isActiveTeacher && (
                  <button
                    disabled
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>مدرس آموزشگاه</span>
                  </button>
                )}
                {canRequestToJoin && !hasActiveRequest && !isActiveMember && (
                  <CollaborationRequestButton 
                    bandId={profile.id}
                    userId={userId}
                    hasActiveRequest={hasActiveRequest}
                    isActiveMember={isActiveMember}
                  />
                )}
                {hasActiveRequest && userId && (
                  <CollaborationRequestButton 
                    bandId={profile.id}
                    userId={userId}
                    hasActiveRequest={hasActiveRequest}
                    isActiveMember={isActiveMember}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Left: Personal & Contact Info */}
          <div className="space-y-6 md:col-span-1">
            {/* Personal Info */}
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4 text-orange-500">اطلاعات شخصی</h2>
              <div className="space-y-2 text-gray-100 text-sm">
                <div><span className="font-bold">جنسیت:</span> {genderLabel}</div>
                {profile.category === 'person' && (
                  <div><span className="font-bold">سن:</span> {age ? `${age} سال` : '-'}</div>
                )}
                <div><span className="font-bold">استان:</span> {getProvinceFa(profile.province)}</div>
                <div><span className="font-bold">شهر:</span> {getCityFa(profile.province, profile.city)}</div>
              </div>
            </div>
            {/* Contact Info */}
              <div className="bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4 text-orange-500">اطلاعات تماس</h2>
              <div className="space-y-2 text-gray-100 text-sm">
                {profile.phone?.trim() && (
                  <div><span className="font-bold">موبایل:</span> {profile.phone}</div>
                )}
                {profile.social_links?.instagram?.trim() && (
                  <div><span className="font-bold">اینستاگرام:</span> 
                    <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline mr-1">{profile.social_links.instagram}</a>
                  </div>
                )}
                {profile.social_links?.telegram?.trim() && (
                  <div><span className="font-bold">تلگرام:</span> 
                    <a href={formatTelegramUrl(profile.social_links.telegram)} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline mr-1">{profile.social_links.telegram}</a>
                  </div>
                )}
                {profile.social_links?.youtube?.trim() && (
                  <div><span className="font-bold">یوتیوب:</span> 
                    <a href={formatUrl(profile.social_links.youtube)} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline mr-1">{profile.name || profile.display_name || 'یوتیوب'}</a>
                  </div>
                )}
                {profile.website?.trim() && (
                  <div><span className="font-bold">وب‌سایت:</span> 
                    <a href={formatUrl(profile.website)} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline mr-1">{profile.website}</a>
                  </div>
                )}
                {profile.address?.trim() && (
                  <div><span className="font-bold">آدرس:</span> {profile.address}</div>
                )}
              </div>
            </div>

            {/* Debug Section - Show data for debugging */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <h2 className="text-lg font-bold mb-4 text-yellow-500">Debug Info</h2>
                <div className="space-y-2 text-sm text-gray-300">
                  <div><span className="font-bold">Profile Category:</span> {profile.category}</div>
                  <div><span className="font-bold">Profile Roles:</span> {profile.roles?.join(', ') || 'None'}</div>
                  <div><span className="font-bold">Band Members:</span> {bandMembers ? `${bandMembers.length} members` : 'null'}</div>
                  <div><span className="font-bold">Band Memberships:</span> {bandMemberships ? `${bandMemberships.length} memberships` : 'null'}</div>
                  <div><span className="font-bold">School Memberships:</span> {schoolMemberships ? `${schoolMemberships.length} memberships` : 'null'}</div>
                  <div><span className="font-bold">School Teachers:</span> {schoolTeachers ? `${schoolTeachers.length} teachers` : 'null'}</div>
                </div>
              </div>
            )}

            {/* Band Members Section - Show only for bands */}
            {profile.category === 'band' && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">اعضای گروه</h2>
                {!bandMembers && <p className="text-gray-400">در حال بارگذاری...</p>}
                {bandMembers && bandMembers.length === 0 && <p className="text-gray-400">هیچ عضوی یافت نشد</p>}
                {bandMembers && bandMembers.length > 0 && (
                  <div className="space-y-4">
                    {bandMembers.map((membership: any) => (
                      <Link 
                        key={membership.id} 
                        href={`/profile/${membership.member.display_name}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {membership.member.avatar_url ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={membership.member.avatar_url}
                              alt={membership.member.name}
                              fill
                              sizes="(max-width: 768px) 48px, 96px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-100 font-medium">{membership.member.name}</div>
                          <div className="text-gray-400 text-sm">@{membership.member.display_name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* Band Memberships Section - Show only for musicians/vocalists */}
            {profile.roles?.some((role: string) => ['musician', 'vocalist'].includes(role)) && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">عضویت در گروه‌ها</h2>
                {!bandMemberships && <p className="text-gray-400">در حال بارگذاری...</p>}
                {/* {bandMemberships && bandMemberships.length === 0 && <p className="text-gray-400">عضو هیچ گروهی نیست</p>} */}
                {bandMemberships && bandMemberships.length > 0 && (
                  <div className="space-y-4">
                    {bandMemberships.map((membership: any) => (
                      <Link 
                        key={membership.id} 
                        href={`/profile/${membership.band.display_name}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {membership.band.avatar_url ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={membership.band.avatar_url}
                              alt={membership.band.name}
                              fill
                              sizes="(max-width: 768px) 48px, 96px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl">🎵</span>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-100 font-medium">{membership.band.name}</div>
                          <div className="text-gray-400 text-sm">@{membership.band.display_name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* School Memberships Section - Show only for teachers */}
            {profile.roles?.includes('teacher') && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">تدریس در آموزشگاه‌ها</h2>
                {!schoolMemberships && <p className="text-gray-400">در حال بارگذاری...</p>}
                {/* {schoolMemberships && schoolMemberships.length === 0 && <p className="text-gray-400">در هیچ آموزشگاهی تدریس نمی‌کند</p>} */}
                {schoolMemberships && schoolMemberships.length > 0 && (
                  <div className="space-y-4">
                    {schoolMemberships.map((membership: any) => (
                      <Link 
                        key={membership.id} 
                        href={`/profile/${membership.school.display_name}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {membership.school.avatar_url ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={membership.school.avatar_url}
                              alt={membership.school.name}
                              fill
                              sizes="(max-width: 768px) 48px, 96px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl">🏫</span>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-100 font-medium">{membership.school.name}</div>
                          <div className="text-gray-400 text-sm">@{membership.school.display_name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* Pending School Invites Section - Show only for teachers */}
            {isOwner && profile.roles?.includes('teacher') && 
             pendingSchoolInvites && pendingSchoolInvites.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-500">
                <h2 className="text-lg font-bold mb-4 text-orange-500 flex items-center gap-2">
                  <span>📨</span>
                  دعوت‌های دریافتی از آموزشگاه‌ها
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingSchoolInvites.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {pendingSchoolInvites.map((invite: any) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                      <div className="flex items-center gap-3">
                        {invite.school?.avatar_url ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={invite.school.avatar_url}
                              alt={invite.school.name}
                              fill
                              sizes="(max-width: 768px) 48px, 96px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                            <span className="text-2xl">🏫</span>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-100 font-medium">{invite.school?.name || 'آموزشگاه موسیقی'}</div>
                          <div className="text-gray-400 text-sm">@{invite.school?.display_name || 'unknown'}</div>
                          <div className="text-orange-400 text-xs">در انتظار پاسخ شما</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/invites/school"
                          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                        >
                          مشاهده جزئیات
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* School Teachers Section - Show only for schools */}
            {profile.category === 'place' && profile.roles?.includes('school') && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">اساتید آموزشگاه</h2>
                {!schoolTeachers && <p className="text-gray-400">در حال بارگذاری...</p>}
                {schoolTeachers && schoolTeachers.length === 0 && <p className="text-gray-400">هیچ استادی یافت نشد</p>}
                {schoolTeachers && schoolTeachers.length > 0 && (
                  <div className="space-y-4">
                    {schoolTeachers.map((membership: any) => (
                      <Link 
                        key={membership.id} 
                        href={`/profile/${membership.teacher.display_name}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {membership.teacher.avatar_url ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={membership.teacher.avatar_url}
                              alt={membership.teacher.name}
                              fill
                              sizes="(max-width: 768px) 48px, 96px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-100 font-medium">{membership.teacher.name}</div>
                          <div className="text-gray-400 text-sm">@{membership.teacher.display_name}</div>
                          {membership.teacher.instruments && membership.teacher.instruments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {membership.teacher.instruments.map((inst: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full border border-green-500 text-xs font-medium bg-gray-800 text-gray-100">
                                  {getInstrumentName(inst.instrument_id)}
                                  {inst.skill && (
                                    <span className="ml-1 text-gray-400">({skillLabels[inst.skill] || inst.skill})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}


          </div>

          {/* Middle: About & Instruments */}
          <div className="space-y-6 md:col-span-2">
            {/* About */}
            {profile.description && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">درباره من</h2>
                <p className="text-gray-100 whitespace-pre-line">{profile.description}</p>
              </div>
            )}

            {/* Events Section */}
            {upcomingEvents && upcomingEvents.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">رویدادهای پیش رو</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <Link 
                      key={event.id} 
                      href={`/events/${event.id}`}
                      className="block group"
                    >
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-700">
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          {event.poster_url ? (
                            <img
                              src={event.poster_url}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <span>🎵</span>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-bold mb-1 line-clamp-1">{event.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              {new Date(event.date).toLocaleDateString('fa-IR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏰</span>
                              {event.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Past Events Section (only for bands and if there are any) */}
            {profile.category === 'band' && (pastEvents as any[]) && (pastEvents as any[]).length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow p-6 mt-6">
                <h2 className="text-lg font-bold mb-4 text-orange-400">رویدادهای گذشته</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(pastEvents as any[]).map((event) => (
                    <Link 
                      key={event.id} 
                      href={`/events/${event.id}`}
                      className="block group opacity-70 hover:opacity-100"
                    >
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-700">
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          {event.poster_url ? (
                            <img
                              src={event.poster_url}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>🎵</span>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-bold mb-1 line-clamp-1">{event.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              {new Date(event.date).toLocaleDateString('fa-IR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏰</span>
                              {event.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Instruments */}
            {(musicianInstruments.length > 0 || teacherInstruments.length > 0) && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">سازها و مهارت‌ها</h2>
                {musicianInstruments.length > 0 && (
                  <div className="mb-2">
                    <div className="font-bold mb-1 text-gray-100">سازهایی که مینوازم:</div>
                    <div className="flex flex-wrap gap-2">
                      {musicianInstruments.map((item: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500 text-sm font-medium bg-gray-800 text-gray-100">
                          {getInstrumentName(item.instrument_id)}
                          {item.skill && (
                            <span className="ml-2 text-xs text-gray-400">({skillLabels[item.skill] || item.skill})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {teacherInstruments.length > 0 && (
                  <div className="mb-2">
                    <div className="font-bold mb-1 text-gray-100">سازهایی که تدریس می‌کنم:</div>
                    <div className="flex flex-wrap gap-2">
                      {teacherInstruments.map((item: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full border border-green-500 text-sm font-medium bg-gray-800 text-gray-100">
                          {getInstrumentName(item.instrument_id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Extra Info */}
            {(experience !== null || profile.equipments || profile.performance_count || profile.ready_for_cooperate || profile.looking_for_musician) && (
              <div className="bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4 text-orange-500">اطلاعات تخصصی</h2>
                <div className="space-y-2 text-gray-100 text-sm">
                  {experience !== null && <div><span className="font-bold">سابقه:</span> {experience} سال</div>}
                  {profile.equipments && <div><span className="font-bold">تجهیزات:</span> {profile.equipments}</div>}
                  {profile.performance_count && <div><span className="font-bold">تعداد اجرا:</span> {profile.performance_count === 'lt10' ? 'کمتر از 10 اجرا' : profile.performance_count === '10to30' ? 'بین 10 تا 30 اجرا' : profile.performance_count === 'gt30' ? 'بیشتر از 30 اجرا' : profile.performance_count}</div>}
                  {profile.ready_for_cooperate && (
                    <div className="flex items-center gap-2 text-amber-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>آماده همکاری هستم</span>
                    </div>
                  )}
                  {profile.looking_for_musician && (
                    <div className="flex items-center gap-2 text-amber-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      <span>پذیرای همکاری هستیم</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Gallery */}
            {profile.profile_gallery && profile.profile_gallery.length > 0 && (
              <GallerySection gallery={profile.profile_gallery} />
            )}
          </div>
        </div>
      </div>
      <ImageGalleryModal />
    </>
  );
}

interface MetadataProps {
  params: Promise<{
    display_name: string
  }>
}

export async function generateMetadata({ params }: MetadataProps) {
    // ⭐️ رفع خطای Next.js: باید params را await کنید ⭐️
  const { display_name } = await params; 
  const supabase = await createClient()
  
  try {
    // 1. واکشی داده‌ها
    const { data } = await supabase
      .from('profiles')
      .select(`
        name, 
        display_name, 
        description, 
        roles,
        province,
        city,
        category,
        profile_instruments:profile_instruments(instrument_id) // ⭐️ فیلد type حذف شد ⭐️
      `)
      .eq('display_name', display_name)
      .single()

    if (!data) {
        // ...
    }
    
    const fetchedData: any = data;
    const { profile_instruments, ...profile } = fetchedData;

    // 2. ساخت عنوان پویا
    const instruments = profile_instruments || []; 
    const dynamicTitle = buildDynamicTitle(profile, instruments);

    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
      title: dynamicTitle,
      description: profile.description || `پروفایل ${profile.display_name} در Musicians Directory`,
      openGraph: {
        title: profile.name || profile.display_name,
        description: profile.description,
      },
    }
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    return {
      title: 'Musicians Directory',
    }
  }
}
