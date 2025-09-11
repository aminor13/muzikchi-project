import { type Metadata } from 'next'
import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'

interface LayoutProps {
  children: ReactNode
}

interface Params {
  params: { slug: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, featured_image_url, tags')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  const siteName = 'موزیکچی'
  const title = post?.title ? `${post.title} | ${siteName}` : siteName
  const description = (post?.excerpt || '').slice(0, 160) || 'مقالات، نکات و راهنمایی‌های موسیقی در موزیکچی'
  const image = post?.featured_image_url || '/og-default.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    other: post?.tags && post.tags.length > 0 ? { 'keywords': post.tags.join(', ') } : undefined,
  }
}

export default function BlogPostLayout({ children }: LayoutProps) {
  return children
}
