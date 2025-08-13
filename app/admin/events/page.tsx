'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatTimeToPersian } from '@/app/utils/dateUtils'
import { redirect, useRouter } from 'next/navigation'
import AdminEventActions from './AdminEventActions'

const TABS = [
  { key: 'pending', label: 'در انتظار تایید' },
  { key: 'approved', label: 'تایید شده' },
  { key: 'rejected', label: 'رد شده' },
]

export default function AdminEventsPage() {
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const router = useRouter()
  const supabase = createClient()

  const fetchAllEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      redirect('/')
    }

    // Get all events
    const { data: events } = await supabase
      .from('events')
      .select(`
        *,
        profiles (
          display_name,
          name
        )
      `)
      .order('created_at', { ascending: false })

      //console.log('Fetched events:', events?.map((e: any) => ({ id: e.id, title: e.title })))
    setAllEvents(events || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAllEvents()

    // Set up realtime subscription
    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'events',
        }, 
        () => {
          fetchAllEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleEventUpdate = () => {
    fetchAllEvents()
  }

  const filteredEvents = allEvents.filter(event => event.status === activeTab)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">در حال بارگذاری...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">مدیریت رویدادها</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex gap-2 mb-6">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-md font-semibold transition-colors text-sm ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {!filteredEvents.length ? (
              <p className="text-gray-600">رویدادی برای نمایش وجود ندارد.</p>
            ) : (
              <div className="space-y-6">
                {filteredEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">
                          ثبت شده توسط: {event.profiles.display_name} ({event.profiles.name})
                        </p>
                      </div>
                      {activeTab === 'pending' && (
                        <AdminEventActions eventId={event.id} onUpdate={handleEventUpdate} />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>📅</span>
                          <span>{new Date(event.date).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>⏰</span>
                          <span>{formatTimeToPersian(event.time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>📍</span>
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      {event.poster_url && (
                        <div className="relative aspect-[16/9]">
                          <img
                            src={event.poster_url}
                            alt={event.title}
                            className="absolute inset-0 w-full h-full object-contain bg-gray-100 rounded"
                          />
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <div className="text-gray-600 text-sm">
                        <strong className="block mb-1">توضیحات:</strong>
                        <p className="whitespace-pre-wrap">{event.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 