'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type EventStatus = 'approved' | 'rejected'

interface AdminEventActionsProps {
  eventId: string
  onUpdate: () => void
}

export default function AdminEventActions({ eventId, onUpdate }: AdminEventActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState<EventStatus | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const router = useRouter()
  
  console.log('AdminEventActions received eventId:', eventId)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'خطا در بررسی دسترسی‌ها')
        }

        console.log('Auth check response:', data)
        setIsAdmin(data.isAdmin)
        
        if (!data.isAdmin) {
          setError('شما دسترسی لازم برای این عملیات را ندارید')
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setError('خطا در بررسی دسترسی‌ها')
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [])

  const handleAction = async (status: EventStatus) => {
    if (!eventId || !isAdmin) return

    setIsProcessing(true)
    setError(null)
    try {
      console.log('Sending request with:', { status, eventId, adminNote: adminNote.trim() || null })
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_note: adminNote.trim() || null,
        }),
      })

      const responseData = await response.json()
      console.log('Response:', { status: response.status, data: responseData })

      if (!response.ok) {
        throw new Error(responseData.error || 'خطا در پردازش درخواست')
      }

      console.log('Event updated successfully:', responseData)

      setShowActionDialog(null)
      setAdminNote('')
      onUpdate()
      router.refresh()
    } catch (error) {
      console.error('Error processing event:', error)
      setError(error instanceof Error ? error.message : 'خطا در پردازش درخواست')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDialogOpen = (status: EventStatus) => {
    if (!isAdmin) return
    setShowActionDialog(status)
    setAdminNote('')
    setError(null)
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return <div className="text-gray-500">در حال بررسی دسترسی‌ها...</div>
  }

  // Show error if not admin
  if (!isAdmin) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md">
        شما دسترسی لازم برای مدیریت رویدادها را ندارید
      </div>
    )
  }

  if (showActionDialog) {
    const isApprove = showActionDialog === 'approved'
    return (
      <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-bold text-lg mb-2">
          {isApprove ? 'تایید رویداد' : 'رد رویداد'}
        </h3>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder={isApprove ? "توضیحات یا نکات تکمیلی (اختیاری)..." : "دلیل رد رویداد را بنویسید..."}
          className="w-full p-2 border rounded-md text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(showActionDialog)}
            disabled={isProcessing || (!adminNote.trim() && showActionDialog === 'rejected')}
            className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 text-sm ${
              isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProcessing ? 'در حال پردازش...' : isApprove ? 'تایید رویداد' : 'رد رویداد'}
          </button>
          <button
            onClick={() => {
              setShowActionDialog(null)
              setAdminNote('')
              setError(null)
            }}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
          >
            انصراف
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleDialogOpen('approved')}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
      >
        تایید رویداد
      </button>
      <button
        onClick={() => handleDialogOpen('rejected')}
        className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
      >
        رد رویداد
      </button>
    </div>
  )
} 