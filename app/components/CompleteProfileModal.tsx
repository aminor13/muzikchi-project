'use client'

import { useRouter } from 'next/navigation'

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompleteProfileModal({ isOpen, onClose }: CompleteProfileModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleEditProfile = () => {
    router.push('/profile/edit')
  }

  const handleSkip = () => {
    router.push('/')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">تکمیل اطلاعات پروفایل</h2>
        
        <p className="text-gray-300 mb-6">
          پروفایل شما با موفقیت ایجاد شد! برای افزایش شانس همکاری و دیده شدن، پیشنهاد می‌کنیم جزئیات بیشتری مانند:
        </p>
        
        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
          <li>سابقه کاری و تجربیات</li>
          <li>تجهیزات و امکانات</li>
          <li>نمونه کارها و گالری</li>
          <li>و سایر اطلاعات تکمیلی</li>
        </ul>

        <div className="flex gap-4">
          <button
            onClick={handleEditProfile}
            className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            تکمیل پروفایل
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            بعداً تکمیل می‌کنم
          </button>
        </div>
      </div>
    </div>
  )
} 