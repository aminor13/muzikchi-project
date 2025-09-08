import { createClient } from '@supabase/supabase-js';

// مقادیر این دو را باید از .env بگیرین
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key environment variables!');
  // برای جلوگیری از کامپایل ارور در محیط لوکال، از پرتاب خطا صرف نظر می کنیم
  // اگر متغیرها موجود نباشند، تابع یک آرایه خالی را برمی گرداند
}

// مطمئن شوید که اتصال تنها زمانی برقرار می شود که متغیرها موجود باشند
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// URL اصلی سایت شما
const YOUR_WEBSITE_URL = 'https://muzikchi.ir';

// نام جداول را از env قابل تنظیم می‌کنیم تا با اسامی جداول موجود همخوانی داشته باشد
// طبق استفاده‌های دیگر پروژه، جدول پست‌ها: blog_posts و جدول کاربران/پروفایل‌ها: profiles
const POSTS_TABLE = process.env.NEXT_PUBLIC_SUPABASE_POSTS_TABLE || 'blog_posts';
const USERS_TABLE = process.env.NEXT_PUBLIC_SUPABASE_USERS_TABLE || 'profiles';

export default async function sitemap() {
  try {
    if (!supabase) {
        console.error('Supabase client is not initialized due to missing environment variables.');
        return [];
    }

    const { data: posts, error: postsError } = await supabase
      .from(POSTS_TABLE)
      .select('slug, updated_at');
    
    if (postsError) {
      console.error('Error fetching posts from Supabase:', postsError);
      return []; // در صورت خطا یک آرایه خالی برمی‌گرداند
    }

    const { data: users, error: usersError } = await supabase
      .from(USERS_TABLE)
      .select('display_name');

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
      url: `${YOUR_WEBSITE_URL}/profile/${user.display_name}`,
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
