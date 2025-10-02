import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { formatTimeToPersian } from '@/app/utils/dateUtils'
import Link from 'next/link'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  
  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', resolvedParams.id)
    .single()

  return {
    title: event?.title || 'رویداد',
    description: 'جزئیات رویداد'
  }
}

export default async function EventPage({ params }: Props) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, profiles(display_name, name)')
    .eq('id', resolvedParams.id)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* تغییر اصلی: افزودن flex-col و md:flex-row به کانتینر اصلی 
          تا در موبایل عمودی و در دسکتاپ افقی شوند.
        */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
          
          {/* بخش پوستر */}
          {event.poster_url && (
            /* تنظیم عرض نصف در دسکتاپ (md:w-1/2). 
              استفاده از object-contain برای جلوگیری از کراپ شدن تصویر عمودی یا مربعی.
            */
            <div className="md:w-1/2 w-full p-4 md:p-8 flex items-center justify-center bg-gray-900 border-b md:border-b-0 md:border-l border-gray-700">
              <div className="max-w-full max-h-[70vh] flex items-center justify-center">
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>
          )}

          {/* بخش جزئیات */}
          {/* تنظیم عرض نصف در دسکتاپ در صورت وجود پوستر.
            اگر پوستر نباشد، عرض کامل (w-full) را می‌گیرد.
          */}
          <div className={`p-8 ${event.poster_url ? 'md:w-1/2' : 'w-full'}`}>
            {/* عنوان و اطلاعات اصلی */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-100 mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-4 text-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <span>{new Date(event.date).toLocaleDateString('fa-IR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⏰</span>
                  <span>{formatTimeToPersian(event.time)}</span>
                </div>
              </div>
            </div>

            {/* اطلاعات مکان و برگزارکننده */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-100">
                  <span className="text-xl">📍</span>
                  <span>{event.venue}</span>
                </div>
                {event.province && event.city && (
                  <div className="flex items-center gap-3 text-gray-100">
                    <span className="text-xl">🗺️</span>
                    <span>{event.province} - {event.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-100">
                  <span className="text-xl">👤</span>
                  <span>اجرا توسط: {' '}
                    <Link href={`/profile/${event.profiles.display_name}`} className="text-orange-500 hover:text-orange-700">
                      {event.profiles.display_name}
                    </Link>
                    {' '}
                    (
                    <Link href={`/profile/${event.profiles.display_name}`} className="text-gray-100 hover:text-gray-200">
                      {event.profiles.name}
                    </Link>
                    )
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {event.capacity && (
                  <div className="flex items-center gap-3 text-gray-100">
                    <span className="text-xl">👥</span>
                    <span>ظرفیت: {event.capacity.toLocaleString()} نفر</span>
                  </div>
                )}
                {event.ticket_price && (
                  <div className="flex items-center gap-3 text-gray-100">
                    <span className="text-xl">🎫</span>
                    <span>قیمت بلیت: {event.ticket_price.toLocaleString()} تومان</span>
                  </div>
                )}
              </div>
            </div>

            {/* توضیحات */}
            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-100 mb-4">توضیحات رویداد</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="whitespace-pre-wrap text-gray-100">{event.description}</p>
                </div>
              </div>
            )}

            {/* دکمه خرید بلیت */}
            {event.ticket_link && (
              <div className="mt-8">
                <Link
                  href={event.ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <span className="ml-2">🎟️</span>
                  خرید بلیت
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}