"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Province, City } from '@/types/profile'
import categoryRoles from '@/data/category_role.json'
import instrumentGroups from '@/data/instruments'
import { instrumentGroups as schoolInstrumentGroups } from '@/data/school_instruments'
import { deleteProfile } from '@/app/actions/profile'

interface Instrument {
  id: string
  name: string
}

interface InstrumentGroup {
  id: number
  name: string
  instruments?: Instrument[]
  subgroups?: {
    id: string
    name: string
    instruments: Instrument[]
  }[]
}

interface EditProfileFormProps {
  userId: string
  initialProfile: Database['public']['Tables']['profiles']['Row'] | null
  provinces: Province[]
  categoryOptions: { value: string; label: string; roles: any[] }[]
}

interface FormData {
  display_name: string
  name: string
  gender: 'male' | 'female' | 'mixed' | ''
  birth_year: string
  province: string
  city: string
  avatar_url: string
  description: string
  phone: string
  address: string
  category: 'person' | 'crew' | 'place' | 'band' | ''
  roles: string[]
  performance_count?: string
  music_experience?: string
  equipments?: string
  website?: string
  social_links: { telegram?: string; youtube?: string; instagram?: string }
  ready_for_cooperate?: boolean
  looking_for_musician?: boolean
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'مبتدی' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'پیشرفته' },
  { value: 'professional', label: 'حرفه‌ای' }
]

const CATEGORY_OPTIONS = categoryRoles.map(item => ({
  value: item.key,
  label: item.label,
  roles: item.roles
}))

function CategorySelection({ onSelect, selectedCategory, categoryOptions }: { 
  onSelect: (category: 'person' | 'crew' | 'place' | 'band') => void, 
  selectedCategory: string,
  categoryOptions: { value: string; label: string }[]
}) {
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-4">لطفاً دسته‌بندی خود را انتخاب کنید</label>
      <div className="flex flex-wrap gap-4">
        {categoryOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value as 'person' | 'crew' | 'place' | 'band')}
            className={`px-6 py-3 rounded-md text-lg ${
              selectedCategory === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function EditProfileForm({ userId, initialProfile, provinces, categoryOptions }: EditProfileFormProps) {
  const [form, setForm] = useState<FormData>({
    display_name: '',
    name: '',
    gender: '',
    birth_year: '',
    province: '',
    city: '',
    avatar_url: '',
    description: '',
    phone: '',
    address: '',
    category: '',
    roles: [],
    performance_count: '',
    music_experience: '',
    equipments: '',
    website: '',
    social_links: {},
    ready_for_cooperate: false,
    looking_for_musician: false
  })

  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // state برای سازهای نوازنده
  const [musicianInstruments, setMusicianInstruments] = useState<{ instrument: string, skill: string }[]>([])
  // state برای سازهای مدرس
  const [teacherInstruments, setTeacherInstruments] = useState<string[]>([])
  // state برای نمایش منوی افزودن ساز
  const [showAddInstrument, setShowAddInstrument] = useState<'musician' | 'teacher' | 'school' | null>(null)
  // state برای انتخاب موقت ساز و مهارت
  const [selectedMusicianInstrument, setSelectedMusicianInstrument] = useState<string>('')
  const [selectedMusicianSkill, setSelectedMusicianSkill] = useState<string>('beginner')
  const [selectedTeacherInstrument, setSelectedTeacherInstrument] = useState<string>('')
  const [schoolInstruments, setSchoolInstruments] = useState<string[]>([])
  const [selectedSchoolInstrument, setSelectedSchoolInstrument] = useState<string>('')

  // استخراج لیست سازها (flat)
  const allInstruments = instrumentGroups.flatMap(group =>
    group.instruments ? group.instruments :
      group.subgroups ? group.subgroups.flatMap(sub => sub.instruments) : []
  )

  // استخراج لیست سازها برای آموزشگاه (flat)
  const allSchoolInstruments = (schoolInstrumentGroups as unknown as InstrumentGroup[]).flatMap(group =>
    group.instruments ? group.instruments :
      group.subgroups ? group.subgroups.flatMap(sub => sub.instruments) : []
  )

  // آیا نقش musician انتخاب شده؟
  const isMusician = form.roles.includes('musician')
  // آیا نقش teacher انتخاب شده؟
  const isTeacher = form.roles.includes('teacher')
  // آیا نقش آموزشگاه موسیقی انتخاب شده؟
  const isMusicSchool = form.roles.includes('school')

  const [instrumentsLoaded, setInstrumentsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'extra' | 'gallery' | 'danger'>('personal');



  // stateهای گالری
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<{ url: string; title: string }[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [instagramError, setInstagramError] = useState<string | null>(null)

  // Mapping for skill levels in Farsi
  const skillLabels: Record<string, string> = {
    beginner: 'مبتدی',
    intermediate: 'متوسط',
    advanced: 'پیشرفته',
    professional: 'حرفه‌ای'
  };

  // تابع استخراج نام کاربری اینستاگرام
  const extractInstagramHandle = (input: string): string => {
    // حذف @ از ابتدای رشته
    input = input.replace(/^@/, '');
    
    // الگوهای مختلف لینک اینستاگرام
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?/,
      /([A-Za-z0-9._]+)/ // اگر فقط نام کاربری وارد شده باشد
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return input;
  };

  // Add new state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add delete profile handler
  const handleDeleteProfile = async () => {
    try {
      setLoading(true);
      setDeleteError(null);
      
      const { error, redirect } = await deleteProfile();
      
      if (error) {
        setDeleteError(error);
        return;
      }

      if (redirect) {
        // Sign out from client side
        await supabase.auth.signOut();
        // Redirect to home page
        window.location.href = redirect;
      }
    } catch (error) {
      setDeleteError('خطا در حذف پروفایل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialProfile) {
      setForm({
        display_name: initialProfile.display_name || '',
        name: initialProfile.name || '',
        gender: initialProfile.gender || '',
        birth_year: initialProfile.birth_year?.toString() || '',
        province: initialProfile.province || '',
        city: initialProfile.city || '',
        avatar_url: initialProfile.avatar_url ? initialProfile.avatar_url : '',
        description: initialProfile.description || '',
        phone: initialProfile.phone || '',
        address: initialProfile.address || '',
        category: (['person','crew','place','band'].includes(initialProfile.category as string) ? initialProfile.category as 'person' | 'crew' | 'place' | 'band' : ''),
        roles: Array.isArray(initialProfile.roles) ? initialProfile.roles : (initialProfile.roles ? [initialProfile.roles] : []),
        performance_count: (initialProfile as any).performance_count?.toString() || '',
        music_experience: (initialProfile as any).music_experience?.toString() || '',
        equipments: (initialProfile as any).equipments || '',
        website: (initialProfile as any).website || '',
        social_links: (initialProfile as any).social_links || {},
        ready_for_cooperate: (initialProfile as any).ready_for_cooperate ?? false,
        looking_for_musician: (initialProfile as any).looking_for_musician ?? false
      });
      // مقداردهی اولیه cities
      if (initialProfile.province) {
        const provinceData = provinces.find(p => p.id === initialProfile.province);
        if (provinceData) {
          setCities(provinceData.cities);
        }
      }
    }
  }, [initialProfile, provinces]);

  useEffect(() => {
    const fetchInstruments = async () => {
      const { data, error } = await supabase
        .from('profile_instruments')
        .select('*')
        .eq('profile_id', userId);

      if (!error && data) {
        setMusicianInstruments(data.filter(i => i.type === 'musician').map(i => ({
          instrument: i.instrument_id,
          skill: i.skill
        })));
        setTeacherInstruments(data.filter(i => i.type === 'teacher').map(i => i.instrument_id));
        setSchoolInstruments(data.filter(i => i.type === 'school').map(i => i.instrument_id));
      }
    };
    if (userId) fetchInstruments();
  }, [userId]);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from('profile_gallery')
        .select('*')
        .eq('profile_id', userId);
      if (!error && data) {
        setGalleryImages(data.filter(i => i.type === 'image').map(i => i.url));
        setGalleryVideos(data.filter(i => i.type === 'video').map(i => ({
          url: i.url,
          title: i.title
        })));
      }
    };
    if (userId) fetchGallery();
  }, [userId]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProvince = e.target.value
    setForm(prev => ({ ...prev, province: selectedProvince, city: '' }))
    if (selectedProvince) {
      const provinceCities = provinces.find(p => p.id === selectedProvince)?.cities || []
      setCities(provinceCities)
    } else {
      setCities([])
    }
  }

  const validateForm = () => {
    let valid = true
    setError(null)
    setPhoneError(null)
    setInstagramError(null)
    if (form.display_name && !/^[a-zA-Z0-9._]+$/.test(form.display_name)) {
      setError('نام کاربری فقط باید شامل حروف انگلیسی، عدد، نقطه یا زیرخط باشد (بدون فاصله و بدون حروف فارسی)')
      valid = false
    }
    if (form.name && !/^[\u0600-\u06FF\s]+$/.test(form.name)) {
      setError('نام فقط باید شامل حروف فارسی باشد')
      valid = false
    }
    if (form.description && form.description.length > 500) {
      setError('توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد')
      valid = false
    }
    if (!form.category) {
      setError('لطفاً یک دسته‌بندی انتخاب کنید')
      valid = false
    }
    
    // Role validation
    if (!form.roles || form.roles.length === 0) {
      // For 'band' category, roles are not required
      if (form.category !== 'band') {
        setError('لطفاً حداقل یک نقش انتخاب کنید')
        valid = false
      }
    }
    
    // Phone validation
    if (form.phone && !/^09\d{9}$/.test(form.phone)) {
      setPhoneError('شماره موبایل باید با 09 شروع شده و 11 رقم باشد')
      valid = false
    }
    // Instagram validation (no @, 3-30 chars, only a-zA-Z0-9._)
    if (form.social_links?.instagram && !/^[a-zA-Z0-9._]{3,30}$/.test(form.social_links.instagram)) {
      setInstagramError('نام کاربری اینستاگرام معتبر نیست (بدون @، فقط حروف، عدد، نقطه یا زیرخط، ۳ تا ۳۰ کاراکتر)')
      valid = false
    }
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('کاربر یافت نشد')
      // آپدیت پروفایل با avatar_url
      await supabase
        .from('profiles')
        .update({
          name: form.name,
          gender: form.gender,
          birth_year: form.birth_year ? parseInt(form.birth_year) : null,
          province: form.province,
          city: form.city,
          avatar_url: form.avatar_url,
          description: form.description,
          phone: form.phone,
          address: form.address,
          category: form.category,
          roles: form.roles,
          performance_count: form.performance_count || null,
          music_experience: form.music_experience ? parseInt(form.music_experience) : null,
          equipments: form.equipments || null,
          website: form.website || null,
          social_links: form.social_links || {},
          ready_for_cooperate: form.ready_for_cooperate,
          looking_for_musician: form.looking_for_musician,
          is_complete: true
        })
        .eq('id', user.id)
      // حذف و درج مجدد سازها
      await supabase.from('profile_instruments').delete().eq('profile_id', user.id).eq('type', 'musician');
      await supabase.from('profile_instruments').delete().eq('profile_id', user.id).eq('type', 'teacher');
      await supabase.from('profile_instruments').delete().eq('profile_id', user.id).eq('type', 'school');

      // درج نوازنده
      if (isMusician && musicianInstruments.length > 0) {
        await supabase.from('profile_instruments').insert(
          musicianInstruments.map(item => ({
            profile_id: user.id,
            instrument_id: item.instrument,
            skill: item.skill,
            type: 'musician'
          }))
        );
      }

      // درج مدرس
      if (isTeacher && teacherInstruments.length > 0) {
        const teacherInstrumentsToInsert = teacherInstruments.map(inst => ({
          profile_id: user.id,
          instrument_id: inst,
          skill: null,
          type: 'teacher'
        }));
        const { error: teacherError } = await supabase.from('profile_instruments').insert(teacherInstrumentsToInsert);
        if (teacherError) {
          console.error('Error inserting teacher instruments:', teacherError);
          throw new Error(`خطا در ذخیره سازهای مدرس: ${teacherError.message}`);
        }
      }

      // درج سازهای آموزشگاه
      if (isMusicSchool && schoolInstruments.length > 0) {
        await supabase.from('profile_instruments').insert(
          schoolInstruments.map(inst => ({
            profile_id: user.id,
            instrument_id: inst,
            skill: null,
            type: 'school'
          }))
        );
      }

      // Get the display_name for redirect
      const displayName = form.display_name || initialProfile?.display_name;
      if (!displayName) {
        throw new Error('نام کاربری یافت نشد');
      }

      console.log('Profile updated successfully, redirecting to:', displayName);
      router.push(`/profile/${encodeURIComponent(displayName)}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('خطا در ذخیره پروفایل')
    } finally {
      setLoading(false)
    }
  }

  // آپلود عکس گالری
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleGalleryImageUpload called', e.target.files);
    const file = e.target.files?.[0];
    if (!file) {
      setError('فایل انتخاب نشده است');
      console.error('Validation Error: No file selected.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم هر عکس باید کمتر از ۱۰ مگابایت باشد.');
      console.error('Validation Error: File size exceeds 10MB.');
      return;
    }
    if (galleryImages.length >= 4) {
      setError('حداکثر 4 عکس مجاز است.');
      console.error('Validation Error: Max 4 images allowed.');
      return;
    }
    console.log('galleryImages.length:', galleryImages.length);
    setGalleryLoading(true);
    try {
      // Use the new API route for upload
      const formData = new FormData();
      formData.append('file', file);

      console.log('FormData created, sending request...');

      const response = await fetch('/api/upload-gallery', {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status, response.statusText);

      const result = await response.json();
      console.log('Response JSON:', result);

      if (!response.ok) {
        throw new Error(result.error || 'خطا در آپلود عکس');
      }

      // Insert into database
      const { error: insertError } = await supabase.from('profile_gallery').insert({
        profile_id: userId,
        type: 'image',
        url: result.url
      });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error('خطا در ذخیره عکس در دیتابیس');
      }

      setGalleryImages(prev => [...prev, result.url]);
      setError(null); // Clear any previous errors
      console.log('Gallery upload successful, URL:', result.url);
    } catch (error) {
      console.error('Error uploading gallery image:', error);
      setError(`خطا در آپلود عکس گالری: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    } finally {
      setGalleryLoading(false);
    }
  };

  // افزودن لینک ویدئو
  const handleAddVideo = async () => {
    if (!videoInput.trim()) {
      setError('لطفاً لینک ویدئو را وارد کنید');
      return;
    }
    if (!videoTitle.trim()) {
      setError('لطفاً عنوان ویدئو را وارد کنید');
      return;
    }
    
    setGalleryLoading(true);
    setError(null); // پاک کردن خطاهای قبلی
    
    try {
      const { error: insertError } = await supabase.from('profile_gallery').insert({
        profile_id: userId,
        type: 'video',
        url: videoInput.trim(),
        title: videoTitle.trim()
      });
      
      if (insertError) {
        throw insertError;
      }
      
      setGalleryVideos(prev => [...prev, { url: videoInput.trim(), title: videoTitle.trim() }]);
      setVideoInput('');
      setVideoTitle('');
      console.log('video link added:', videoInput.trim());
    } catch (err) {
      console.error('خطا در افزودن ویدئو:', err);
      setError('خطا در افزودن ویدئو');
    } finally {
      setGalleryLoading(false);
    }
  };

  // حذف عکس یا ویدئو
  const handleDeleteGalleryItem = async (url: string, type: 'image' | 'video') => {
    setGalleryLoading(true);
    try {
      await supabase.from('profile_gallery').delete().eq('profile_id', userId).eq('url', url).eq('type', type);
      if (type === 'image') setGalleryImages(prev => prev.filter(img => img !== url));
      else setGalleryVideos(prev => prev.filter(v => v.url !== url));
    } catch (err) {
      setError('خطا در حذف آیتم');
    } finally {
      setGalleryLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">در حال بارگذاری...</div>
  }

  // حذف انتخاب دسته‌بندی (category)
  // فقط نقش‌های دسته‌بندی فعلی نمایش داده شوند

  // پیدا کردن دسته‌بندی فعلی
  const currentCategory = categoryOptions.find(c => c.value === form.category)

  //console.log('form.roles:', form.roles);
 // console.log('musicianInstruments:', musicianInstruments);
  //console.log('teacherInstruments:', teacherInstruments);
  //console.log('form.avatar_url:', form.avatar_url);

  // نقش‌های خاص برای نمایش performance_count
  const hasPerformanceCount = form.category === 'band' || form.roles.some(role => ['musician', 'vocalist'].includes(role));

  //console.log('Current category:', form.category);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-sm">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-10 border-b border-gray-100">
        <button 
          type="button" 
          className={`pb-2 px-2 ${
            activeTab === 'personal' 
              ? 'font-bold text-white bg-gray-800 border-b-2 border-gray-100' 
              : 'text-gray-300 font-normal'
          }`} 
          onClick={() => setActiveTab('personal')}
        >
          {form.category === 'place' ? 'اطلاعات عمومی' : 'اطلاعات شخصی'}
        </button>
        <button 
          type="button" 
          className={`pb-2 px-2 ${
            activeTab === 'extra' 
              ? 'font-bold text-white bg-gray-800 border-b-2 border-gray-100' 
              : 'text-gray-300 font-normal'
          }`} 
          onClick={() => setActiveTab('extra')}
        >
          اطلاعات تکمیلی
          {form.roles?.includes('teacher') && (
            <span className="ml-1 text-orange-400">🎵</span>
          )}
        </button>
        <button 
          type="button" 
          className={`pb-2 px-2 ${
            activeTab === 'gallery' 
              ? 'font-bold text-white bg-gray-800 border-b-2 border-gray-100' 
              : 'text-gray-300 font-normal'
          }`} 
          onClick={() => setActiveTab('gallery')}
        >
          گالری
        </button>
        <button 
          type="button" 
          className={`pb-2 px-2 ${
            activeTab === 'danger' 
              ? 'font-bold text-red-500 bg-gray-800 border-b-2 border-red-500' 
              : 'text-gray-300 font-normal'
          }`} 
          onClick={() => setActiveTab('danger')}
        >
          تنظیمات خطرناک
        </button>
      </div>

      {activeTab === 'personal' && (
        <div>
          {/* فقط فیلدهای اطلاعات شخصی: نام کاربری، نام، جنسیت، سال تولد، استان، شهر، توضیحات، عکس پروفایل */}
          <div className="space-y-6">
           
            {/* نام کاربری (انگلیشی) */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">نام کاربری (انگلیسی) <span className="text-red-500">*</span></label>
              <input type="text" value={form.display_name} readOnly className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800 cursor-not-allowed" required />
              {displayNameError && (<p className="mt-1 text-sm text-red-600">{displayNameError}</p>)}
            </div>
            {/* نام */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">نام <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800" required />
              {nameError && <p className="text-red-600 text-sm">{nameError}</p>}
            </div>
            {/* جنسیت - فقط نمایش اگر place نباشد */}
            {form.category !== 'place' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">جنسیت <span className="text-red-500">*</span></label>
                <select 
                  value={form.gender} 
                  onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'mixed' | '' }))} 
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  {form.category?.toLowerCase() === 'band' ? (
                    <>
                      <option value="male">آقایان</option>
                      <option value="female">خانم‌ها</option>
                      <option value="mixed">مختلط</option>
                    </>
                  ) : (
                    <>
                      <option value="male">مرد</option>
                      <option value="female">زن</option>
                    </>
                  )}
                </select>
              </div>
            )}
            {/* سال تولد - فقط نمایش اگر place یا band نباشد */}
            {form.category !== 'place' && form.category !== 'band' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">سال تولد</label>
                <select 
                  value={form.birth_year} 
                  onChange={e => setForm(prev => ({ ...prev, birth_year: e.target.value }))} 
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                >
                  <option value="">انتخاب کنید</option>
                  {Array.from({ length: 1403 - 1300 + 1 }, (_, i) => {
                    const year = 1403 - i;
                    return (<option key={year} value={year}>{year}</option>);
                  })}
                </select>
              </div>
            )}
            {/* استان */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">استان <span className="text-red-500">*</span></label>
              <select 
                value={form.province} 
                onChange={handleProvinceChange} 
                className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800" 
                required
              >
                <option value="">انتخاب کنید</option>
                {provinces.map((province) => (<option key={province.id} value={province.id}>{province.name}</option>))}
              </select>
            </div>
            {/* شهر */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">شهر <span className="text-red-500">*</span></label>
              <select 
                value={form.city} 
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} 
                className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800" 
                required 
                disabled={!form.province}
              >
                <option value="">انتخاب کنید</option>
                {cities.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
              </select>
            </div>
            {/* توضیحات */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">توضیحات</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} 
                className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800" 
                rows={4} 
              />
              {descriptionError && <p className="text-red-600 text-sm">{descriptionError}</p>}
            </div>

            {/* انتخاب نقش‌ها */}
            {form.category && form.category !== 'band' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">نقش‌های شما</label>
                {(() => {
                  const categoryRoles = CATEGORY_OPTIONS.find(c => c.value === form.category)?.roles;
                  if (!categoryRoles || categoryRoles.length === 0) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-4">
                      {categoryRoles.map(role => (
                        <label key={role.value} className="text-gray-100 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.roles?.includes(role.value)}
                            onChange={e => {
                              const checked = e.target.checked;
                              setForm(prev => ({
                                ...prev,
                                roles: checked
                                  ? [...(prev.roles || []), role.value]
                                  : (prev.roles || []).filter(r => r !== role.value)
                              }))
                              
                              // اگر نقش teacher انتخاب شد، به tab extra برو
                              if (checked && role.value === 'teacher') {
                                setActiveTab('extra');
                              }
                            }}
                          />
                          {role.label}
                        </label>
                      ))}
                    </div>
                  );
                })()}
                {/* راهنمایی برای سازهای مدرس */}
                {form.roles?.includes('teacher') && (
                  <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-blue-300 text-sm">
                    💡 برای افزودن سازهایی که تدریس می‌کنید، به بخش &quot;اطلاعات تکمیلی&quot; بروید.
                    {(activeTab as string) !== 'extra' && (
                      <button 
                        type="button" 
                        onClick={() => setActiveTab('extra')}
                        className="ml-2 text-orange-400 underline hover:text-orange-300"
                      >
                        کلیک کنید
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* عکس پروفایل */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">عکس پروفایل</label>
              <div className="flex items-center gap-4">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="پروفایل"
                    className="h-20 w-20 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarUploading(true);
                        try {
                          console.log('Starting upload for file:', file.name, file.size, file.type);
                          
                          // Delete previous avatar if exists
                          if (form.avatar_url) {
                            console.log('Deleting previous avatar:', form.avatar_url);
                            try {
                              // Extract file path from URL
                              const urlParts = form.avatar_url.split('/storage/v1/object/public/avatars/');
                              if (urlParts.length > 1) {
                                const filePath = urlParts[1];
                                const response = await fetch(`/api/delete-avatar?path=${filePath}`);
                                const result = await response.json();
                                if (!response.ok) {
                                  throw new Error(result.error || 'خطا در حذف عکس قبلی');
                                }
                                console.log('Previous avatar deleted:', filePath);
                              }
                            } catch (deleteError) {
                              console.warn('Error deleting previous avatar:', deleteError);
                              // Continue with upload even if delete fails
                            }
                          }
                          
                          // Use the new API route for upload
                          const formData = new FormData();
                          formData.append('file', file);

                          console.log('FormData created, sending request...');

                          const response = await fetch('/api/upload-avatar', {
                            method: 'POST',
                            body: formData,
                          });

                          console.log('Response received:', response.status, response.statusText);

                          const result = await response.json();
                          console.log('Response JSON:', result);

                          if (!response.ok) {
                            throw new Error(result.error || 'خطا در آپلود عکس');
                          }

                          // Update the form state with the new avatar URL
                          setForm(prev => ({ ...prev, avatar_url: result.url }));
                          console.log('Upload successful, URL:', result.url);
                        } catch (error) {
                          console.error('Error uploading avatar:', error);
                          setError(`خطا در آپلود عکس: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
                        } finally {
                          setAvatarUploading(false);
                        }
                      }
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    onClick={(e) => {
                      // Only prevent form submission, allow file selection
                      e.stopPropagation();
                    }}
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-orange-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {avatarUploading ? 'در حال آپلود...' : 'انتخاب عکس'}
                  </label>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-400">حجم عکس باید کمتر از 2 مگابایت باشد.</p>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'extra' && (
        <div className="space-y-6">
          {/* موبایل */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">شماره موبایل</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
            />
            {phoneError && <p className="text-red-600 text-sm mt-1">{phoneError}</p>}
          </div>
          {/* آدرس - فقط برای place */}
          {form.category === 'place' && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">آدرس</label>
              <textarea
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                rows={2}
              />
            </div>
          )}
          {/* وب‌سایت شخصی و شبکه‌های اجتماعی */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">وب‌سایت </label>
            <input
              type="text"
              value={form.website || ''}
              onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
              className="mb-5 text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
            />
            <label className="block text-sm font-medium text-gray-200 mb-1">لینک شبکه‌های اجتماعی</label>
            <input
              type="text"
              placeholder="تلگرام"
              value={form.social_links?.telegram || ''}
              onChange={e => setForm(prev => ({
                ...prev,
                social_links: { ...prev.social_links, telegram: e.target.value }
              }))}
              className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800 mb-1"
            />
            <input
              type="text"
              placeholder="یوتیوب"
              value={form.social_links?.youtube || ''}
              onChange={e => setForm(prev => ({
                ...prev,
                social_links: { ...prev.social_links, youtube: e.target.value }
              }))}
              className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800 mb-1"
            />
            <input
              type="text"
              placeholder="اینستاگرام (بدون @ یا لینک کامل)"
              value={form.social_links?.instagram || ''}
              onChange={e => {
                const rawInput = e.target.value;
                const handle = extractInstagramHandle(rawInput);
                setForm(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, instagram: handle }
                }));
                
                // اعتبارسنجی
                if (handle && !/^[a-zA-Z0-9._]{3,30}$/.test(handle)) {
                  setInstagramError('نام کاربری اینستاگرام معتبر نیست (فقط حروف، عدد، نقطه یا زیرخط، ۳ تا ۳۰ کاراکتر)');
                } else {
                  setInstagramError(null);
                }
              }}
              className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800 mb-1"
            />
            {instagramError && <p className="text-red-600 text-sm mb-2">{instagramError}</p>}
          </div>
          {/* اطلاعات تخصصی */}
          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-base font-bold text-orange-500 mb-4">اطلاعات تخصصی</h3>

           

            {/* سازهایی که مینوازید */}
            {isMusician && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-200 mb-2">سازهایی که مینوازید</label>
                <div className="text-gray-500 space-y-2 mb-2">
                  {musicianInstruments.map((item, idx) => {
                    const instObj = allInstruments.find(inst => inst.id === item.instrument);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{instObj ? instObj.name : item.instrument} ({skillLabels[item.skill] || item.skill})</span>
                        <button type="button" onClick={() => {
                          setMusicianInstruments(prev => prev.filter((_, i) => i !== idx))
                        }} className="text-red-500">حذف</button>
                      </div>
                    );
                  })}
                </div>
                {musicianInstruments.length < 4 && (
                  <>
                    <button type="button" className="rounded-md border border-gray-500 bg-gray-800 text-green-700 px-3 py-1 rounded mb-5" onClick={() => setShowAddInstrument('musician')}>افزودن ساز</button>
                    {showAddInstrument === 'musician' && (
                      <div className="flex items-center gap-2 mt-2">
                        <select value={selectedMusicianInstrument} onChange={e => setSelectedMusicianInstrument(e.target.value)} className="text-gray-100 bg-gray-800 border border-gray-500 rounded px-2 py-1">
                          <option value="">انتخاب ساز</option>
                          {allInstruments.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                        <select value={selectedMusicianSkill} onChange={e => setSelectedMusicianSkill(e.target.value)} className="text-gray-100 bg-gray-800 border border-gray-500 rounded px-2 py-1">
                          <option value="beginner">مبتدی</option>
                          <option value="intermediate">متوسط</option>
                          <option value="advanced">پیشرفته</option>
                          <option value="professional">حرفه‌ای</option>
                        </select>
                        <button type="button" className="bg-gray-800 text-orange-400 px-2 py-1 rounded" onClick={() => {
                          if (selectedMusicianInstrument && !musicianInstruments.some(i => i.instrument === selectedMusicianInstrument)) {
                            setMusicianInstruments([...musicianInstruments, { instrument: selectedMusicianInstrument, skill: selectedMusicianSkill }]);
                            setSelectedMusicianInstrument('');
                            setSelectedMusicianSkill('beginner');
                            setShowAddInstrument(null);
                          }
                        }}>افزودن</button>
                        <button type="button" className="text-gray-500" onClick={() => setShowAddInstrument(null)}>انصراف</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* سازهایی که تدریس میکنید */}
            {isTeacher && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-200 mb-2">سازهایی که تدریس میکنید</label>
                {teacherInstruments.length > 0 && (
                  <div className="text-gray-500 space-y-2 mb-2">
                    {teacherInstruments.map((inst, idx) => {
                      const instObj = allInstruments.find(i => i.id === inst);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span>{instObj ? instObj.name : inst}</span>
                          <button type="button" onClick={() => {
                            setTeacherInstruments(prev => prev.filter((_, i) => i !== idx))
                          }} className="text-red-500">حذف</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {teacherInstruments.length === 0 && (
                  <div className="text-gray-400 text-sm mb-2">هنوز سازی اضافه نکرده‌اید</div>
                )}
                {teacherInstruments.length < 4 && (
                  <>
                    <button type="button" className="rounded-md border border-gray-500 bg-gray-800 text-green-700 px-3 py-1 rounded mb-5" onClick={() => setShowAddInstrument('teacher')}>افزودن ساز</button>
                    {showAddInstrument === 'teacher' && (
                      <div className="flex items-center gap-2 mt-2">
                        <select value={selectedTeacherInstrument} onChange={e => setSelectedTeacherInstrument(e.target.value)} className="text-gray-100 bg-gray-800 border border-gray-500 rounded px-2 py-1">
                          <option value="">انتخاب ساز</option>
                          {allInstruments.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                        <button type="button" className="bg-gray-800 text-orange-400 px-2 py-1 rounded" onClick={() => {
                          if (selectedTeacherInstrument && !teacherInstruments.includes(selectedTeacherInstrument)) {
                            setTeacherInstruments([...teacherInstruments, selectedTeacherInstrument]);
                            setSelectedTeacherInstrument('');
                            setShowAddInstrument(null);
                          }
                        }}>افزودن</button>
                        <button type="button" className="text-gray-500" onClick={() => setShowAddInstrument(null)}>انصراف</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* سال شروع فعالیت */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-200 mb-1">سال شروع فعالیت</label>
              <input
                type="number"
                value={form.music_experience || ''}
                onChange={e => setForm(prev => ({ ...prev, music_experience: e.target.value }))}
                className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-800"
              />
            </div>

            {/* تجهیزات */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-200 mb-1">تجهیزات</label>
              <input
                type="text"
                value={form.equipments || ''}
                onChange={e => setForm(prev => ({ ...prev, equipments: e.target.value }))}
                className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-800"
              />
            </div>

            {/* تعداد اجرا */}
            {hasPerformanceCount && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-1">تعداد اجرا</label>
                <select
                  value={form.performance_count || ''}
                  onChange={e => setForm(prev => ({ ...prev, performance_count: e.target.value }))}
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-800"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="lt10">کمتر از 10 اجرا</option>
                  <option value="10to30">بین 10 تا 30 اجرا</option>
                  <option value="gt30">بیشتر از 30 اجرا</option>
                </select>
              </div>
            )}

            {/* آماده همکاری هستید */}
            {(form.roles.includes('musician') || form.roles.includes('vocalist')) && (
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="ready_for_cooperate"
                  checked={form.ready_for_cooperate || false}
                  onChange={e => setForm(prev => ({ ...prev, ready_for_cooperate: e.target.checked }))}
                />
                <label htmlFor="ready_for_cooperate" className="text-sm font-medium text-gray-200">
                  آماده همکاری هستید
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'gallery' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-1">عکس‌های گالری (حداکثر 4 عکس)</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img} className="w-24 h-24 object-cover rounded border" />
                  <button type="button" className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1" onClick={() => handleDeleteGalleryItem(img, 'image')}>×</button>
                </div>
              ))}
              {galleryImages.length < 5 && (
                <label className="w-24 h-24 flex items-center justify-center border rounded cursor-pointer bg-gray-100">
                  <input type="file" accept="image/*" className="hidden" onChange={handleGalleryImageUpload} />
                  {galleryLoading ? '...' : '+'}
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">لینک ویدئو (مثلاً یوتیوب)</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={videoInput} onChange={e => setVideoInput(e.target.value)} className="bg-gray-800 border border-gray-500 rounded px-2 py-1 flex-1 text-white" placeholder="https://..." />
              <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="عنوان ویدئو" className="bg-gray-800 border border-gray-500 rounded px-2 py-1 flex-1 text-white" />
              <button 
                type="button" 
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  galleryLoading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-white text-orange-500 hover:bg-orange-50'
                }`} 
                onClick={handleAddVideo} 
                disabled={galleryLoading}
              >
                {galleryLoading ? 'در حال افزودن...' : 'افزودن'}
              </button>
            </div>
            <ul>
              {galleryVideos.map((video, idx) => {
                const youtubeMatch = video.url.match(/(?:youtu\.be\/|youtube\.com.*v=)([^&]+)/);
                const youtubeId = youtubeMatch ? youtubeMatch[1] : null;
                const aparatMatch = video.url.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/);
                const aparatId = aparatMatch ? aparatMatch[1] : null;

                let thumbnail = null;
                if (youtubeId) {
                  thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                } else if (aparatId) {
                  thumbnail = `https://www.aparat.com/video/video/embed/videohash/${aparatId}/vt/frame.jpg`;
                }

                return (
                  <li key={idx} className="flex items-center gap-2">
                    {thumbnail && <img src={thumbnail} alt="preview" className="w-16 h-10 object-cover rounded" />}
                    <div>
                      <div className="font-bold text-white ">{video.title}</div>
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">{video.url}</a>
                    </div>
                    <button type="button" className="text-red-500" onClick={() => handleDeleteGalleryItem(video.url, 'video')}>حذف</button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="bg-gray-700 p-6 rounded-lg border border-red-500">
            <h3 className="text-lg font-medium text-red-500 mb-4">حذف حساب کاربری</h3>
            <p className="text-gray-300 mb-4">
              با حذف حساب کاربری، تمام اطلاعات شما به صورت دائمی حذف خواهد شد و قابل بازیابی نخواهد بود.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-700"
              >
                حذف حساب کاربری
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-red-400 font-medium">آیا از حذف حساب کاربری خود اطمینان دارید؟</p>
                <div className="flex space-x-4 rtl:space-x-reverse">
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-700 disabled:opacity-50"
                  >
                    {loading ? 'در حال حذف...' : 'بله، حذف شود'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-600 text-gray-200 px-4 py-2 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-700"
                  >
                    انصراف
                  </button>
                </div>
                {deleteError && (
                  <p className="text-red-400 text-sm">{deleteError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* دکمه ثبت */}
      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={!form.category || loading || (form.category !== 'band' && (!form.roles || form.roles.length === 0))}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'در حال ذخیره...' : 'ذخیره'}
        </button>
      </div>
    </form>
  )
} 