'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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

export default function FeaturedProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/featured-profiles')
      .then(res => res.json())
      .then(data => {
        
        setProfiles(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching featured profiles:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
        <div className="mt-2 text-lg text-orange-500">در حال بارگذاری پربازدیدها...</div>
      </div>
    )
  }

  if (!profiles.length) {
    return (
      <div className="text-center py-12 text-gray-300">پروفایل پربازدیدی یافت نشد.</div>
    )
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {profiles.map(profile => (
            <Link
              key={profile.id}
              href={`/profile/${profile.display_name}`}
              className="block"
            >
              <div className="bg-gray-800 rounded-xl flex flex-col items-center hover:shadow-lg transition border border-gray-700 cursor-pointer hover:border-orange-500">
                <div className="w-full relative" style={{ paddingBottom: '100%' }}>
                  <img
                    src={profile.avatar_url || '/default-avatar.png'}
                    alt={profile.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-xl"
                  />
                </div>
                <div className="p-4 w-full text-center">
                  <div className="font-bold text-lg text-white mb-2">{profile.name}</div>
                  <div className="text-sm text-orange-500 mb-2">
                    {profile.category === 'band' ? (
                      <span>گروه موسیقی</span>
                    ) : (
                      Array.isArray(profile.roles) && profile.roles.length > 0
                        ? profile.roles.map((role: string, idx: number) => {
                            const r = allRoles.find((ar: any) => ar.value === role);
                            return r ? (
                              <span key={role}>{r.label}{idx < profile.roles.length - 1 ? ' / ' : ''}</span>
                            ) : null;
                          })
                        : null
                    )}
                  </div>
                  {(profile.city || profile.province) && (
                    <div className="text-sm text-gray-400">
                      <span className="flex items-center justify-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profile.city && profile.province 
                          ? `${profile.city}، ${profile.province}`
                          : profile.city || profile.province}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
} 