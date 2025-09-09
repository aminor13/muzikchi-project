'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { BlogPost, BlogCategory } from '@/types/blog'
import BlogSidebar from '@/components/blog/BlogSidebar'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (slug) {
      loadBlogPost()
    }
  }, [slug])

  const loadBlogPost = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load the specific post
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          category:blog_categories(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (postError) {
        setError('مقاله یافت نشد')
        return
      }

      if (postData) {
        setPost(postData)
        
        // Increment view count
        await supabase
          .from('blog_posts')
          .update({ view_count: postData.view_count + 1 })
          .eq('id', postData.id)

        // Load related posts
        await loadRelatedPosts(postData.category_id, postData.id)
      }

      // Load sidebar data
      await loadSidebarData()

    } catch (error) {
      console.error('Error loading blog post:', error)
      setError('خطا در بارگذاری مقاله')
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedPosts = async (categoryId: string | null, currentPostId: string) => {
    if (!categoryId) return

    const { data } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
        category:blog_categories(*)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .neq('id', currentPostId)
      .order('published_at', { ascending: false })
      .limit(3)

    if (data) {
      setRelatedPosts(data)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">مقاله یافت نشد</h2>
          <p className="text-gray-400 mb-6">{error || 'مقاله مورد نظر وجود ندارد'}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="bg-gray-800 rounded-xl overflow-hidden">
              {/* Featured Image */}
              {post.featured_image_url && (
                <div className="relative h-64 md:h-96 overflow-hidden">
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-8">
                {/* Meta Information */}
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                  {post.category && (
                    <Link
                      href={`/blog/category/${post.category.slug}`}
                      className="px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
                    >
                      {post.category.name}
                    </Link>
                  )}
                  
                  {post.author && (
                    <div className="flex items-center gap-2">
                      {post.author.avatar_url ? (
                        <Image
                          src={post.author.avatar_url}
                          alt={post.author.display_name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {post.author.display_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span>{post.author.display_name}</span>
                    </div>
                  )}
                  
                  {/* <span>•</span>
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                  {post.reading_time && (
                    <>
                      <span>•</span>
                      <span>{post.reading_time} دقیقه مطالعه</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{post.view_count} بازدید</span> */}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                {/* Content */}
                <div 
                  className="prose prose-lg prose-invert max-w-none text-gray-100"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {/* {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">برچسب‌ها:</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full hover:bg-gray-600 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">مقالات مرتبط</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 transition-colors"
                    >
                      {relatedPost.featured_image_url && (
                        <div className="relative h-32 overflow-hidden">
                          <Image
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {formatDate(relatedPost.published_at || relatedPost.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
