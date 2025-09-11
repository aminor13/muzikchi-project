
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 pb-24 pt-6 md:py-6 text-center text-sm">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/muzikchi-logo-footer.jpg"
          alt="لوگوی موزیکچی"
          width={300}
          height={100}
          priority
        />
        <nav className="mt-4 flex flex-col items-center space-y-2 text-base">
          <Link href="/explore" className="hover:text-orange-400">اکسپلور</Link>
          <Link href="/events" className="hover:text-orange-400">رویدادها</Link>
          <Link href="/blog" className="hover:text-orange-400">بلاگ</Link>
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

        <p className="mt-6 text-xs text-gray-400">
          این سایت یه پروژه‌ی شخصیه و پشتش هیچ شرکت یا اسپانسری نیست. کپی رایت نداره و همه امکاناتش کاملا رایگانه.
        </p>
      </div>
    </footer>
  );
}