'use client'
import Link from 'next/link'


export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <section className="relative min-h-[420px] overflow-hidden">
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">درباره موزیکچی</h1>
          <p className="text-gray-200 text-lg leading-relaxed">
          موزیکچی یک شبکه اجتماعی و پلتفرم ارتباطیه که
           امکان برقراری ارتباط بین فعالان موسیقی رو برقرار میکنه. از نوازندگان و خوانندگان
           گرفته تا ترانه‌سراها، آهنگسازان، مربیان موسیقی، سالن‌های اجرا و فضاهای تمرین و .... <br/>
          قابلیت جستجوی پیشرفته در
           موزیکچی به شما امکان می‌دهد تا با فیلترهای دقیق، فرد یا گروه مورد نظر خود را در
           هر ژانر و هر منطقه ای از کشور پیدا کنید. برای مثال چه به دنبال یک نوازنده فلوت در
           زاهدان باشید
            یا یک گروه موسیقی در خوزستان، موزیکچی این جستجو را برای شما ساده و سریع می‌کند.<br/>
            شما همچنین به عنوان کاربر موزیکچی میتونید به صورت
             رایگان درباره اجرا یا رویدادی که قراره برگزار کنید، اطلاع رسانی عمومی انجام بدید.
          هدف ما در موزیکچی اینه که به رشد جامعه موسیقی کمک کنیم
           و ارتباطات رو برای همه فعالان در این عرصه، آسون‌تر کنیم. 
          از اونجایی که موزیکچی توسط تیمی از موزیسین ها ایجاد
           شده، مطمئن باشید که ما تمام تلاشمون رو برای شناسایی نیازها و پس
           از اون، کمک به رفع اونها انجام می‌دیم. در حال حاضر تمرکز خدمات موزیکچی روی دو
           تا موضوعه ولی اگر پیشنهادی برای بروزرسانی یا بهبود سایت دارید، لطفاً به ما
           اطلاع بدید. ما برای نظرات شما ارزش قائلیم و مشتاقانه منتظر همه پیشنهادات شما هستیم.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-10">خدمات موزیکچی</h2>

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