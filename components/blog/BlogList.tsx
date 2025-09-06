'use client'
import { BlogPost } from '@/types/blog'
import BlogCard from './BlogCard'
import { useState } from 'react'

interface BlogListProps {
  posts: BlogPost[]
  showFeatured?: boolean
  title?: string
  showLoadMore?: boolean
  onLoadMore?: () => void
  loading?: boolean
}

export default function BlogList({ 
  posts, 
  showFeatured = true, 
  title,
  showLoadMore = false,
  onLoadMore,
  loading = false
}: BlogListProps) {
  const [featuredPost] = posts.length > 0 ? [posts[0]] : []
  const regularPosts = showFeatured ? posts.slice(1) : posts

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {title && (
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          {title}
        </h1>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">مقاله‌ای یافت نشد</h3>
          <p className="text-gray-400">هنوز مقاله‌ای منتشر نشده است.</p>
        </div>
      ) : (
        <>
          {/* Featured Post */}
          {showFeatured && featuredPost && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">مقاله ویژه</h2>
              <BlogCard post={featuredPost} featured={true} />
            </div>
          )}

          {/* Regular Posts Grid */}
          {regularPosts.length > 0 && (
            <div className="mb-8">
              {!showFeatured && (
                <h2 className="text-2xl font-bold text-white mb-6">آخرین مقالات</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Load More Button */}
          {showLoadMore && onLoadMore && (
            <div className="text-center">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'در حال بارگذاری...' : 'مشاهده مقالات بیشتر'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
