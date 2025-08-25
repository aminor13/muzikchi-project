// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response bound to the incoming request (required for cookie sync)
  let res = NextResponse.next({ request: req })
  const pathname = req.nextUrl.pathname

  // Skip middleware for static files, api routes, and Supabase auth callbacks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
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
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror cookies on the request and the response
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Keep session fresh; this may update cookies via setAll above
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/explore',
    '/',
  ]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = new URL('/login', req.url)
    const redirect = NextResponse.redirect(url)
    // Preserve any cookies Supabase set during refresh (guard for Next <13 runtime)
    // @ts-ignore - setAll is available at runtime in Next 13+/15 middleware
    if (typeof redirect.cookies.setAll === 'function') {
      // @ts-ignore
      redirect.cookies.setAll(res.cookies.getAll())
    }
    return redirect
  }

  // If user is logged in, perform additional checks
  if (user) {
    // 1) Email verification
    if (!user.email_confirmed_at && !pathname.startsWith('/verify-email')) {
      const url = new URL('/verify-email', req.url)
      const redirect = NextResponse.redirect(url)
      // @ts-ignore
      if (typeof redirect.cookies.setAll === 'function') {
        // @ts-ignore
        redirect.cookies.setAll(res.cookies.getAll())
      }
      return redirect
    }

    // 2) Profile completeness and admin checks (same Supabase client to avoid cookie desync)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_complete')
      .eq('id', user.id)
      .maybeSingle()

    if ((!profile || !profile.is_complete) && !pathname.startsWith('/profile/complete')) {
      const url = new URL('/profile/complete', req.url)
      const redirect = NextResponse.redirect(url)
      // @ts-ignore
      if (typeof redirect.cookies.setAll === 'function') {
        // @ts-ignore
        redirect.cookies.setAll(res.cookies.getAll())
      }
      return redirect
    }

    if (pathname.startsWith('/admin') && !profile?.is_admin) {
      const url = new URL('/', req.url)
      const redirect = NextResponse.redirect(url)
      // @ts-ignore
      if (typeof redirect.cookies.setAll === 'function') {
        // @ts-ignore
        redirect.cookies.setAll(res.cookies.getAll())
      }
      return redirect
    }
  }

  // Return the response that contains any refreshed cookies
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