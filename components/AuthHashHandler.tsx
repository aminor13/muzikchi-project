'use client'
import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AuthHashHandler() {
  useEffect(() => {
    const run = async () => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash
      if (!hash || hash.indexOf('access_token=') === -1) return
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (!access_token || !refresh_token) return
      const supabase = createClient()
      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (!error) {
        const cleanUrl = window.location.href.split('#')[0]
        window.history.replaceState({}, '', cleanUrl)
      }
    }
    run()
  }, [])
  return null
}


