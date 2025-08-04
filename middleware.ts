// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkProfile } from '@/app/utils/profile'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Skip middleware for static files and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean }) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          res.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in and trying to access protected routes
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/explore',
    '/'
  ]
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is logged in
  if (user) {
    const { profile } = await checkProfile(user.id)

    // If profile doesn't exist or is not complete and not on complete profile page
    if ((!profile || !profile.is_complete) && !pathname.startsWith('/profile/complete')) {
      return NextResponse.redirect(new URL('/profile/complete', req.url))
    }

    // If profile is complete and trying to access complete profile page
    if (profile?.is_complete && pathname.startsWith('/profile/complete')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // If trying to access admin routes without admin privileges
    if (pathname.startsWith('/admin') && !profile?.is_admin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}