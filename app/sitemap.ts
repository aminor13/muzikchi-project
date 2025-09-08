import { createClient } from '@supabase/supabase-js';

// مقادیر این دو را باید از .env بگیرین
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// URL اصلی سایت شما
const YOUR_WEBSITE_URL = 'https://muzikchi.ir';

export default async function sitemap() {
  try {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('slug, updated_at');
    
    if (postsError) {
      console.error('Error fetching posts from Supabase:', postsError);
      return []; // در صورت خطا یک آرایه خالی برمی‌گرداند
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username');

    if (usersError) {
      console.error('Error fetching users from Supabase:', usersError);
      return []; // در صورت خطا یک آرایه خالی برمی‌گرداند
    }

    // اضافه کردن صفحات ثابت
    const staticPages = [
      {
        url: YOUR_WEBSITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${YOUR_WEBSITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      // ... صفحات ثابت دیگر
    ];

    // اضافه کردن URLهای مقالات
    const postUrls = (posts || []).map(post => ({
      url: `${YOUR_WEBSITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // اضافه کردن URLهای پروفایل کاربران
    const userUrls = (users || []).map(user => ({
      url: `${YOUR_WEBSITE_URL}/profile/${user.username}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...staticPages, ...postUrls, ...userUrls];

  } catch (error) {
    console.error('An unexpected error occurred while generating sitemap:', error);
    return [];
  }
}
