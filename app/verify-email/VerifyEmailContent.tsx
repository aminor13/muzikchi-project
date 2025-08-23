'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const tokenHash = searchParams.get('token_hash')
  const typeParam = searchParams.get('type')

  const [verifying, setVerifying] = useState<boolean>(false)
  const [verified, setVerified] = useState<boolean>(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const shouldVerify = useMemo(() => Boolean(tokenHash && (typeParam === 'signup' || typeParam === 'email_change')), [tokenHash, typeParam])

  useEffect(() => {
    const verify = async () => {
      if (!shouldVerify) return
      setVerifying(true)
      setVerifyError(null)
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          type: (typeParam === 'email_change' ? 'email_change' : 'signup'),
          token_hash: tokenHash as string,
        } as any)
        if (error) {
          setVerifyError(error.message || 'خطا در تایید ایمیل')
          setVerified(false)
        } else {
          setVerified(true)
        }
      } catch (e: any) {
        setVerifyError(e?.message || 'خطا در تایید ایمیل')
        setVerified(false)
      } finally {
        setVerifying(false)
      }
    }
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldVerify])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendMessage(null)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResendMessage({ type: 'error', text: 'ایمیل معتبر وارد کنید' })
      return
    }
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: 'https://muzikchi.ir/verify-email'
        }
      })
      if (error) {
        setResendMessage({ type: 'error', text: error.message || 'ارسال ایمیل ناموفق بود' })
      } else {
        setResendMessage({ type: 'success', text: 'ایمیل فعالسازی مجدداً ارسال شد' })
      }
    } catch (e: any) {
      setResendMessage({ type: 'error', text: e?.message || 'ارسال ایمیل ناموفق بود' })
    } finally {
      setResendLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">در حال تایید ایمیل...</h2>
        <p className="text-gray-400">لطفاً منتظر بمانید</p>
      </div>
    )
  }

  if (verified || (tokenHash && !verifyError)) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">ایمیل شما با موفقیت تایید شد!</h2>
        <p className="text-gray-400 mb-6">حالا می‌توانید وارد حساب کاربری خود شوید.</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          ورود به حساب کاربری
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">ایمیل فعالسازی ارسال شد!</h2>
      <p className="text-gray-400 mb-6">لطفاً ایمیل خود را بررسی کنید و روی لینک تایید کلیک کنید.</p>
      <div className="space-y-3">
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          بازگشت به صفحه ورود
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          بررسی مجدد
        </button>
      </div>

      <div className="mt-8 text-left">
        <h3 className="text-white font-semibold mb-3">ارسال مجدد ایمیل تایید</h3>
        <form onSubmit={handleResend} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ایمیل خود را وارد کنید"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={resendLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {resendLoading ? 'در حال ارسال...' : 'ارسال مجدد ایمیل فعالسازی'}
          </button>
        </form>
        {resendMessage && (
          <p className={resendMessage.type === 'success' ? 'text-green-400 mt-3' : 'text-red-400 mt-3'}>
            {resendMessage.text}
          </p>
        )}
      </div>
    </div>
  )
} 