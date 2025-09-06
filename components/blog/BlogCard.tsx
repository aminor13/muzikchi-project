'use client'
import Link from 'next/link'
import Image from 'next/image'
import { BlogPost } from '@/types/blog'
import { formatDistanceToNow } from 'date-fns'
import { faPersian } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <article className={`bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl ${
      featured ? 'md:col-span-2' : ''
    }`}>
      {post.featured_image_url && (
        <div className={`relative ${featured ? 'h-64' : 'h-48'} overflow-hidden`}>
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-110"
          />
          {post.category && (
            <div 
              className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
            >
              {post.category.name}
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
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
          <span>•</span>
          <span>{formatDate(post.published_at || post.created_at)}</span>
          {post.reading_time && (
            <>
              <span>•</span>
              <span>{post.reading_time} دقیقه مطالعه</span>
            </>
          )}
        </div>

        <h2 className={`text-white font-bold mb-3 line-clamp-2 ${
          featured ? 'text-2xl' : 'text-xl'
        }`}>
          <Link 
            href={`/blog/${post.slug}`}
            className="hover:text-orange-400 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-gray-300 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{post.view_count} بازدید</span>
          </div>

          <Link 
            href={`/blog/${post.slug}`}
            className="text-orange-400 hover:text-orange-300 font-medium text-sm transition-colors"
          >
            ادامه مطلب →
          </Link>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                +{post.tags.length - 3} بیشتر
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
