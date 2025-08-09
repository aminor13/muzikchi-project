'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasCode = searchParams.get('code')

  // If there's a code in URL, user came from email verification link
  if (hasCode) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          ایمیل شما با موفقیت تایید شد!
        </h2>
        <p className="text-gray-400 mb-6">
          حالا می‌توانید وارد حساب کاربری خود شوید.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          ورود به حساب کاربری
        </button>
      </div>
    )
  }

  // If no code, user just signed up and needs to check email
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">
        ایمیل فعالسازی ارسال شد!
      </h2>
      <p className="text-gray-400 mb-6">
        لطفاً ایمیل خود را بررسی کنید و روی لینک تایید کلیک کنید تا حساب کاربری شما فعال شود.
      </p>
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
    </div>
  )
} 