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
    const checkUser = async () => {
      setVerifying(true)
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user && user.email_confirmed_at) {
          updateUser(user);
          router.push('/profile/complete');
        }
      } catch (err) {
        setError('خطا در بررسی وضعیت تایید ایمیل.');
      } finally {
        setVerifying(false);
      }
    };
    checkUser();
  }, [router, updateUser]);

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

  // Show success message when user is not yet confirmed
  if (!verifying && !error) {
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
          ثبت‌نام موفقیت‌آمیز بود!
        </h2>
        <p className="text-gray-400 mb-6">
          اگر ایمیل خود را تایید کرده‌اید، به صورت خودکار به مرحله بعد منتقل می‌شوید.<br/>
          در غیر این صورت، لطفاً ایمیل خود را بررسی و تایید کنید.
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

  return null
} 