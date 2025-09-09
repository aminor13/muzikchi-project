'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BlogPost, BlogCategory, BlogFilters } from '@/types/blog'
import BlogList from '@/components/blog/BlogList'
import BlogSidebar from '@/components/blog/BlogSidebar'
import BlogSearch from '@/components/blog/BlogSearch'

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filters, setFilters] = useState<BlogFilters>({
    status: 'published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: 12
  })

  const supabase = createClient()

  useEffect(() => {
    loadBlogData()
  }, [])

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

    } catch (error) {
      console.error('Error loading blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async (customFilters?: Partial<BlogFilters>) => {
    try {
      const currentFilters = { ...filters, ...customFilters }
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          category:blog_categories(*)
        `)
        .eq('status', 'published')

      // Apply filters
      if (currentFilters.category) {
        query = query.eq('category.slug', currentFilters.category)
      }

      if (currentFilters.search) {
        query = query.or(`title.ilike.%${currentFilters.search}%,excerpt.ilike.%${currentFilters.search}%,content.ilike.%${currentFilters.search}%`)
      }

      // if (currentFilters.tags && currentFilters.tags.length > 0) {
      //   query = query.overlaps('tags', currentFilters.tags)
      // }

      // Apply sorting
      if (currentFilters.sort_by) {
        query = query.order(currentFilters.sort_by, { 
          ascending: currentFilters.sort_order === 'asc' 
        })
      }

      // Apply pagination
      if (currentFilters.limit) {
        query = query.limit(currentFilters.limit)
      }

      if (currentFilters.page && currentFilters.limit) {
        const from = (currentFilters.page - 1) * currentFilters.limit
        const to = from + currentFilters.limit - 1
        query = query.range(from, to)
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

  const handleSearch = async (query: string, category?: string) => {
    setSearchLoading(true)
    const newFilters = {
      ...filters,
      search: query,
      category: category,
      page: 1
    }
    setFilters(newFilters)
    await loadPosts(newFilters)
    setSearchLoading(false)
  }

  const handleLoadMore = async () => {
    const newFilters = {
      ...filters,
      page: (filters.page || 1) + 1
    }
    setFilters(newFilters)
    await loadPosts(newFilters)
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">بلاگ موزیکچی</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            آخرین مقالات، نکات و راهنمایی‌های موسیقی را اینجا بخوانید
          </p>
        </div>

        {/* Search */}
        <BlogSearch 
          onSearch={handleSearch}
          categories={categories}
          loading={searchLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <BlogList 
              posts={posts}
              showFeatured={true}
              showLoadMore={posts.length >= (filters.limit || 12)}
              onLoadMore={handleLoadMore}
              loading={searchLoading}
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
