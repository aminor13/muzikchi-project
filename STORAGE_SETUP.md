# Storage Setup Guide

## مشکل: فضای ذخیره‌سازی عکس‌ها یافت نشد

اگر با این خطا مواجه شدید، به معنای آن است که bucket ذخیره‌سازی عکس‌ها در Supabase ایجاد نشده است.

## راه‌حل‌ها:

### 1. استفاده از صفحه مدیریت (توصیه شده)

1. به آدرس `/admin/storage` بروید
2. روی دکمه "بررسی bucket ها" کلیک کنید
3. اگر bucket عکس‌ها وجود ندارد، روی دکمه "ایجاد bucket عکس‌ها" کلیک کنید

### 2. ایجاد دستی در Supabase Dashboard

1. به [Supabase Dashboard](https://supabase.com/dashboard) بروید
2. پروژه خود را انتخاب کنید
3. به بخش **Storage** بروید
4. روی **New bucket** کلیک کنید
5. نام bucket را `avatars` قرار دهید
6. گزینه **Public bucket** را فعال کنید
7. روی **Create bucket** کلیک کنید

### 3. تنظیمات پیشرفته bucket

برای امنیت بیشتر، می‌توانید bucket را خصوصی نگه دارید و از RLS (Row Level Security) استفاده کنید:

```sql
-- فعال کردن RLS برای storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ایجاد policy برای دسترسی کاربران به عکس‌های خود
CREATE POLICY "Users can view own avatar" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. بررسی از طریق API

می‌توانید وضعیت storage را از طریق API بررسی کنید:

```bash
curl -X GET http://localhost:3000/api/test-storage
```

### 5. عیب‌یابی

اگر همچنان مشکل دارید:

1. مطمئن شوید که متغیرهای محیطی Supabase درست تنظیم شده‌اند
2. بررسی کنید که کاربر دارای دسترسی admin باشد
3. در کنسول مرورگر، خطاهای مربوط به storage را بررسی کنید
4. از طریق Supabase Dashboard، وضعیت bucket ها را بررسی کنید

## نکات مهم:

- bucket باید نام دقیق `avatars` داشته باشد
- bucket باید public باشد تا عکس‌ها قابل دسترسی باشند
- حداکثر حجم فایل 2 مگابایت تنظیم شده است
- فرمت‌های مجاز: JPEG, PNG, GIF, WebP 