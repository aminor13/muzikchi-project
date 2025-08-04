'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { CookieOptions } from '@supabase/ssr'
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies'

export async function getSession() {
  const cookieStore = await cookies() as unknown as RequestCookies
  const response = new Response()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieStr = `${name}=${value}; Path=/; ${
            options.secure ? 'Secure; ' : ''
          }${options.sameSite ? `SameSite=${options.sameSite}; ` : ''}${
            options.maxAge ? `Max-Age=${options.maxAge}; ` : ''
          }${options.domain ? `Domain=${options.domain}; ` : ''}`
          response.headers.append('Set-Cookie', cookieStr)
        },
        remove(name: string, options: CookieOptions) {
          const cookieStr = `${name}=; Path=/; Max-Age=0`
          response.headers.append('Set-Cookie', cookieStr)
        },
      },
    }
  )

  try {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
  } catch (error) {
    console.error('Error getting session:', error)
    return { session: null, error }
  }
}

export async function getUser() {
  const { session, error } = await getSession()
  if (error || !session) {
    return { user: null, error }
  }
  return { user: session.user, error: null }
} 