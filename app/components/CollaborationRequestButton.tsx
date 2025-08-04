'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface CollaborationRequestButtonProps {
  bandId: string
  userId: string
  hasActiveRequest: boolean
  isActiveMember: boolean
}

export default function CollaborationRequestButton({ bandId, userId, hasActiveRequest, isActiveMember }: CollaborationRequestButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isRejected, setIsRejected] = useState(false)

  // Check if user has been rejected before
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('band_members')
          .select('status')
          .eq('band_id', bandId)
          .eq('member_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          console.error('Error checking status:', error)
          return
        }

        setIsRejected(data?.status === 'rejected')
      } catch (error) {
        console.error('Error:', error)
      }
    }

    checkStatus()
  }, [bandId, userId])

  const handleRequest = async () => {
    if (!confirm('آیا از ارسال درخواست همکاری با این گروه اطمینان دارید؟')) {
      return
    }

    setIsLoading(true)
    try {
      // First check if a record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('band_members')
        .select('id, status')
        .eq('band_id', bandId)
        .eq('member_id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('band_members')
          .update({
            status: 'requested',
            role: 'member',
            created_at: new Date().toISOString(),
            request_type: 'request'
          })
          .eq('id', existingRecord.id)

        if (updateError) {
          throw updateError
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('band_members')
          .insert({
            band_id: bandId,
            member_id: userId,
            status: 'requested',
            role: 'member',
            created_at: new Date().toISOString(),
            request_type: 'request'
          })

        if (insertError) {
          throw insertError
        }
      }

      alert('درخواست همکاری با موفقیت ارسال شد')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'خطا در ارسال درخواست')
    } finally {
      setIsLoading(false)
    }
  }

  if (isActiveMember) {
    return (
      <div 
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed" 
        title="شما عضو این گروه هستید"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>عضو گروه</span>
      </div>
    )
  }

  if (hasActiveRequest) {
    return (
      <div className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed" title="درخواست در حال بررسی">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>درخواست در حال بررسی</span>
      </div>
    )
  }

  if (isRejected) {
    return (
      <div 
        className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed" 
        title="درخواست قبلی شما رد شده است"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
        <span>درخواست رد شده</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isLoading}
      className="bg-gray-800 border border-orange-700 text-gray-200 px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title="ارسال درخواست همکاری"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>در حال ارسال...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          <span>درخواست همکاری</span>
        </>
      )}
    </button>
  )
} 