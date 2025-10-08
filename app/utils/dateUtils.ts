export function formatTimeToPersian(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
} 

export function formatDateToPersian(dateString: string): string {
  if (!dateString) {
    return 'تاریخ نامشخص';
  }

  // اصلاح رایج: جایگزینی خط تیره (-) با اسلش (/) برای سازگاری بهتر new Date() با فرمت YYYY-MM-DD
  const standardizedDateString = dateString.replace(/-/g, '/');
  
  const date = new Date(standardizedDateString);
  
  // بررسی معتبر بودن شیء تاریخ (جلوگیری از نمایش "تاریخ نامعتبر" به جای "Invalid Date")
  if (isNaN(date.getTime())) {
    return 'تاریخ نامعتبر';
  }

  // استفاده از API بومی جاوا اسکریپت برای تبدیل به شمسی (fa-IR)
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    // در صورت بروز خطا (مثلاً در مرورگرهای قدیمی)، از toLocaleDateString ساده استفاده می‌کنیم.
    return date.toLocaleDateString('fa-IR');
  }
}