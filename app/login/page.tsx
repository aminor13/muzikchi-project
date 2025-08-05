'use client'
import { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { AuthError, AuthResponse } from '@supabase/supabase-js'
import Turnstile from 'react-turnstile'
import { Eye, EyeOff } from 'lucide-react'

interface LoginFormData {
  email: string
  password: string
}

// Wrapper function for Supabase auth
const signInSilently = async (supabase: any, email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export default function LoginPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '0x4AAAAAABoOxgRSN5jLiz6e'
  

  const [showPassword, setShowPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const savedEmail = localStorage.getItem('login_email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    localStorage.setItem('login_email', e.target.value)
  }

  const handleRecaptchaChange = (token: string | null) => {
    // setRecaptchaToken(token) // This state is no longer needed
  }

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token)
  }

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
        },
      })
      if (signInError) {
        setError('خطا در ورود با گوگل')
      }
      // Supabase will redirect automatically
    } catch (error) {
      setError('خطا در ورود با گوگل')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Check Turnstile
    if (!turnstileToken) {
      setError('لطفاً کپچا را تکمیل کنید')
      setLoading(false)
      return
    }

    try {
      // Verify Turnstile token
      const verifyResponse = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyData.success) {
        setError('تایید کپچا ناموفق بود. لطفاً دوباره تلاش کنید')
        setLoading(false)
        return
      }

      // اول چک می‌کنیم که فیلدها خالی نباشند
      if (!email || !password) {
        setError('لطفاً ایمیل و رمز عبور را وارد کنید')
        setLoading(false)
        return
      }

      // تلاش برای لاگین با استفاده از یک Promise wrapper
      const { data, error: signInError } = await new Promise<AuthResponse>((resolve) => {
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        }).then((result) => {
          resolve(result)
        }).catch((error) => {
          resolve({ data: { user: null, session: null }, error })
        })
      })

      // اگر خطای لاگین داشتیم
      if (signInError) {
        if (signInError instanceof AuthError && signInError.message.includes('Invalid')) {
          setError('ایمیل یا رمز عبور اشتباه است')
        } else {
          setError('خطا در ورود به سیستم')
        }
        return
      }

      // اگر لاگین موفق بود
      if (data?.user) {
        // چک کردن تایید ایمیل
        if (!data.user.email_confirmed_at) {
          setError('لطفاً ابتدا ایمیل خود را تایید کنید')
          setLoading(false)
          return
        }

        // چک کردن وضعیت پروفایل کاربر
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          setError('خطا در دریافت اطلاعات پروفایل')
          return
        }

        // اگر پروفایل کامل نبود، به صفحه تکمیل پروفایل برو
        if (!profile || !profile.is_complete) {
          router.push('/profile/complete')
        } else {
          // در غیر این صورت به صفحه اصلی برو
          router.push('/')
        }
      }
    } catch (error) {
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Navigating to forgot password...')
    window.location.href = '/forgot-password'
  }

  const handleSignup = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Navigating to signup...')
    window.location.href = '/profile/create'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            ورود به حساب کاربری
          </h2>
        </div>

        <form className="mt-8 space-y-6 max-w-sm mx-auto" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">
                ایمیل
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800 max-w-sm mx-auto"
                placeholder="ایمیل"
                dir="ltr"
              />
            </div>
            <div className="mb-4 relative">
              <label htmlFor="password" className="sr-only">
                رمز عبور
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800 max-w-sm mx-auto pr-10"
                placeholder="رمز عبور"
                dir="ltr"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="mr-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}


          
          {/* Turnstile Widget */}
          {isClient && turnstileSiteKey && turnstileSiteKey !== '' ? (
            <div className="flex justify-center">
              <div className="turnstile-wrapper bg-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg hover:shadow-xl">
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={handleTurnstileVerify}
                  theme="dark"
                  size="normal"
                  appearance="always"
                  onError={(error) => {
                    console.error('Turnstile error:', error)
                    setError(`خطا در بارگذاری کپچا: ${error}`)
                  }}
                  onLoad={(widgetId) => {
                    console.log('Turnstile loaded successfully:', widgetId)
                  }}
                />
              </div>
            </div>
          ) : !isClient ? (
            <div className="flex justify-center">
              <div className="bg-gray-600 p-4 rounded-md mb-4">
                <p className="text-white text-sm">در حال بارگذاری...</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-red-700 p-4 rounded-md mb-4">
                <p className="text-white text-sm">خطا: Site Key یافت نشد</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <span className="flex flex-row items-center gap-2">
                ورود با گوگل
                <svg className="w-5 h-5" viewBox="0 0 533.5 544.3">
                  <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.3h147.5c-6.4 34.5-25.1 63.6-53.5 83.1v68.7h86.5c50.5-46.5 80-115 80-196.7z" />
                  <path fill="#34a853" d="M272 544.3c72.6 0 133.5-23.9 178-64.8l-86.5-68.7c-24 16.1-54.6 25.7-91.5 25.7-70.3 0-129.9-47.5-151.3-111.3H33.6v69.9c44.8 88.4 136.7 149.2 238.4 149.2z" />
                  <path fill="#fbbc04" d="M120.7 325.2c-10.4-30.6-10.4-63.7 0-94.3V161h-87.1C7.5 212.2 0 260.2 0 308.3s7.5 96.1 33.6 147.3l87.1-69.9z" />
                  <path fill="#ea4335" d="M272 107.7c39.5-.6 77.2 14.2 106.1 41.7l79.4-79.4C412.5 24.2 343.4-1.1 272 0 170.3 0 78.4 60.8 33.6 149.2l87.1 69.9C142.1 155.2 201.7 107.7 272 107.7z" />
                </svg>
              </span>
            </button>
          </div>
        </form>

        {/* Navigation buttons outside the form */}
        <div className="max-w-sm mx-auto flex flex-row justify-between mt-2">
          <a
            href="/forgot-password"
            onClick={handleForgotPassword}
            className="font-medium text-orange-600 hover:text-orange-500 text-sm"
          >
            رمز عبور را فراموش کرده‌اید؟
          </a>
          <a
            href="/profile/create"
            onClick={handleSignup}
            className="font-medium text-orange-600 hover:text-orange-500 text-sm"
          >
            ثبت‌نام
          </a>
        </div>
      </div>
    </div>
  )
}


