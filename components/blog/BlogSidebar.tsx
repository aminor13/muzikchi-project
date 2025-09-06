'use client'
import { BlogCategory, BlogPost } from '@/types/blog'
import Link from 'next/link'

interface BlogSidebarProps {
  categories: BlogCategory[]
  recentPosts: BlogPost[]
  popularPosts: BlogPost[]
}

export default function BlogSidebar({ categories, recentPosts, popularPosts }: BlogSidebarProps) {
  return (
    <aside className="space-y-8">
      {/* Categories */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">دسته‌بندی‌ها</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  {category.name}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">آخرین مقالات</h3>
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="flex gap-3">
                {post.featured_image_url && (
                  <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(post.published_at || post.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Posts */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">محبوب‌ترین مقالات</h3>
        <div className="space-y-4">
          {popularPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {post.view_count} بازدید
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">عضویت در خبرنامه</h3>
        <p className="text-orange-100 mb-4 text-sm">
          آخرین مقالات و اخبار موسیقی را دریافت کنید
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="ایمیل شما"
            className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button className="w-full bg-white text-orange-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            عضویت
          </button>
        </div>
      </div>
    </aside>
  )
}
