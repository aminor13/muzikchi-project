export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image_url?: string
  author_id?: string
  category_id?: string
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  created_at: string
  updated_at: string
  view_count: number
  reading_time?: number
  tags: string[]
  
  // Relations
  author?: {
    id: string
    display_name: string
    avatar_url?: string
  }
  category?: BlogCategory
}

export interface BlogPostView {
  id: string
  post_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  viewed_at: string
}

export interface BlogFilters {
  category?: string
  author?: string
  status?: 'draft' | 'published' | 'archived'
  search?: string
  tags?: string[]
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'published_at' | 'view_count' | 'title'
  sort_order?: 'asc' | 'desc'
}

export interface BlogStats {
  total_posts: number
  published_posts: number
  draft_posts: number
  total_views: number
  popular_posts: BlogPost[]
  recent_posts: BlogPost[]
  categories: BlogCategory[]
}
