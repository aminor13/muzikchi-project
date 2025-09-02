'use client'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import AvatarMosaic from '@/components/AvatarMosaic'
import QuickSearch from '@/components/QuickSearch'
import UpcomingEvents from '@/components/UpcomingEvents'
import MusicianIcon from '@/components/icons/MusicianIcon'
import BandIcon from '@/components/icons/BandIcon'
import TeacherIcon from '@/components/icons/TeacherIcon'
import SchoolIcon from '@/components/icons/SchoolIcon'
import PlaceIcon from '@/components/icons/PlaceIcon'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      const supabase = createClient()
      ;(async () => {
        try {
          await (supabase.auth as any).exchangeCodeForSession(code)
          router.replace('/reset-password')
        } catch (e) {
          console.error('Failed to exchange code on /', e)
        }
      })()
      return
    }
    const checkProfile = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        if (!session.user.email_confirmed_at) {
          router.replace('/verify-email')
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_complete')
          .eq('id', session.user.id)
          .single()
        if (!profile || !profile.is_complete) {
          router.replace('/profile/complete')
        }
      }
    }
    checkProfile()
  }, [])

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[600px] overflow-hidden">
        {/* Background Avatar Mosaic */}
        <AvatarMosaic />
        
        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <div className="mb-8 opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
            <Image
              src="/first_logo.png"
              alt="موزیکچی"
              width={400}
              height={130}
              className="mx-auto"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
            🎵 موزیکچی؛ جایی که صداها همدیگه رو پیدا می‌کنن
          </h1>

          <div className="text-xl text-gray-200 space-y-6 opacity-0 animate-[fadeIn_1s_ease-out_0.2s_forwards]">
            <p>
              اگه دنبال یه موزیسین واسه همکاری می‌گردی، درست اومدی 🎸<br/>
              اگه یه بیزینس موسیقی داری و می‌خوای به موزیسین‌ها وصل بشی، باز هم اینجا جات درسته 🎤<br/>
              و اگه فقط دنبال اینی که ببینی کی و کجا اجرا داره، می‌تونی تو قسمت رویدادها سر بزنی 🎶
            </p>

            <p>
              من خودم یه زمانی تو یه بند بودم. هر بار که می‌خواستیم یه نوازنده جدید پیدا کنیم کلی سختی داشت. یه روز به سرم زد: چرا یه جایی نباشه که موزیسین‌ها راحت همدیگه رو پیدا کنن؟ همین شد که <span className="text-orange-400 font-bold">muzikchi.ir</span> به دنیا اومد.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">چطور کار می‌کند؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">پروفایل بسازید</h3>
              <p className="text-gray-300">مهارت‌ها و تجربیات خود را به اشتراک بگذارید</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">جستجو کنید</h3>
              <p className="text-gray-300">همکاران مناسب خود را در شهر خود پیدا کنید</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ارتباط برقرار کنید</h3>
              <p className="text-gray-300">با دیگر هنرمندان همکاری کنید</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">چه کسانی می‌توانند عضو شوند؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 text-center hover:bg-gray-700 transition">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MusicianIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">نوازندگان</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>ایجاد پروفایل حرفه‌ای</li>
                <li>نمایش سابقه و تجربیات</li>
                <li>معرفی به گروه‌های موسیقی</li>
                <li>یافتن فرصت‌های همکاری</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center hover:bg-gray-700 transition">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <BandIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">گروه‌های موسیقی</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>معرفی اعضای گروه</li>
                <li>جذب نوازنده جدید</li>
                <li>اطلاع‌رسانی کنسرت‌ها</li>
                <li>نمایش رزومه گروه</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center hover:bg-gray-700 transition">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <TeacherIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">مدرسین</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>معرفی دوره‌های آموزشی</li>
                <li>جذب هنرجو</li>
                <li>نمایش سوابق تدریس</li>
                <li>ارتباط با آموزشگاه‌ها</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center hover:bg-gray-700 transition">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <SchoolIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">آموزشگاه‌ها</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>معرفی آموزشگاه</li>
                <li>جذب مدرس</li>
                <li>تبلیغ دوره‌ها</li>
                <li>ارتباط با هنرجویان</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center hover:bg-gray-700 transition">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <PlaceIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">مکان‌های موسیقی</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>معرفی سالن اجرا</li>
                <li>معرفی استودیو ضبط</li>
                <li>اجاره محل تمرین</li>
                <li>رزرو آنلاین</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">رویدادهای پیش رو</h2>
          <UpcomingEvents />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-orange-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">همین حالا به موزیکچی بپیوندید</h2>
          <Link 
            href="/login" 
            className="inline-block bg-white text-orange-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            ثبت‌نام رایگان
          </Link>
        </div>
      </section>
    </main>
  )
}
