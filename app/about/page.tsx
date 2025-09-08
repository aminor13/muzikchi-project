'use client'
import Link from 'next/link'


export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <section className="relative min-h-[420px] overflow-hidden">
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">درباره موزیکچی</h1>
          <p className="text-gray-200 text-lg leading-relaxed">
            موزیکچی از دل یک نیاز واقعی متولد شد. من خودم نوازنده یک بند بودم و برای اجراها دنبال نوازنده می‌گشتیم.
            دیدم بدنیست اگر جایی باشه که موزیسین‌ها بتونن راحت‌ همدیگه رو پیدا کنن. این شد که اینجوری شد. حالا اگر شما هم پیشنهادی جهت بروزرسانی یا گسترش قابلیتهای سایت دارید
            خوشحال میشم از طریق صفحه ارسال نظر برام ارسال کنید.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-10">دو قابلیت اصلی موزیکچی</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-3">جستجو با تمرکز بر موقعیت</h3>
              <p className="text-gray-300 mb-4">
                جستجوی پیشرفته با توجه ویژه به موقعیت جغرافیایی کاربران.
                 نوازنده ای که دنبال گروه میگرده،
                 گروهی که دنبال خوانندست،
                 آموزشگاهی که مربی لازم داره، یا گروهی که میخواد سالن اجرا، استودیو یا جای تمرین پیدا کنه و ... .
                 همه در یک جا.
              </p>
              <ul className="text-gray-400 space-y-2 text-sm list-disc pr-5">
                <li>فیلترهای متنوع</li>
                <li>دسترسی به نمونه کارهای کاربران</li>
                <li>امکان ارتباط با کاربران</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-3">رویدادها و اطلاع‌رسانی اجراها</h3>
              <p className="text-gray-300 mb-4">
               گروه‌ها، آموزشگاه‌ها و سالن‌ها
                می‌توانند اجراها و برنامه‌های خودشان را اطلاع‌رسانی کنند.
                کنسرت ، اجرای خصوصی ، اجرا در مکانهای عمومی (کافه، رستوران و ...)، جشنواره های موسیقی
              </p>
              <ul className="text-gray-400 space-y-2 text-sm list-disc pr-5">
                <li>تقویم اجراهای پیش‌رو</li>
                <li>جزئیات رویداد و موقعیت</li>
                <li>ارتباط مستقیم با برگزارکننده</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/login" className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
              همین حالا شروع کن
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}