'use client'
import { useUser } from '@/context/userContext'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'

export default function Header() {
  //console.log('Header: Rendering')
  const { user, profile } = useUser()
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Pending counts for header badges
  const [pendingBandRequestsCount, setPendingBandRequestsCount] = useState<number>(0) // requests to a band owned by user
  const [pendingBandInvitesCount, setPendingBandInvitesCount] = useState<number>(0) // invites sent to musician/vocalist user
  const [pendingSchoolInvitesCount, setPendingSchoolInvitesCount] = useState<number>(0) // invites sent to teacher user

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('Error checking admin status:', error)
        return
      }
      
      setIsAdmin(!!data?.is_admin)
    }
    
    checkAdminStatus()
  }, [user, supabase])

  // Load pending counts for relevant actions
  useEffect(() => {
    if (!user || !profile) {
      setPendingBandRequestsCount(0)
      setPendingBandInvitesCount(0)
      setPendingSchoolInvitesCount(0)
      return
    }

    // Derive category and roles as plain strings to avoid TS union mismatches
    const category = (profile as any)?.category as string | undefined
    const roles = Array.isArray((profile as any)?.roles) ? ((profile as any)?.roles as string[]) : []

    const isBand = category === 'band'
    const isSchool = category === 'place' && roles.includes('school')
    const isMusicianOrVocalist = roles.some((r: string) => ['musician', 'vocalist'].includes(r))
    const isTeacher = roles.includes('teacher')

    const fetchCounts = async () => {
      try {
        // Pending requests to join my band (if I am a band)
        if (isBand && (profile as any).id) {
          const { count } = await supabase
            .from('band_members')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', (profile as any).id)
            .eq('status', 'requested')
          setPendingBandRequestsCount(count || 0)
        } else {
          setPendingBandRequestsCount(0)
        }

        // Pending band invites sent to me (if I am musician/vocalist and not a band or school)
        if (isMusicianOrVocalist && !isBand && !isSchool && user.id) {
          const { count } = await supabase
            .from('band_members')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', user.id)
            .eq('status', 'pending')
          setPendingBandInvitesCount(count || 0)
        } else {
          setPendingBandInvitesCount(0)
        }

        // Pending school invites sent to me (if I am a teacher)
        if (isTeacher && user.id) {
          const { count } = await supabase
            .from('school_teachers')
            .select('id', { count: 'exact', head: true })
            .eq('teacher_id', user.id)
            .eq('status', 'pending')
          setPendingSchoolInvitesCount(count || 0)
        } else {
          setPendingSchoolInvitesCount(0)
        }
      } catch (e) {
        console.error('Error loading pending counts:', e)
      }
    }

    fetchCounts()
  }, [user, profile, supabase])

  ///console.log('Header: Current user:', user)

  const isActive = (href: string) => pathname === href

  // Derived values for render conditions
  const category = (profile as any)?.category as string | undefined
  const roles = Array.isArray((profile as any)?.roles) ? ((profile as any)?.roles as string[]) : []
  const isBand = category === 'band'
  const isSchool = category === 'place' && roles.includes('school')
  const isMusicianOrVocalist = roles.some((r: string) => ['musician','vocalist'].includes(r))
  const isTeacher = roles.includes('teacher')

  return (
    <header className="bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* لوگو */}
        <Link href="/" className="text-xl font-bold text-white">
          <Image
            src="/first_logo.png"
            alt="موزیکچی"
            width={120}
            height={40}
            priority
            className="object-contain w-auto h-auto"
          />
        </Link>
        {/* منوی دسکتاپ */}
        <nav className="hidden md:flex items-center gap-x-8">
          <Link href="/explore" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/explore') ? 'font-bold' : ''}`}>اکسپلور</Link>
          <Link href="/events" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/events') ? 'font-bold' : ''}`}>رویدادها</Link>
          <Link href="/messages" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/messages') ? 'font-bold' : ''}`}>تماس با ما</Link>
          {isAdmin && (
            <>
              <Link href="/admin/events" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${isActive('/admin/events') ? 'font-bold' : ''}`}>مدیریت رویدادها</Link>
              <Link href="/admin/messages" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${isActive('/admin/messages') ? 'font-bold' : ''}`}>پیام‌های کاربران</Link>
            </>
          )}
        </nav>
        {/* پروفایل و ورود/خروج دسکتاپ */}
        <div className="hidden md:flex items-center gap-x-6">
          {user && profile ? (
            <>
              {(profile as any)?.is_complete && (
                <>
                  <Link href={`/profile/${(profile as any).display_name}`} className={`text-white hover:text-orange-500 text-base font-medium ${isActive(`/profile/${(profile as any).display_name}`) ? 'font-bold' : ''}`}>پروفایل من</Link>
                  <Link href="/profile/edit" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/profile/edit') ? 'font-bold' : ''}`}>ویرایش پروفایل</Link>
                  {isBand && (
                    <Link href="/band/members" className={`relative text-white hover:text-orange-500 text-base font-medium ${isActive('/band/members') ? 'font-bold' : ''}`}>
                      مدیریت اعضا
                      {pendingBandRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                          {pendingBandRequestsCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {isSchool && (
                    <Link href="/school/teachers" className={`text:white hover:text-orange-500 text-base font-medium ${isActive('/school/teachers') ? 'font-bold' : ''}`}>مدیریت اساتید</Link>
                  )}
                  <Link href="/events/my-events" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/events/my-events') ? 'font-bold' : ''}`}>رویدادهای من</Link>
                  {isMusicianOrVocalist && !isBand && !isSchool && (
                    <Link href="/invites/band" className={`relative text-white hover:text-orange-500 text-base font-medium ${isActive('/invites/band') ? 'font-bold' : ''}`}>
                      دعوت‌های گروه‌ها
                      {pendingBandInvitesCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                          {pendingBandInvitesCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {isTeacher && (
                    <Link href="/invites/school" className={`relative text-white hover:text-orange-500 text-base font-medium ${isActive('/invites/school') ? 'font-bold' : ''}`}>
                      دعوت‌های آموزشگاه‌ها
                      {pendingSchoolInvitesCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                          {pendingSchoolInvitesCount}
                        </span>
                      )}
                    </Link>
                  )}
                </>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="text-white hover:text-orange-500 text-base font-medium"
              >
                خروج
              </button>
            </>
          ) : (
            <Link href="/login" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/login') ? 'font-bold' : ''}`}>ورود</Link>
          )}
        </div>
        {/* آیکون منوی موبایل */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="باز کردن منو"
        >
          {menuOpen ? (
            // آیکون ضربدر
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            // آیکون همبرگر
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>
      {/* منوی موبایل */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4 flex flex-col gap-4 animate-fade-in-down">
          <Link href="/explore" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/explore') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>اکسپلور</Link>
          <Link href="/events" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/events') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>رویدادها</Link>
          <Link href="/messages" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/messages') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>تماس با ما</Link>
          {isAdmin && (
            <>
              <Link href="/admin/events" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${isActive('/admin/events') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>مدیریت رویدادها</Link>
              <Link href="/admin/messages" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${isActive('/admin/messages') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>پیام‌های کاربران</Link>
            </>
          )}
          {user && profile ? (
            <>
              {(profile as any)?.is_complete && (
                <>
                  <Link href={`/profile/${(profile as any).display_name}`} className={`text-white hover:text-orange-500 text-base font-medium ${isActive(`/profile/${(profile as any).display_name}`) ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>پروفایل من</Link>
                  <Link href="/profile/edit" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/profile/edit') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>ویرایش پروفایل</Link>
                  {isBand && (
                    <Link href="/band/members" className={`relative text-white hover:text-orange-500 text-base font-medium ${isActive('/band/members') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>
                      مدیریت اعضا
                      {pendingBandRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                          {pendingBandRequestsCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {isSchool && (
                    <Link href="/school/teachers" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/school/teachers') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>مدیریت اساتید</Link>
                  )}
                  <Link href="/events/my-events" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/events/my-events') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>رویدادهای من</Link>
                  {isMusicianOrVocalist && !isBand && !isSchool && (
                    <Link href="/invites/band" className={`relative text-white hover:text-orange-500 text-base font-medium ${isActive('/invites/band') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>
                      دعوت‌های گروه‌ها
                      {pendingBandInvitesCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                          {pendingBandInvitesCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {isTeacher && (
                    <Link href="/invites/school" className={`relative text-white hover:text-orange-500 text-base font-medium ${isActive('/invites/school') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>
                      دعوت‌های آموزشگاه‌ها
                      {pendingSchoolInvitesCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-500 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                          {pendingSchoolInvitesCount}
                        </span>
                      )}
                    </Link>
                  )}
                </>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                  setMenuOpen(false);
                }}
                className="text-white hover:text-orange-500 text-base font-medium"
              >
                خروج
              </button>
            </>
          ) : (
            <Link href="/login" className={`text-white hover:text-orange-500 text-base font-medium ${isActive('/login') ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>ورود/ثبت نام</Link>
          )}
        </div>
      )}
    </header>
  )
} 