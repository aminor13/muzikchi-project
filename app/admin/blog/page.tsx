'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { BlogPost, BlogCategory } from '@/types/blog'
import { useUser } from '@/context/userContext'

export default function AdminBlogPage() {
  const { user, profile } = useUser()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const supabase = createClient()

  useEffect(() => {
    if (user && profile) {
      loadBlogData()
    }
  }, [user, profile])

  const loadBlogData = async () => {
    try {
      setLoading(true)

      // Load categories
      const { data: categoriesData } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Load posts
      await loadPosts()

    } catch (error) {
      console.error('Error loading blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading posts:', error)
        return
      }

      if (data) {
        setPosts(data)
      }

    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const handleStatusChange = async (postId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', postId)

      if (error) {
        console.error('Error updating post status:', error)
        return
      }

      // Reload posts
      await loadPosts()

    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این مقاله را حذف کنید؟')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      if (error) {
        console.error('Error deleting post:', error)
        return
      }

      // Reload posts
      await loadPosts()

    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-500', text: 'پیش‌نویس' },
      published: { color: 'bg-green-500', text: 'منتشر شده' },
      archived: { color: 'bg-gray-500', text: 'آرشیو شده' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return (
      <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">مدیریت بلاگ</h1>
            <p className="text-gray-400">مدیریت مقالات و دسته‌بندی‌های بلاگ</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/blog/categories"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              مدیریت دسته‌ها
            </Link>
            <Link
              href="/admin/blog/new"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              مقاله جدید
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">فیلتر بر اساس وضعیت:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any)
                loadPosts()
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">همه</option>
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشر شده</option>
              <option value="archived">آرشیو شده</option>
            </select>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right text-white font-medium">عنوان</th>
                  <th className="px-6 py-4 text-right text-white font-medium">نویسنده</th>
                  <th className="px-6 py-4 text-right text-white font-medium">دسته‌بندی</th>
                  <th className="px-6 py-4 text-right text-white font-medium">وضعیت</th>
                  <th className="px-6 py-4 text-right text-white font-medium">تاریخ ایجاد</th>
                  <th className="px-6 py-4 text-right text-white font-medium">بازدید</th>
                  <th className="px-6 py-4 text-right text-white font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="text-white font-medium mb-1">{post.title}</h3>
                        {post.excerpt && (
                          <p className="text-gray-400 text-sm line-clamp-2">{post.excerpt}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {post.author?.display_name || 'نامشخص'}
                    </td>
                    <td className="px-6 py-4">
                      {post.category ? (
                        <span 
                          className="px-2 py-1 text-xs font-medium text-white rounded-full"
                          style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">بدون دسته</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {post.view_count}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/blog/edit/${post.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          ویرایش
                        </Link>
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post.id, e.target.value as any)}
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="draft">پیش‌نویس</option>
                          <option value="published">منتشر شده</option>
                          <option value="archived">آرشیو شده</option>
                        </select>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">مقاله‌ای یافت نشد</h3>
              <p className="text-gray-400 mb-6">هنوز مقاله‌ای ایجاد نشده است.</p>
              <Link
                href="/admin/blog/new"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ایجاد اولین مقاله
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
