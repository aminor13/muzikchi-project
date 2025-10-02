"use client";
import { useState, useEffect } from 'react'
import provinceCityData from '@/data/province_city.json'
import { formatTimeToPersian } from '@/app/utils/dateUtils'
import Link from 'next/link'

function useJalaliDate(date: string) {
  const [jalali, setJalali] = useState<string>('...')
  useEffect(() => {
    if (date) {
      setJalali(new Date(date).toLocaleDateString('fa-IR'))
    }
  }, [date])
  return jalali
}

// کامپوننت جدید برای نمایش تاریخ جلالی
function JalaliDateDisplay({ date }: { date: string }) {
  const jalali = useJalaliDate(date);
  return <span>{jalali}</span>;
}

export default function EventsPageClient({ events }: { events: any[] }) {
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')

  const filteredEvents = events.filter(event => {
    if (province && event.province !== province) return false
    if (city && event.city !== city) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-100 mb-8">رویدادهای پیش رو</h1>
        {/* فیلتر استان و شهر */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-100 mb-1">استان</label>
            <select
              id="province"
              value={province}
              onChange={e => { setProvince(e.target.value); setCity('') }}
              className="block w-48 bg-gray-800 text-gray-100 rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">همه استان‌ها</option>
              {provinceCityData.map((p: any) => (
                <option key={p["province-fa"]} value={p["province-fa"]}>{p["province-fa"]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-100 mb-1">شهر</label>
            <select
              id="city"
              value={city}
              onChange={e => setCity(e.target.value)}
              disabled={!province}
              className="block w-48 bg-gray-800 text-gray-100 rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">همه شهرها</option>
              {provinceCityData.find((p: any) => p["province-fa"] === province)?.cities.map((c: any) => (
                <option key={c["city-fa"]} value={c["city-fa"]}>{c["city-fa"]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            return (
              <div key={event.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* تغییر: نسبت ابعاد از 16/9 به 4/5 تغییر کرد */}
                <div className="relative aspect-[4/5]"> 
                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-contain bg-gray-800"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">🎵</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 ">
                  <div className="mb-2 text-center">
                    <span className="text-orange-500 font-bold ">
                      {event.profiles.display_name} ({event.profiles.name})
                    </span>
                  </div>
                  <h2 className="font-bold text-xl text-gray-100 mb-3 text-center">{event.title}</h2>
                  
                  <div className="space-y-2 text-sm text-gray-100 mb-4">
                    <div className="flex items-center gap-2 justify-center">
                      <span>📅</span>
                      <JalaliDateDisplay date={event.date} />
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <span>⏰</span>
                      <span>{formatTimeToPersian(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <span>📍</span>
                      <span className="truncate">{event.venue}</span>
                    </div>
                    {event.province && event.city && (
                      <div className="flex items-center gap-2 justify-center">
                        <span>🗺️</span>
                        <span className="truncate">{event.province} - {event.city}</span>
                      </div>
                    )}
                  </div>
  
                  <Link
                    href={`/events/${event.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-100 bg-gray-800 text-gray-100 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    مشاهده جزئیات
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 