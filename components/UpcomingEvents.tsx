'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { formatTimeToPersian, formatDateForDisplay  } from '@/app/utils/dateUtils'


interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image_url: string;
  organizer_real_name: string;
  province?: string;
  city?: string;
}

// تعداد آیتم‌هایی که همزمان نمایش داده می‌شوند
const ITEMS_PER_SLIDE = 3;

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [currentIndex, setCurrentIndex] = useState(0) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/upcoming-events')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        
        setEvents(data)
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('خطا در دریافت رویدادها')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    if (events.length === 0) return
    
    const maxSlides = Math.ceil(events.length / ITEMS_PER_SLIDE);

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % maxSlides)
    }, 6000)

    return () => clearInterval(timer)
  }, [events.length])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
        <div className="mt-2 text-lg text-orange-500">در حال بارگذاری رویدادها...</div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{error}</div>
  }

  if (!events.length) {
    return (
      <div className="flex justify-center py-12">
        <img
          src="/no-event.jpg"
          alt="No events"
          className="w-72 h-72 object-contain rounded-xl opacity-70"
        />
      </div>
    )
  }

  const startIndex = currentIndex * ITEMS_PER_SLIDE;
  const currentEvents = events.slice(startIndex, startIndex + ITEMS_PER_SLIDE);

  const maxSlides = Math.ceil(events.length / ITEMS_PER_SLIDE);
  
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4"> 
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* تغییر: اضافه شدن فاصله (gap-6) و padding داخلی (p-6) */}
              <div className="grid grid-cols-1 md:grid-cols-3 **gap-6 p-6**">
                {currentEvents.map((currentEvent) => (
                  // تغییر: استایل‌دهی کارت مجزا و حذف کلاس‌های border
                  <div key={currentEvent.id} className="**bg-gray-900 rounded-lg shadow-xl overflow-hidden**">
                    <Link href={`/events/${currentEvent.id}`} className="block">
                      {/* نسبت ابعاد 4:5 */}
                      <div className="relative w-full" style={{ aspectRatio: '4/5' }}> 
                        {currentEvent.image_url ? (
                          <img
                            src={currentEvent.image_url}
                            alt={currentEvent.title}
                            className="absolute inset-0 w-full h-full object-contain bg-gray-900 rounded-t-lg"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center rounded-t-lg">
                            <span className="text-6xl">🎵</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Event Information */}
                    {/* تغییر: حذف bg-gray-900 و border-t */}
                    <div className="p-4 text-white"> 
                      <div className="max-w-3xl">
                        <div className="mb-2 text-orange-500 font-bold text-lg">
                          {currentEvent.organizer_real_name}
                        </div>
                        <h3 className="font-bold text-xl mb-3 truncate">
                          {currentEvent.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📅</span>
                            <span>{formatDateForDisplay(currentEvent.date)}</span> 
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            <span>{formatTimeToPersian(currentEvent.time)}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📍</span>
                            <span className="truncate">{currentEvent.location}</span>
                          </span>
                          {currentEvent.province && currentEvent.city && (
                            <span className="flex items-center gap-2">
                              <span className="text-lg">🗺️</span>
                              <span>{currentEvent.province} - {currentEvent.city}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="p-4 bg-gray-800">
                <div className="flex justify-center mb-4">
                  {[...Array(maxSlides)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all mx-1 ${
                        idx === currentIndex ? 'bg-orange-500 w-4' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <Link
                  href="/events"
                  className="block w-full max-w-xs mx-auto bg-gradient-to-l from-gray-900 to-gray-700 font-bold text-base text-white px-6 py-2 rounded-full hover:bg-orange-500 transition-colors text-center"
                >
                  همه رویدادها
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}