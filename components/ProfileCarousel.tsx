'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import roleData from '@/data/category_role.json'

// نقش‌ها (flat)
const allRoles = roleData.flatMap((cat: any) => cat.roles).filter(Boolean);

interface Profile {
  id: string;
  name: string;
  display_name: string;
  avatar_url: string;
  views: number;
  category: string;
  roles: string[];
  city: string | null;
  province: string | null;
}

interface ProfileCarouselProps {
  title: string;
  apiEndpoint: string;
  emptyMessage: string;
}

export default function ProfileCarousel({ title, apiEndpoint, emptyMessage }: ProfileCarouselProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch(apiEndpoint)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setProfiles(data)
      } catch (err) {
        console.error('Error fetching profiles:', err)
        setError('خطا در دریافت پروفایل‌ها')
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [apiEndpoint])

  useEffect(() => {
    if (profiles.length === 0) return
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % profiles.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [profiles.length])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 h-96 flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
        <div className="mt-2 text-sm text-orange-500">در حال بارگذاری...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    )
  }

  if (!profiles.length) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-300">{emptyMessage}</div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white text-center">{title}</h3>
      </div>

      {/* Profile Display */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 p-4 flex flex-col items-center justify-center"
          >
            <Link
              href={`/profile/${currentProfile.display_name}`}
              className="block text-center hover:scale-105 transition-transform"
            >
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <img
                  src={currentProfile.avatar_url || '/default-avatar.png'}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover rounded-full border-2 border-orange-500"
                />
              </div>

              {/* Name */}
              <div className="font-bold text-lg text-white mb-2">
                {currentProfile.name}
              </div>

              {/* Role/Category */}
              <div className="text-sm text-orange-500 mb-2">
                {currentProfile.category === 'band' ? (
                  <span>گروه موسیقی</span>
                ) : (
                  Array.isArray(currentProfile.roles) && currentProfile.roles.length > 0
                    ? currentProfile.roles.slice(0, 2).map((role: string, idx: number) => {
                        const r = allRoles.find((ar: any) => ar.value === role);
                        return r ? (
                          <span key={role}>{r.label}{idx < Math.min(currentProfile.roles.length, 2) - 1 ? ' / ' : ''}</span>
                        ) : null;
                      })
                    : null
                )}
              </div>

              {/* Location */}
              {(currentProfile.city || currentProfile.province) && (
                <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {currentProfile.city && currentProfile.province 
                    ? `${currentProfile.city}، ${currentProfile.province}`
                    : currentProfile.city || currentProfile.province}
                </div>
              )}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex justify-center mb-3">
          {profiles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all mx-1 ${
                idx === currentIndex ? 'bg-orange-500 w-3' : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
        <div className="text-center text-xs text-gray-400">
          {currentIndex + 1} از {profiles.length}
        </div>
      </div>
    </div>
  )
}
