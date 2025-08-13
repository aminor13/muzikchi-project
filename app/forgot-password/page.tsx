'use client'

import { useState, FormEvent, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const COUNTDOWN_KEY = 'reset_password_countdown'
const COUNTDOWN_EMAIL_KEY = 'reset_password_email'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // بررسی وضعیت شمارنده در زمان لود صفحه
  useEffect(() => {
    const checkCountdown = () => {
      const savedCountdownStr = localStorage.getItem(COUNTDOWN_KEY)
      const savedEmail = localStorage.getItem(COUNTDOWN_EMAIL_KEY)
      
      if (savedCountdownStr && savedEmail) {
        const expiryTime = parseInt(savedCountdownStr)
        const now = Math.floor(Date.now() / 1000)
        const remainingTime = expiryTime - now

        if (remainingTime > 0) {
          setCountdown(remainingTime)
          setEmail(savedEmail)
          setMessage({
            type: 'success',
            text: 'لینک بازیابی قبلاً ارسال شده است. لطفاً ایمیل خود را بررسی کنید (پوشه اسپم را هم چک بفرمایید).'
          })
        } else {
          // پاک کردن مقادیر منقضی شده
          localStorage.removeItem(COUNTDOWN_KEY)
          localStorage.removeItem(COUNTDOWN_EMAIL_KEY)
        }
      }
    }

    if (typeof window !== 'undefined') {
      checkCountdown()
    }
  }, []) // فقط در زمان لود صفحه اجرا شود

  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 1
          if (newCount === 0) {
            // اگر شمارنده تمام شد، مقادیر را پاک کن
            localStorage.removeItem(COUNTDOWN_KEY)
            localStorage.removeItem(COUNTDOWN_EMAIL_KEY)
            clearInterval(timer)
          }
          return newCount
        })
      }, 1000)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [countdown])

  const startCountdown = () => {
    const duration = 60
    const expiryTime = Math.floor(Date.now() / 1000) + duration
    
    localStorage.setItem(COUNTDOWN_KEY, expiryTime.toString())
    localStorage.setItem(COUNTDOWN_EMAIL_KEY, email)
    
    setCountdown(duration)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // چک کردن وجود ایمیل در جدول profiles
      // Use a more robust query to avoid 406 errors
      let profile = null
      let profileError = null
      
      try {
        const result = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', email.trim())
          .maybeSingle()
        
        profile = result.data
        profileError = result.error
      } catch (error) {
        console.warn('Error in email check, continuing with password reset...', error)
        // Continue with password reset even if email check fails
      }

      if (profileError) {
        console.error('Error checking profile:', profileError)
        // Don't throw error for 406, just continue
        if (profileError.code === '406' || profileError.message?.includes('406')) {
          console.warn('Received 406 error, continuing with password reset...')
        } else {
          setMessage({
            type: 'error',
            text: 'خطا در بررسی ایمیل. لطفاً دوباره تلاش کنید.'
          })
          setLoading(false)
          return
        }
      }

      if (!profile) {
        setMessage({
          type: 'error',
          text: 'این ایمیل در سیستم ثبت نشده است'
        })
        setLoading(false)
        return
      }

      // ارسال لینک بازیابی
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password?code={TOKEN}`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید (پوشه اسپم را هم چک بفرمایید).'
      })
      startCountdown()
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'خطا در ارسال لینک بازیابی'
      })
    } finally {
      setLoading(false)
    }
  }

  const isButtonDisabled = loading || countdown > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            بازیابی رمز عبور
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              ایمیل
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={countdown > 0}
              className={`appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800 ${
                countdown > 0 ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              placeholder="ایمیل"
              dir="ltr"
            />
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex">
                <div className="mr-3">
                  <div className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                isButtonDisabled
                  ? 'bg-orange-400 cursor-not-allowed opacity-60'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {loading ? 'در حال ارسال...' : 
               countdown > 0 ? `ارسال مجدد در ${countdown} ثانیه دیگر` :
               'ارسال لینک بازیابی'}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={() => router.push('/login')}
              disabled={loading}
              className={`font-medium bg-transparent border-0 cursor-pointer ${
                loading
                  ? 'text-orange-400 cursor-not-allowed opacity-60'
                  : 'text-orange-600 hover:text-orange-500'
              }`}
            >
              بازگشت به صفحه ورود
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 