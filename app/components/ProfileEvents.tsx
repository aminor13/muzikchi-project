'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatTimeToPersian } from '@/app/utils/dateUtils'

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  poster_url: string | null;
}

interface ProfileEventsProps {
  events: Event[];
}

export default function ProfileEvents({ events }: ProfileEventsProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4 text-orange-500">رویدادهای پیش رو</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {events.map((event) => (
          <Link 
            key={event.id} 
            href={`/events/${event.id}`}
            className="block group"
          >
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-700">
              {event.poster_url ? (
                <Image
                  src={event.poster_url}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  🎵
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold mb-1 line-clamp-1">{event.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    {new Date(event.date).toLocaleDateString('fa-IR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>⏰</span>
                    {formatTimeToPersian(event.time)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 