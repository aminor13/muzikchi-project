import { createClient } from '@supabase/supabase-js';

// مقادیر این دو رو باید از .env بگیرین
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const YOUR_WEBSITE_URL = 'https://muzikchi.ir';

// تابعی برای تولید XML Sitemap
type SitemapField = { loc: string; lastmod?: string };

const buildSitemapXml = (fields: SitemapField[]): string => {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  fields.forEach((field) => {
    sitemap += `
    <url>
      <loc>${field.loc}</loc>${field.lastmod ? `
      <lastmod>${field.lastmod}</lastmod>` : ''}
    </url>`;
  });

  sitemap += `
</urlset>`;
  return sitemap;
};

export async function GET(_request: Request): Promise<Response> {
  try {
    // گرفتن اطلاعات مقالات از جدول 'posts'
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('slug, updated_at');
    if (postsError) throw postsError;

    // گرفتن اطلاعات کاربران از جدول 'users'
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username');
    if (usersError) throw usersError;

    const fields: SitemapField[] = [];

    // افزودن صفحات ثابت (مثلا)
    fields.push({ loc: YOUR_WEBSITE_URL });
    fields.push({ loc: `${YOUR_WEBSITE_URL}/blog` });
    // ... سایر صفحات ثابت

    // افزودن مقالات
    (posts ?? []).forEach((post: { slug: string; updated_at?: string | null }) => {
      fields.push({
        loc: `${YOUR_WEBSITE_URL}/blog/${post.slug}`,
        lastmod: post.updated_at ? new Date(post.updated_at).toISOString() : new Date().toISOString(),
      });
    });

    // افزودن صفحات پروفایل کاربران
    (users ?? []).forEach((user: { username: string }) => {
      fields.push({
        loc: `${YOUR_WEBSITE_URL}/profile/${user.username}`,
        // میتونید lastmod رو هم برای پروفایل ها اضافه کنید اگر در دیتابیس دارید
        // lastmod: user.updated_at ? new Date(user.updated_at).toISOString() : new Date().toISOString(),
      });
    });

    const sitemapXml = buildSitemapXml(fields);

    // تنظیم هدر برای پاسخ XML
    const response = new Response(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        // کشینگ برای افزایش سرعت (اختیاری)
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate', // کش برای 24 ساعت
      },
    });

    return response;

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}