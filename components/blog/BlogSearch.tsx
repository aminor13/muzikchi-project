'use client'
import { useState } from 'react'
import { BlogCategory } from '@/types/blog'

interface BlogSearchProps {
  onSearch: (query: string, category?: string) => void
  categories: BlogCategory[]
  loading?: boolean
}

export default function BlogSearch({ onSearch, categories, loading = false }: BlogSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery, selectedCategory || undefined)
  }

  const handleClear = () => {
    setSearchQuery('')
    setSelectedCategory('')
    onSearch('')
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در مقالات..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'جستجو...' : 'جستجو'}
          </button>
        </div>
        
        {(searchQuery || selectedCategory) && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">فیلترهای فعال:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            {selectedCategory && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                {categories.find(c => c.slug === selectedCategory)?.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              پاک کردن همه
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
