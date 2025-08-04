'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface DeleteEventButtonProps {
  eventId: string
  posterUrl?: string | null
}

export default function DeleteEventButton({ eventId, posterUrl }: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این رویداد اطمینان دارید؟')) {
      return
    }

    setIsDeleting(true)
    try {
      const supabase = createClient()

      // حذف پوستر از استوریج اگر وجود داشته باشد
      if (posterUrl) {
        const posterPath = posterUrl.split('/').pop()
        if (posterPath) {
          await supabase.storage.from('event-posters').remove([posterPath])
        }
      }

      // حذف رویداد از دیتابیس
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('خطا در حذف رویداد')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
    >
      {isDeleting ? 'در حال حذف...' : 'حذف'}
    </button>
  )
} 