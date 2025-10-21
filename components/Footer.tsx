
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 text-center text-sm">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/muzikchi-logo-footer.jpg"
          alt="لوگوی موزیکچی"
          width={240}
          height={80}
          priority
        />
        <div className="mt-4 text-center md:text-center">
             <p className="text-lg mt-2 text-orange-400 ">
              جستجو کن، پیدا کن، وصل شو.
            </p>
            <p className="text-sm mb-10">
              موزیکچی پلتفرمیست برای جستجوی نوازنده، خواننده، آهنگساز، تنظیم کننده، ترانه سرا، مدرس، آموزشگاه موسیقی، استودیو، فضای تمرین، محل اجرا و ...
              همچنین محلیست برای اعلام عمومی اجرا، کارگاه، ایونت و یا کنسرت.
            </p>
            
          </div>
          <nav className="flex flex-col items-center md:flex-row md:space-y-0 text-base">
            <Link href="/explore" className="hover:text-orange-400">اکسپلور</Link>
            <span className="hidden md:inline mx-2 text-gray-500">|</span>
            <Link href="/events" className="hover:text-orange-400">رویدادها</Link>
            <span className="hidden md:inline mx-2 text-gray-500">|</span>
            <Link href="/blog" className="hover:text-orange-400">بلاگ</Link>
            <span className="hidden md:inline mx-2 text-gray-500">|</span>
            <Link href="/about" className="hover:text-orange-400">درباره موزیکچی</Link>
          </nav>

        <div className="w-full max-w-5xl mt-8 border-t border-gray-700" />

        <div className="mt-6 flex items-center justify-center gap-8">
          
          <a href="https://t.me/muzikchi_ir" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <img src="/icons/telegram_icon.png" alt="Telegram" width={28} height={28} />
          </a>
          <a href="https://x.com/Muzikchi_ir" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X">
            <img src="/icons/twitter_x_icon.png" alt="Twitter/X" width={28} height={28} />
          </a>
          <a href="https://www.instagram.com/muzikchi.official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <img src="/icons/instagram_icon.png" alt="Instagram" width={32} height={32} />
          </a>
        </div>
         
         <a
            referrerPolicy="origin"
            target="_blank"
            href="https://trustseal.enamad.ir/?id=662749&Code=zX1qh2fAZZ8WYVs3kLc4RNeDXnAvbn5v"
            className="mt-6 inline-block transition-transform hover:scale-105"
            aria-label="نماد اعتماد الکترونیکی"
          >
          <img
            referrerPolicy="origin"
            src="https://trustseal.enamad.ir/logo.aspx?id=662749&Code=zX1qh2fAZZ8WYVs3kLc4RNeDXnAvbn5v"
            alt="نماد اعتماد الکترونیکی"
            width={90}
            height={90}
            className="rounded-lg shadow-md"
            style={{ cursor: 'pointer' }}
           />
          </a>

        <p className="mt-6 text-xs text-gray-400">
          این سایت یه پروژه‌ی شخصیه و پشتش هیچ شرکت یا اسپانسری نیست. کپی رایت نداره و همه امکاناتش کاملا رایگانه.
        </p>
      </div>
    </footer>
  );
}