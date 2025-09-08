// next-sitemap.config.js
module.exports = {
    siteUrl: 'https://muzikchi.ir', // آدرس سایت شما
    generateRobotsTxt: true, // این باعث میشه robots.txt هم ساخته بشه
    exclude: ['/sitemap/route.js', '/sitemap/route.ts'], // مسیر فایل route handler شما
    robotsTxtOptions: {
      // اگر فایل sitemap.xml رو توسط next-sitemap بسازید، اینجا آدرسش رو میدین
      // اما چون ما route handler داریم، باید آدرس route handler رو بدیم
      additionalSitemaps: [
        'https://muzikchi.ir/sitemap', // آدرس فایل Sitemap پویا (Route Handler)
      ],
      policies: [
          { userAgent: '*', allow: '/' }, // تنظیمات دسترسی ربات ها
          // اگر بخواهید بخشی از سایت بلاک بشه:
          // { userAgent: '*', disallow: '/private' }
      ]
    },
  };