// در فایل: dateUtils.ts

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// تابع کمکی برای تبدیل ارقام فارسی/عربی به انگلیسی
function toEnglishDigits(s: string): string {
    return s.replace(/[۰-۹]/g, d => englishDigits[persianDigits.indexOf(d)])
             .replace(/[٠-٩]/g, d => englishDigits[d.charCodeAt(0) - 1632]); // برای ارقام عربی هم هست
}

/**
 * تابعی برای فرمت‌دهی تاریخ، با در نظر گرفتن تاریخ‌های شمسی که از قبل از API آمده‌اند.
 * اگر ورودی تاریخ شمسی باشد، مستقیما آن را برمی‌گرداند تا از خطای new Date() جلوگیری شود.
 * @param dateString رشته تاریخ ورودی (مانند '۱۴۰۴/۷/۱۸' یا '2025-10-09')
 * @returns رشته تاریخ شمسی فرمت شده یا تاریخ نامعتبر
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) {
    return 'تاریخ نامشخص';
  }

  // اگر رشته تاریخ شامل '/' است و با رقم '۱' شروع می‌شود، فرض می‌کنیم تاریخ شمسی است.
  // این شرط از اجرای new Date() روی تاریخ شمسی جلوگیری می‌کند.
  const isJalaliFormat = dateString.includes('/') && 
                         (dateString.startsWith('1') || dateString.startsWith('۱') || dateString.startsWith('١'));

  if (isJalaliFormat) {
    // تاریخ شمسی را مستقیما برمی‌گردانیم، چون مشکل شما این است که
    // تاریخ از قبل در فرمت شمسی (۱۴۰۴/۷/۱۸) به شما رسیده است.
    return dateString;
  }
  
  // --- برای تاریخ‌های میلادی/ISO (حالت استاندارد) ---
  
  // ابتدا ارقام را به انگلیسی تبدیل می‌کنیم تا new Date() بتواند آن را بخواند.
  const cleanDateString = toEnglishDigits(dateString).replace(/-/g, '/');
  
  // افزودن UTC برای خواندن مطمئن‌تر توسط new Date()
  const isoDateString = cleanDateString.length <= 10 && !cleanDateString.includes('T') ? 
                        `${cleanDateString}T00:00:00Z` : cleanDateString;
  
  const date = new Date(isoDateString);
  
  if (isNaN(date.getTime())) {
    console.error(`Invalid date detected for input: ${dateString}`);
    return 'تاریخ نامعتبر';
  }

  // تبدیل تاریخ میلادی به شمسی
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString('fa-IR');
  }
}

// تابع فعلی برای فرمت‌دهی زمان (بدون تغییر)
export function formatTimeToPersian(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  // می‌توانید از toEnglishDigits استفاده کنید اگر زمان هم با اعداد فارسی می‌آید
  // return `${toEnglishDigits(hours)}:${toEnglishDigits(minutes)}`;
  return `${hours}:${minutes}`;
}