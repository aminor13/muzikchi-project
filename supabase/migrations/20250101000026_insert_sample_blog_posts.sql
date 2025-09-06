-- Insert sample blog posts for testing
-- Note: You'll need to replace the author_id with actual user IDs from your profiles table

-- First, let's get a sample author ID (replace with actual user ID)
-- You can find user IDs by running: SELECT id, display_name FROM profiles WHERE is_admin = true LIMIT 1;

-- Sample blog posts
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  category_id,
  status,
  published_at,
  reading_time,
  tags,
  view_count
) VALUES 
(
  'نکات مهم برای شروع نوازندگی گیتار',
  'guitar-beginner-tips',
  'اگر تازه شروع به یادگیری گیتار کرده‌اید، این نکات مهم را از دست ندهید. از انتخاب گیتار مناسب تا تمرینات روزانه.',
  '<h2>انتخاب گیتار مناسب</h2>
  <p>اولین قدم برای شروع نوازندگی گیتار، انتخاب یک گیتار مناسب است. برای مبتدیان، گیتار کلاسیک یا آکوستیک پیشنهاد می‌شود.</p>
  
  <h3>نکات مهم در انتخاب گیتار:</h3>
  <ul>
    <li>اندازه مناسب برای دست‌های شما</li>
    <li>کیفیت صدا و ساخت</li>
    <li>قیمت مناسب برای شروع</li>
    <li>راحتی در نوازندگی</li>
  </ul>
  
  <h2>تمرینات روزانه</h2>
  <p>تمرین منظم و روزانه کلید موفقیت در نوازندگی است. حداقل 30 دقیقه تمرین روزانه توصیه می‌شود.</p>
  
  <h3>برنامه تمرینی پیشنهادی:</h3>
  <ol>
    <li>گرم کردن انگشتان (5 دقیقه)</li>
    <li>تمرین آکوردهای پایه (10 دقیقه)</li>
    <li>تمرین ریتم‌های ساده (10 دقیقه)</li>
    <li>یادگیری آهنگ جدید (5 دقیقه)</li>
  </ol>',
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=400&fit=crop',
  (SELECT id FROM blog_categories WHERE slug = 'master-your-craft'),
  'published',
  NOW() - INTERVAL '2 days',
  5,
  ARRAY['گیتار', 'مبتدی', 'نوازندگی', 'موسیقی'],
  45
),
(
  'چگونه گروه موسیقی خود را تشکیل دهید',
  'forming-music-band',
  'تشکیل گروه موسیقی نیاز به برنامه‌ریزی و شناخت درست از اعضا دارد. در این مقاله راهنمای کاملی ارائه می‌دهیم.',
  '<h2>شناسایی اعضای مناسب</h2>
  <p>اولین قدم در تشکیل گروه موسیقی، شناسایی اعضای مناسب است. هر عضو باید مهارت‌های لازم را داشته باشد.</p>
  
  <h3>نقش‌های اصلی در گروه:</h3>
  <ul>
    <li><strong>خواننده:</strong> مسئول اجرای آواز</li>
    <li><strong>گیتاریست:</strong> نوازنده گیتار ریتم یا لید</li>
    <li><strong>باسیست:</strong> نوازنده گیتار باس</li>
    <li><strong>درامر:</strong> نوازنده درام</li>
    <li><strong>کیبوردیست:</strong> نوازنده کیبورد (اختیاری)</li>
  </ul>
  
  <h2>برنامه‌ریزی تمرینات</h2>
  <p>تمرینات منظم و برنامه‌ریزی شده برای موفقیت گروه ضروری است.</p>
  
  <h3>نکات مهم در برنامه‌ریزی:</h3>
  <ol>
    <li>تعیین زمان‌های ثابت برای تمرین</li>
    <li>انتخاب مکان مناسب برای تمرین</li>
    <li>تهیه لیست آهنگ‌های مورد نظر</li>
    <li>تقسیم وظایف بین اعضا</li>
  </ol>',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
  (SELECT id FROM blog_categories WHERE slug = 'musician-networking'),
  'published',
  NOW() - INTERVAL '5 days',
  7,
  ARRAY['گروه موسیقی', 'تشکیل گروه', 'موسیقی', 'همکاری'],
  78
),
(
  'راهنمای خرید اولین گیتار الکتریک',
  'buying-first-electric-guitar',
  'انتخاب گیتار الکتریک مناسب برای مبتدیان می‌تواند چالش‌برانگیز باشد. این راهنما به شما کمک می‌کند.',
  '<h2>انواع گیتار الکتریک</h2>
  <p>گیتارهای الکتریک در انواع مختلفی تولید می‌شوند که هر کدام ویژگی‌های خاص خود را دارند.</p>
  
  <h3>انواع اصلی:</h3>
  <ul>
    <li><strong>Stratocaster:</strong> صدای روشن و شفاف</li>
    <li><strong>Les Paul:</strong> صدای گرم و قوی</li>
    <li><strong>Telecaster:</strong> صدای تیز و واضح</li>
    <li><strong>SG:</strong> سبک و راحت</li>
  </ul>
  
  <h2>نکات مهم در خرید</h2>
  <p>قبل از خرید گیتار الکتریک، نکات مهمی را باید در نظر بگیرید.</p>
  
  <h3>چک‌لیست خرید:</h3>
  <ol>
    <li>بودجه خود را تعیین کنید</li>
    <li>سبک موسیقی مورد علاقه را مشخص کنید</li>
    <li>گیتار را شخصاً امتحان کنید</li>
    <li>کیفیت ساخت را بررسی کنید</li>
    <li>آمپلیفایر مناسب را در نظر بگیرید</li>
  </ol>
  
  <h2>برندهای پیشنهادی</h2>
  <p>برای مبتدیان، برندهای زیر پیشنهاد می‌شوند:</p>
  <ul>
    <li>Fender Squier</li>
    <li>Epiphone</li>
    <li>Ibanez</li>
    <li>Yamaha</li>
  </ul>',
  'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&h=400&fit=crop',
  (SELECT id FROM blog_categories WHERE slug = 'gear-reviews'),
  'published',
  NOW() - INTERVAL '1 week',
  6,
  ARRAY['گیتار الکتریک', 'خرید', 'مبتدی', 'تجهیزات'],
  92
),
(
  'تاریخچه موسیقی راک در ایران',
  'history-rock-music-iran',
  'موسیقی راک در ایران تاریخچه جالبی دارد. از اولین گروه‌ها تا امروز، این سبک موسیقی مسیر پر فراز و نشیبی را طی کرده است.',
  '<h2>آغاز موسیقی راک در ایران</h2>
  <p>موسیقی راک در ایران از دهه 1340 شروع شد و تحت تأثیر موسیقی غربی قرار گرفت.</p>
  
  <h3>گروه‌های پیشگام:</h3>
  <ul>
    <li><strong>کوروش یغمایی:</strong> پدر راک ایران</li>
    <li><strong>کاوه یغمایی:</strong> ادامه‌دهنده راه پدر</li>
    <li><strong>بند:</strong> یکی از اولین گروه‌های راک</li>
  </ul>
  
  <h2>دوران طلایی</h2>
  <p>دهه 1370 و 1380 دوران طلایی موسیقی راک در ایران بود.</p>
  
  <h3>گروه‌های مطرح این دوره:</h3>
  <ol>
    <li>اوهام</li>
    <li>کاوه آفاق</li>
    <li>آریان</li>
    <li>رستاک</li>
  </ol>
  
  <h2>وضعیت امروز</h2>
  <p>امروزه موسیقی راک در ایران با چالش‌های مختلفی روبرو است اما همچنان طرفداران خود را دارد.</p>',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
  (SELECT id FROM blog_categories WHERE slug = 'music-history'),
  'published',
  NOW() - INTERVAL '3 days',
  8,
  ARRAY['موسیقی راک', 'تاریخچه', 'ایران', 'موسیقی'],
  156
),
(
  'راهنمای استفاده از پلتفرم موزیکچی',
  'musikchi-platform-guide',
  'پلتفرم موزیکچی ابزاری قدرتمند برای ارتباط موزیسین‌ها است. در این راهنما نحوه استفاده بهینه از آن را یاد می‌گیرید.',
  '<h2>ایجاد پروفایل</h2>
  <p>اولین قدم برای استفاده از موزیکچی، ایجاد پروفایل کامل است.</p>
  
  <h3>اطلاعات ضروری:</h3>
  <ul>
    <li>نام و نام خانوادگی</li>
    <li>تخصص و مهارت‌ها</li>
    <li>تجربیات موسیقی</li>
    <li>تصاویر و نمونه کارها</li>
  </ul>
  
  <h2>جستجو و اتصال</h2>
  <p>با استفاده از ابزارهای جستجوی پیشرفته، می‌توانید موزیسین‌های مناسب را پیدا کنید.</p>
  
  <h3>فیلترهای جستجو:</h3>
  <ol>
    <li>نوع موزیسین (خواننده، نوازنده، آهنگساز)</li>
    <li>ساز تخصصی</li>
    <li>سبک موسیقی</li>
    <li>موقعیت جغرافیایی</li>
    <li>سطح تجربه</li>
  </ol>
  
  <h2>مدیریت رویدادها</h2>
  <p>می‌توانید رویدادهای موسیقی خود را در پلتفرم ایجاد و مدیریت کنید.</p>',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=400&fit=crop',
  (SELECT id FROM blog_categories WHERE slug = 'bandmix-101'),
  'published',
  NOW() - INTERVAL '1 day',
  4,
  ARRAY['موزیکچی', 'راهنما', 'پلتفرم', 'موزیسین'],
  203
);

-- Update view counts for some posts to make them more realistic
UPDATE blog_posts SET view_count = 45 WHERE slug = 'guitar-beginner-tips';
UPDATE blog_posts SET view_count = 78 WHERE slug = 'forming-music-band';
UPDATE blog_posts SET view_count = 92 WHERE slug = 'buying-first-electric-guitar';
UPDATE blog_posts SET view_count = 156 WHERE slug = 'history-rock-music-iran';
UPDATE blog_posts SET view_count = 203 WHERE slug = 'musikchi-platform-guide';
