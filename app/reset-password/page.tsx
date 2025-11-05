'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// پالی‌فیل برای WebCrypto
const cryptoPolyfill = {
  getRandomValues: (buffer: Uint8Array) => {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256)
    }
    return buffer
  },
  subtle: {
    digest: async (algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> => {
      // این یک پیاده‌سازی ساده است و فقط برای موارد غیر امنیتی مناسب است
      return new ArrayBuffer(32) // 256-bit hash
    }
  }
}

// تابع کمکی برای دسترسی به crypto
const getCrypto = () => {
  if (typeof window === 'undefined') return null
  return window.crypto || cryptoPolyfill
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // اگر با لینک ایمیل آمده باشد، سشن را برقرار کن (چه به صورت code param و چه به صورت hash access_token)
  useEffect(() => {
    const code = searchParams.get('code')

    const establishSession = async () => {
      try {
        // 1) اگر code داریم (الگوی {TOKEN})
        if (code) {
          const { error } = await (supabase.auth as any).exchangeCodeForSession(code)
          if (error) {
            setMessage({ type: 'error', text: 'اعتبارسنجی لینک بازیابی ناموفق بود. لطفاً دوباره تلاش کنید.' })
            return
          }
          // پاکسازی پارامتر از آدرس
          router.replace('/reset-password')
          return
        }

        // 2) در غیر این صورت، ممکن است توکن‌ها در hash باشند (#access_token=...&type=recovery)
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          // supabase با detectSessionInUrl=true خودش hash را پردازش می‌کند
          // کمی صبر می‌کنیم تا کلاینت سشن را ست کند سپس hash را پاک می‌کنیم
          setTimeout(async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
              setMessage({ type: 'error', text: 'عدم موفقیت در برقراری سشن بازیابی. لینک را دوباره باز کنید.' })
              return
            }
            router.replace('/reset-password')
          }, 300)
        }
      } catch (err) {
        console.error('establishSession error', err)
        setMessage({ type: 'error', text: 'خطا در اعتبارسنجی لینک بازیابی' })
      }
    }

    establishSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // بررسی تطابق رمز عبور
    if (password !== passwordConfirm) {
      setMessage({
        type: 'error',
        text: 'رمز عبور و تکرار آن مطابقت ندارند'
      })
      setLoading(false)
      return
    }

    // بررسی طول رمز عبور
    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'رمز عبور باید حداقل ۸ کاراکتر باشد'
      })
      setLoading(false)
      return
    }

    try {
      // قبل از تغییر رمز، مطمئن شو سشن وجود دارد
      let { data } = await supabase.auth.getSession()

      // اگر سشنی وجود ندارد و code هست، تلاش برای تبادل کد
      if (!data.session) {
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await (supabase.auth as any).exchangeCodeForSession(code)
          if (exchangeError) {
            setMessage({ type: 'error', text: 'اعتبارسنجی لینک بازیابی ناموفق بود. لطفاً دوباره تلاش کنید.' })
            setLoading(false)
            return
          }
          data = (await supabase.auth.getSession()).data
        }
      }

      // اگر هنوز سشنی نیست، پیام واضح بده
      if (!data.session) {
        setMessage({ type: 'error', text: 'سشن احراز هویت یافت نشد. لطفاً لینک ایمیل را مجدداً باز کنید.' })
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'رمز عبور با موفقیت تغییر کرد'
      })

      // بعد از 2 ثانیه به صفحه لاگین برو
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'خطا در تغییر رمز عبور'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            تغییر رمز عبور
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            رمز عبور جدید خود را وارد کنید
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                رمز عبور جدید
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800"
                placeholder="رمز عبور جدید"
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="password-confirm" className="sr-only">
                تکرار رمز عبور جدید
              </label>
              <input
                id="password-confirm"
                name="password-confirm"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800"
                placeholder="تکرار رمز عبور جدید"
                dir="ltr"
              />
            </div>
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
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره رمز عبور جدید'}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={() => router.push('/login')}
              className="font-medium text-orange-600 hover:text-orange-500 bg-transparent border-0 cursor-pointer"
            >
              بازگشت به صفحه ورود
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 