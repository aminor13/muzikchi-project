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

  ///console.log('Header: Current user:', user)

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
          <Link href="/explore" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/explore' ? 'font-bold' : ''}`}>اکسپلور</Link>
          <Link href="/events" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/events' ? 'font-bold' : ''}`}>رویدادها</Link>
          <Link href="/messages" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/messages' ? 'font-bold' : ''}`}>تماس با ما</Link>
          {isAdmin && (
            <>
              <Link href="/admin/events" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${pathname === '/admin/events' ? 'font-bold' : ''}`}>مدیریت رویدادها</Link>
              <Link href="/admin/messages" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${pathname === '/admin/messages' ? 'font-bold' : ''}`}>پیام‌های کاربران</Link>
            </>
          )}
        </nav>
        {/* پروفایل و ورود/خروج دسکتاپ */}
        <div className="hidden md:flex items-center gap-x-8">
          {user && profile ? (
            <>
              {profile.is_complete && (
                <Link href={`/profile/${profile.display_name}`} className={`text-white hover:text-orange-500 text-base font-medium ${pathname === `/profile/${profile.display_name}` ? 'font-bold' : ''}`}>پروفایل من</Link>
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
            <Link href="/login" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/login' ? 'font-bold' : ''}`}>ورود</Link>
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
          <Link href="/explore" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/explore' ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>اکسپلور</Link>
          <Link href="/events" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/events' ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>رویدادها</Link>
          <Link href="/messages" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/messages' ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>تماس با ما</Link>
          {isAdmin && (
            <>
              <Link href="/admin/events" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${pathname === '/admin/events' ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>مدیریت رویدادها</Link>
              <Link href="/admin/messages" className={`text-yellow-200 hover:text-orange-500 text-base font-medium ${pathname === '/admin/messages' ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>پیام‌های کاربران</Link>
            </>
          )}
          {user && profile ? (
            <>
              {profile.is_complete && (
                <Link href={`/profile/${profile.display_name}`} className={`text-white hover:text-orange-500 text-base font-medium ${pathname === `/profile/${profile.display_name}` ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>پروفایل من</Link>
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
            <Link href="/login" className={`text-white hover:text-orange-500 text-base font-medium ${pathname === '/login' ? 'font-bold' : ''}`} onClick={() => setMenuOpen(false)}>ورود/ثبت نام</Link>
          )}
        </div>
      )}
    </header>
  )
} 