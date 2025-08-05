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



  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // اول چک می‌کنیم که فیلدها خالی نباشند
      if (!email || !password) {
        setError('لطفاً ایمیل و رمز عبور را وارد کنید')
        setLoading(false)
        return
      }

      // Check Turnstile
      if (!turnstileToken) {
        setError('لطفاً کپچا را تکمیل کنید')
        setLoading(false)
        return
      }

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

      // Test login with API route first
      const testResponse = await fetch('/api/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })

      const testData = await testResponse.json()
      
      if (!testData.success) {
        setError(`خطا در ورود: ${testData.error}`)
        setLoading(false)
        return
      }

      // If API login works, try client-side login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (signInError) {
        setError('خطا در ورود به سیستم')
        setLoading(false)
        return
      }

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
          setLoading(false)
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
      console.error('Login error:', error)
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = '/forgot-password'
  }

  const handleSignup = (e: React.MouseEvent) => {
    e.preventDefault()
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
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={handleTurnstileVerify}
                theme="dark"
                size="normal"
                appearance="always"
                language="fa"
                onError={(error) => {
                  setError(`خطا در بارگذاری کپچا: ${error}`)
                }}
                onLoad={(widgetId) => {
                  // Turnstile loaded successfully
                }}
              />
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


