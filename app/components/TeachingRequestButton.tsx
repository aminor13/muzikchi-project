'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface TeachingRequestButtonProps {
  schoolId: string
  userId: string
  hasActiveRequest: boolean
  isActiveTeacher: boolean
}

export default function TeachingRequestButton({ schoolId, userId, hasActiveRequest, isActiveTeacher }: TeachingRequestButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleRequest = async () => {
    if (!confirm('آیا از ارسال درخواست تدریس در این آموزشگاه اطمینان دارید؟')) {
      return
    }

    setIsLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('school_teachers')
        .insert({
          school_id: schoolId,
          teacher_id: userId,
          status: 'requested',
          role: 'teacher',
          created_at: new Date().toISOString(),
          request_type: 'request'
        })

      if (insertError) {
        throw insertError
      }

      alert('درخواست تدریس با موفقیت ارسال شد')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'خطا در ارسال درخواست')
    } finally {
      setIsLoading(false)
    }
  }

  if (isActiveTeacher) {
    return (
      <div 
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed" 
        title="شما مدرس این آموزشگاه هستید"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>مدرس آموزشگاه</span>
      </div>
    )
  }

  if (hasActiveRequest) {
    return (
      <div 
        className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed" 
        title="درخواست در حال بررسی"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>درخواست در حال بررسی</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isLoading}
      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title="ارسال درخواست تدریس"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>در حال ارسال...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
          <span>درخواست تدریس</span>
        </>
      )}
    </button>
  )
} 