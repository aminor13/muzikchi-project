
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-4 text-center text-sm">
      {/* Use flexbox to center items vertically */}
      <span className="inline-flex items-center justify-center">
        <span>
          این سایت یه پروژه‌ی شخصیه و پشتش هیچ شرکت یا اسپانسری نیست. کپی رایت نداره و همه امکاناتش کاملا رایگانه.{'  '}
        </span>
        {/* Wrap the image in an anchor tag for the link */}
        <a href="https://www.instagram.com/muzikchi.official/" className="ml-2">
          <img src="/instagram.png" alt="instagram logo" width={30} height={30} />
        </a>
      </span>
    </footer>
  );
}