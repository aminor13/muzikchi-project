'use client'
import { useEffect, useState } from 'react'
import { formatTimeToPersian } from '@/app/utils/dateUtils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/upcoming-events')
      .then(res => res.json())
      .then(data => {
        setEvents(data)
        setLoading(false)
      })
      .catch(err => {
        setError('خطا در دریافت رویدادها')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (events.length === 0) return
    
    // تغییر خودکار هر 6 ثانیه
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [events.length])

  if (loading) return <div className="text-gray-100 text-center py-4">در حال بارگذاری...</div>
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>
  if (!events.length) return <div className="text-gray-100 text-center py-4">رویدادی ثبت نشده است.</div>

  return (
    <>
      <div className="relative h-[400px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className="bg-gray-800 rounded-lg overflow-hidden h-full flex flex-col justify-end">
              <Link href={`/events/${events[currentIndex].id}`}>
                <div className="relative pb-[50%]">
                  {events[currentIndex].image_url ? (
                    <img
                      src={events[currentIndex].image_url}
                      alt={events[currentIndex].title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <span className="text-4xl">🎵</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col items-center justify-center bg-gray-800 rounded-b-lg">
                  <div className="mb-3 text-orange-500 font-bold text-lg text-center">
                    {events[currentIndex].organizer_real_name}
                  </div>
                  <h3 className="font-bold text-xl text-gray-100 mb-3 text-center">{events[currentIndex].title}</h3>
                  <div className="text-sm text-gray-100 space-y-2 text-center">
                    <div className="flex flex-wrap items-center gap-2 justify-center">
                      <span>📅 {events[currentIndex].date}</span>
                      <span className="mx-1">|</span>
                      <span>⏰ {formatTimeToPersian(events[currentIndex].time)}</span>
                      <span className="mx-1">|</span>
                      <span>📍 {events[currentIndex].location}</span>
                    </div>
                  </div>
                  {/* نشانگر تعداد */}
                  <div className="flex justify-center mt-4 mb-2">
                    {events.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={e => {
                          e.preventDefault();
                          setCurrentIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition-all mx-1 ${
                          idx === currentIndex ? 'bg-orange-500 w-4' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Link>
              {/* دکمه مشاهده همه رویدادها */}
              <Link
                href="/events"
                className="mx-auto bg-gradient-to-l from-gray-900 to-gray-700 font-bold text-base text-white px-6 py-2 rounded-full hover:bg-orange-500 transition-colors max-w-xs flex items-center justify-center mt-2"
              >
                همه رویدادها
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
