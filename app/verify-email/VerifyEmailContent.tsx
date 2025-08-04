'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/context/userContext'

export default function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateUser } = useUser()
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = createClient()
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || !type) {
          setError('لینک تأیید ایمیل نامعتبر است.')
          setVerifying(false)
          return
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        })

        if (error) throw error

        // Update user context after successful verification
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (user) {
          updateUser(user)
        }

        // Redirect to profile page after successful verification
        router.push('/profile')
      } catch (err) {
        console.error('Error verifying email:', err)
        setError('خطا در تأیید ایمیل. لطفاً دوباره تلاش کنید.')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, router, updateUser])

  if (verifying) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          در حال تأیید ایمیل...
        </h2>
        <p className="text-gray-400">لطفاً صبر کنید</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          خطا در تأیید ایمیل
        </h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          بازگشت به صفحه ورود
        </button>
      </div>
    )
  }

  return null
} 