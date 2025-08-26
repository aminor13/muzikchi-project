"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/context/userContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { user, profile } = useUser()

  const isActive = (href: string) => pathname === href

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="grid grid-cols-5 text-center py-2">
          <li>
            <Link href="/explore" className={`flex flex-col items-center text-xs ${isActive('/explore') ? 'text-orange-500' : 'text-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.5a6.25 6.25 0 016.75 6.2v.3l.75.75a3.25 3.25 0 11-4.6 4.6l-.75-.75h-.3A6.25 6.25 0 119.75 3.5z" /></svg>
              <span>اکسپلور</span>
            </Link>
          </li>
          <li>
            <Link href="/events" className={`flex flex-col items-center text-xs ${isActive('/events') ? 'text-orange-500' : 'text-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" /></svg>
              <span>رویدادها</span>
            </Link>
          </li>
          <li>
            <Link href="/messages" className={`flex flex-col items-center text-xs ${isActive('/messages') ? 'text-orange-500' : 'text-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-9 8l4-4h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12z" /></svg>
              <span>پیام‌ها</span>
            </Link>
          </li>
          <li>
            {user && profile ? (
              <Link href={`/profile/${(profile as any).display_name}`} className={`flex flex-col items-center text-xs ${isActive(`/profile/${(profile as any).display_name}`) ? 'text-orange-500' : 'text-gray-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7a4 4 0 118 0 4 4 0 01-8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>پروفایل</span>
              </Link>
            ) : (
              <Link href="/login" className={`flex flex-col items-center text-xs ${isActive('/login') ? 'text-orange-500' : 'text-gray-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 12a5 5 0 1110 0 5 5 0 01-10 0zM4 12h6" /></svg>
                <span>ورود</span>
              </Link>
            )}
          </li>
          <li>
            {user && profile ? (
              <Link href="/events/my-events" className={`flex flex-col items-center text-xs ${isActive('/events/my-events') ? 'text-orange-500' : 'text-gray-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
                <span>من</span>
              </Link>
            ) : (
              <span className="flex flex-col items-center text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
                <span>من</span>
              </span>
            )}
          </li>
        </ul>
      </div>
    </nav>
  )
}