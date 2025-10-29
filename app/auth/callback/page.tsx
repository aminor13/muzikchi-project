'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        const params = new URLSearchParams(hash.replace(/^#/, ''))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (!access_token || !refresh_token) {
          setError('Missing tokens in callback URL')
          return
        }
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          setError(error.message)
          return
        }
        router.replace('/')
      } catch (e: any) {
        setError(e?.message || 'Unexpected error')
      }
    }
    run()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 px-4">
      <div className="max-w-md w-full text-center text-gray-100">
        <h1 className="text-xl font-semibold mb-3">در حال تکمیل ورود...</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  )
}


