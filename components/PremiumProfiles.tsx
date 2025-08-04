'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PremiumProfiles() {
  const [profiles, setProfiles] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/premium-profiles')
      .then(res => res.json())
      .then(setProfiles)
  }, [])

  if (!profiles.length) return <div>پروفایل ویژه‌ای یافت نشد.</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {profiles.map(profile => (
        <Link key={profile.id} href={`/profile/${profile.display_name}`}>
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg shadow p-4 flex flex-col items-center hover:shadow-lg transition">
            <img src={profile.avatar_url} alt={profile.name} className="w-20 h-20 rounded-full mb-2 object-cover border-2 border-yellow-400" />
            <div className="font-bold flex items-center gap-1">
              {profile.name}
              <span title="پریمیوم" className="text-yellow-500">★</span>
            </div>
            <div className="text-xs text-gray-500">{profile.city}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
