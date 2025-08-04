// lib/supabaseServerClient.js
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const { cookies } = require('next/headers')  // 👈 import inside function

  const cookieStore = cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key) => cookieStore.get(key)?.value,
          setItem: (key, value) => cookieStore.set(key, value),
          removeItem: (key) => cookieStore.delete(key),
        }
      }
    }
  )
}
