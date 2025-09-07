'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BlogPost, BlogCategory } from '@/types/blog'

interface BlogEditorProps {
  post?: BlogPost
  onSave: (post: BlogPost) => void
  onCancel: () => void
}

export default function BlogEditor({ post, onSave, onCancel }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [content, setContent] = useState(post?.content || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featured_image_url || '')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState(post?.category_id || '')
  const [tags, setTags] = useState(post?.tags?.join(', ') || '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(post?.status || 'draft')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient()

  useEffect(() => {
    loadCategories()
  }, [])
  
  // Clean up local preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name')

    if (data) {
      setCategories(data)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!post) {
      setSlug(generateSlug(value))
    }
  }

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      setMessage(null);

      // Verify file type and size before uploading
      if (!file.type.startsWith('image/')) {
        throw new Error('فایل انتخاب شده یک تصویر معتبر نیست.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم فایل بیشتر از ۵ مگابایت است.');
      }

      // Local preview immediately
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('برای آپلود تصویر باید وارد شوید')

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `featured/${fileName}`

      // Create a new Blob to ensure the file data is fully loaded and not a stream
      const blob = new Blob([file], { type: file.type });

      // Upload the blob instead of the original file object
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, blob, { cacheControl: '31536000', upsert: false, contentType: file.type });

      if (uploadError) {
        throw new Error(`خطا در آپلود به Supabase: ${uploadError.message}`);
      }
      
      const { data: publicUrlData } = supabase
        .storage
        .from('blog-images')
        .getPublicUrl(filePath)
      
      const publicUrl = publicUrlData.publicUrl;

      // Add a small delay to ensure the URL is propagated
      await new Promise(resolve => setTimeout(resolve, 500));

      setFeaturedImageUrl(publicUrl);
      setMessage('تصویر با موفقیت آپلود شد.');
      
    } catch (e: any) {
      console.error('Image upload failed:', e)
      setMessage(e?.message || 'خطا در آپلود تصویر');
      if (localPreview) {
          URL.revokeObjectURL(localPreview);
      }
      setLocalPreview(null);
      setFeaturedImageUrl('');
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage('لطفاً عنوان و محتوا را پر کنید.');
      return
    }

    setLoading(true)
    setMessage(null);

    try {
      const postData = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim(),
        content: content.trim(),
        featured_image_url: featuredImageUrl.trim() || null,
        category_id: categoryId || null,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        status,
        reading_time: calculateReadingTime(content),
        ...(status === 'published' && !post?.published_at && { published_at: new Date().toISOString() })
      }

      if (post) {
        // Update existing post
        const { data, error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', post.id)
          .select()
          .single()

        if (error) throw error
        onSave(data)
      } else {
        // Create new post
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('کاربر وارد نشده است')

        const { data, error } = await supabase
          .from('blog_posts')
          .insert({
            ...postData,
            author_id: user.id
          })
          .select()
          .single()

        if (error) throw error
        onSave(data)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      setMessage('خطا در ذخیره مقاله');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-xl">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white font-medium mb-2">عنوان مقاله</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="عنوان مقاله را وارد کنید..."
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-white font-medium mb-2">نامک (Slug)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="نامک مقاله..."
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-white font-medium mb-2">خلاصه مقاله</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="خلاصه کوتاهی از مقاله..."
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-white font-medium mb-2">تصویر شاخص</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="url"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="آدرس تصویر شاخص..."
              />
              <div className="mt-3 flex items-center gap-3">
                <label className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    className="hidden"
                  />
                  {uploadingImage ? 'در حال آپلود...' : 'آپلود تصویر'}
                </label>
                {featuredImageUrl && (
                  <span className="text-gray-400 text-sm">URL تنظیم شد</span>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-2">فرمت‌های مجاز: jpg, jpeg, png, webp — حداکثر 5MB</p>
            </div>
            <div>
              {localPreview || featuredImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localPreview || featuredImageUrl} alt="پیش‌نمایش" className="w-full h-32 object-cover rounded-lg border border-gray-700" />
              ) : (
                <div className="w-full h-32 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center text-gray-400">
                  بدون پیش‌نمایش
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">دسته‌بندی</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">وضعیت</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشر شده</option>
              <option value="archived">آرشیو شده</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-white font-medium mb-2">برچسب‌ها</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="برچسب‌ها را با کاما جدا کنید..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-white font-medium mb-2">محتوای مقاله</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="محتوای مقاله را وارد کنید..."
          />
        </div>
        
        {/* Message for user */}
        {message && (
          <div className="mt-4 p-4 rounded-lg bg-gray-700 text-sm text-white">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره مقاله'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  )
}
