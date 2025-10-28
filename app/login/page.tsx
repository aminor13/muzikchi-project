'use client'
import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react'
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
  const [phone, setPhone] = useState<string>('')
  const [otp, setOtp] = useState<string>('')
  const [mode, setMode] = useState<'password' | 'sms'>('password')
  const [otpStep, setOtpStep] = useState<'enter-phone' | 'enter-code'>('enter-phone')
  const [resendIn, setResendIn] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''
  

  const [showPassword, setShowPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ref for Turnstile wrapper to scale iframe responsively
  const turnstileWrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsClient(true)
    const savedEmail = localStorage.getItem('login_email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  // Make Turnstile match the width of inputs and have rounded corners via a wrapper
  useEffect(() => {
    if (!isClient) return
    const wrapper = turnstileWrapperRef.current
    if (!wrapper) return

    const BASE_WIDTH = 300
    const BASE_HEIGHT = 65

    const applyScale = () => {
      const iframe = wrapper.querySelector('iframe') as HTMLIFrameElement | null
      if (!iframe) return
      const scale = wrapper.clientWidth / BASE_WIDTH
      iframe.style.transformOrigin = '50% 50%'
      iframe.style.transform = `scale(${scale})`
      iframe.style.display = 'block'
      // Set wrapper height so the layout reserves correct space
      wrapper.style.height = `${BASE_HEIGHT * scale}px`
    }

    const resizeObserver = new ResizeObserver(applyScale)
    resizeObserver.observe(wrapper)

    const mutationObserver = new MutationObserver(applyScale)
    mutationObserver.observe(wrapper, { childList: true, subtree: true })

    // Initial attempt
    applyScale()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [isClient])

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    localStorage.setItem('login_email', e.target.value)
  }

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token)
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (mode === 'password' && (!email || !password)) {
        setError('لطفاً ایمیل و رمز عبور را وارد کنید')
        setLoading(false)
        return
      }

      if (!turnstileToken) {
        setError('لطفاً کپچا را تکمیل کنید')
        setLoading(false)
        return
      }

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

      if (mode === 'sms') {
        if (otpStep === 'enter-phone') {
          const r = await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          })
          const j = await r.json()
          if (!r.ok) {
            setError(j.error || 'ارسال کد ناموفق بود')
          } else {
            setOtpStep('enter-code')
            setResendIn(60)
          }
          setLoading(false)
          return
        } else {
          const r = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code: otp }),
          })
          const j = await r.json()
          if (!r.ok) {
            setError(j.error || 'کد نامعتبر است')
            setLoading(false)
            return
          }
          // For now, after verification just redirect or refresh; session handling will be added in server after we implement it
          router.push('/')
          setLoading(false)
          return
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (signInError) {
        setError('اطلاعات وارد شده صحیح نیستند یا حساب کاربری وجود ندارد')
        setLoading(false)
        return
      }

      if (data?.user) {
        if (!data.user.email_confirmed_at) {
          setError('لطفاً ابتدا ایمیل خود را تایید کنید. ایمیل تایید برای شما ارسال شده است.')
          setLoading(false)
          return
        }

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

        if (!data.user.email_confirmed_at) {
          router.push('/verify-email')
        } else if (!profile || !profile.is_complete) {
          router.push('/profile/complete')
        } else {
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

  // countdown for resend
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

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
            <div className="flex gap-2 mb-4">
              <button type="button" className={`flex-1 py-2 rounded-md text-sm ${mode==='password'?'bg-orange-600 text-white':'bg-gray-700 text-gray-200'}`} onClick={() => setMode('password')}>ایمیل/رمز</button>
              <button type="button" className={`flex-1 py-2 rounded-md text-sm ${mode==='sms'?'bg-orange-600 text-white':'bg-gray-700 text-gray-200'}`} onClick={() => {setMode('sms'); setOtpStep('enter-phone')}}>ورود با پیامک</button>
            </div>
            {mode === 'password' ? (
            <>
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
            </>
            ) : (
              <>
                {otpStep === 'enter-phone' ? (
                  <div className="mb-4">
                    <label htmlFor="phone" className="sr-only">شماره موبایل</label>
                    <input id="phone" name="phone" type="tel" required value={phone} onChange={(e)=>setPhone(e.target.value)} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800 max-w-sm mx-auto" placeholder="09123456789" dir="ltr" />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label htmlFor="otp" className="sr-only">کد یکبار مصرف</label>
                    <input id="otp" name="otp" type="text" required value={otp} onChange={(e)=>setOtp(e.target.value)} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800 max-w-sm mx-auto" placeholder="کد ۶ رقمی" dir="ltr" />
                    <div className="flex justify-between mt-2 text-sm text-gray-300">
                      <span>{resendIn>0 ? `امکان ارسال مجدد تا ${resendIn} ثانیه` : ''}</span>
                      <button type="button" disabled={resendIn>0} className={`underline ${resendIn>0?'opacity-50 cursor-not-allowed':'text-orange-400'}`} onClick={async ()=>{
                        setLoading(true)
                        const r = await fetch('/api/auth/otp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) })
                        const j = await r.json()
                        if (!r.ok) setError(j.error||'ارسال مجدد ناموفق بود')
                        else setResendIn(60)
                        setLoading(false)
                      }}>ارسال مجدد کد</button>
                    </div>
                  </div>
                )}
              </>
            )}
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

          {isClient && turnstileSiteKey ? (
            <div className="max-w-sm mx-auto">
              <div
                ref={turnstileWrapperRef}
                className="w-full overflow-hidden rounded-md border border-gray-300 bg-white flex items-center justify-center"
              >
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={handleTurnstileVerify}
                  theme="auto"
                  size="normal"
                  appearance="always"
                  language="fa"
                  onError={(error) => {
                    setError(`خطا در بارگذاری کپچا: ${error}`)
                  }}
                  onExpire={() => {
                    setTurnstileToken(null)
                  }}
                  onTimeout={() => {
                    setTurnstileToken(null)
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

          </div>
        </form>

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


