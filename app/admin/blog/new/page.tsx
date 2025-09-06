'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/userContext'
import { BlogPost } from '@/types/blog'
import BlogEditor from '@/components/blog/BlogEditor'

export default function NewBlogPostPage() {
  const { user, profile } = useUser()
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  const handleSave = (post: BlogPost) => {
    setSaved(true)
    setTimeout(() => {
      router.push('/admin/blog')
    }, 1500)
  }

  const handleCancel = () => {
    router.push('/admin/blog')
  }

  // Check if user is admin
  if (!user || !profile || !(profile as any)?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">دسترسی غیرمجاز</h1>
          <p className="text-gray-400">شما دسترسی لازم برای مشاهده این صفحه را ندارید.</p>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">مقاله با موفقیت ذخیره شد!</h2>
          <p className="text-gray-400">در حال انتقال به صفحه مدیریت...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">مقاله جدید</h1>
          <p className="text-gray-400">مقاله جدیدی برای بلاگ ایجاد کنید</p>
        </div>

        {/* Editor */}
        <BlogEditor onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  )
}
