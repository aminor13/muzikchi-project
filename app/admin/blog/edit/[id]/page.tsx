"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@/context/userContext'
import { createClient } from '@/utils/supabase/client'
import { BlogPost } from '@/types/blog'
import BlogEditor from '@/components/blog/BlogEditor'

export default function EditBlogPostPage() {
  const { user, profile } = useUser()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!postId) return
    loadPost()
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url)
        `)
        .eq('id', postId)
        .maybeSingle()

      if (error) {
        console.error('Error loading post:', error)
        setNotFound(true)
        return
      }

      if (!data) {
        setNotFound(true)
        return
      }

      setPost(data)
    } catch (e) {
      console.error('Error loading post:', e)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (updated: BlogPost) => {
    router.push('/admin/blog')
  }

  const handleCancel = () => {
    router.push('/admin/blog')
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">مقاله یافت نشد</h2>
          <p className="text-gray-400 mb-6">این مقاله وجود ندارد یا حذف شده است.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ویرایش مقاله</h1>
          <p className="text-gray-400">اطلاعات مقاله را ویرایش کنید</p>
        </div>

        <BlogEditor post={post} onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  )
}
