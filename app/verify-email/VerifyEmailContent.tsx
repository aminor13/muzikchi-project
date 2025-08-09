'use client'
import { useRouter } from 'next/navigation'

export default function VerifyEmailContent() {
  const router = useRouter()
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