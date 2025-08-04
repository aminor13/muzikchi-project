import { createClient } from '@/utils/supabase/server'
import { formatTimeToPersian } from '@/app/utils/dateUtils'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeleteEventButton from './DeleteEventButton'

export default async function MyEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's display_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', profile.display_name)
    .order('date', { ascending: false })

  // تقسیم رویدادها به آینده و گذشته
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = events?.filter(event => new Date(event.date) >= today) || []
  const pastEvents = events?.filter(event => new Date(event.date) < today) || []

  const EventCard = ({ event }: { event: any }) => (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="relative aspect-[16/9]">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-contain bg-gray-800"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h2 className="font-bold text-xl text-gray-100">{event.title}</h2>
          <div className={`px-3 py-1 rounded-full text-sm ${
            event.status === 'approved' ? 'bg-green-900 text-green-100' :
            event.status === 'rejected' ? 'bg-red-900 text-red-100' :
            'bg-yellow-900 text-yellow-100'
          }`}>
            {event.status === 'approved' ? 'تایید شده' :
             event.status === 'rejected' ? 'رد شده' :
             'در انتظار تایید'}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-300 mb-4">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{new Date(event.date).toLocaleDateString('fa-IR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏰</span>
            <span>{formatTimeToPersian(event.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span className="truncate">{event.venue}</span>
          </div>
          {event.province && event.city && (
            <div className="flex items-center gap-2">
              <span>🗺️</span>
              <span className="truncate">{event.province} - {event.city}</span>
            </div>
          )}
        </div>

        {event.status === 'rejected' && event.admin_note && (
          <div className="mt-2 p-2 bg-red-900/50 text-red-100 rounded-md text-sm">
            <strong>دلیل رد:</strong> {event.admin_note}
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href={`/events/${event.id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            مشاهده
          </Link>
          <Link
            href={`/events/edit-event/${event.id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-100 rounded-md hover:bg-gray-600 transition-colors"
          >
            ویرایش
          </Link>
          <DeleteEventButton eventId={event.id} posterUrl={event.poster_url} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">رویدادهای من</h1>
          <Link
            href="/events/create-event"
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            ایجاد رویداد جدید
          </Link>
        </div>

        {events?.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg shadow">
            <p className="text-gray-300 mb-4">هنوز رویدادی ایجاد نکرده‌اید</p>
            {/* <Link
              href="/events/create-event"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              ایجاد اولین رویداد
            </Link> */}
          </div>
        ) : (
          <div className="space-y-12">
            {/* رویدادهای آینده */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">رویدادهای پیش رو</h2>
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-300">رویداد پیش رویی ندارید</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* رویدادهای گذشته */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">رویدادهای گذشته</h2>
              {pastEvents.length === 0 ? (
                <p className="text-gray-300">رویداد گذشته‌ای ندارید</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
} 