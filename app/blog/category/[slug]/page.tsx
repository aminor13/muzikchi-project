'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { BlogPost, BlogCategory } from '@/types/blog'
import BlogList from '@/components/blog/BlogList'
import BlogSidebar from '@/components/blog/BlogSidebar'

export default function BlogCategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (categorySlug) {
      loadCategoryData()
    }
  }, [categorySlug])

  const loadCategoryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load category info
      const { data: categoryData, error: categoryError } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('slug', categorySlug)
        .single()

      if (categoryError || !categoryData) {
        setError('دسته‌بندی یافت نشد')
        return
      }

      setCategory(categoryData)

      // Load posts for this category
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          category:blog_categories(*)
        `)
        .eq('category_id', categoryData.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (postsError) {
        console.error('Error loading posts:', postsError)
        setError('خطا در بارگذاری مقالات')
        return
      }

      if (postsData) {
        setPosts(postsData)
      }

      // Load sidebar data
      await loadSidebarData()

    } catch (error) {
      console.error('Error loading category data:', error)
      setError('خطا در بارگذاری داده‌ها')
    } finally {
      setLoading(false)
    }
  }

  const loadSidebarData = async () => {
    // Load categories
    const { data: categoriesData } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name')

    if (categoriesData) {
      setCategories(categoriesData)
    }

    // Load recent posts
    const { data: recentData } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
        category:blog_categories(*)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5)

    if (recentData) {
      setRecentPosts(recentData)
    }

    // Load popular posts
    const { data: popularData } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
        category:blog_categories(*)
      `)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5)

    if (popularData) {
      setPopularPosts(popularData)
    }
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

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">دسته‌بندی یافت نشد</h2>
          <p className="text-gray-400 mb-6">{error || 'دسته‌بندی مورد نظر وجود ندارد'}</p>
          <Link 
            href="/blog"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            بازگشت به بلاگ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-4xl font-bold text-white">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
          <p className="text-gray-400 mt-2">
            {posts.length} مقاله در این دسته‌بندی
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <BlogList 
              posts={posts}
              showFeatured={false}
              title=""
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BlogSidebar 
              categories={categories}
              recentPosts={recentPosts}
              popularPosts={popularPosts}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
