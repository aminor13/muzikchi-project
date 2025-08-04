import React from 'react'
import { Profile } from '@/types/profile'

interface ContactInfoProps {
  profile: Profile
}

export default function ContactInfo({ profile }: ContactInfoProps) {
  return (
    <div className="space-y-4">
      {profile.phone && (
        <div>
          <h3 className="text-sm font-medium text-gray-500">شماره تماس</h3>
          <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
        </div>
      )}

      {profile.instagram && (
        <div>
          <h3 className="text-sm font-medium text-gray-500">اینستاگرام</h3>
          <a
            href={`https://instagram.com/${profile.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-sm text-blue-600 hover:text-blue-500"
          >
            @{profile.instagram}
          </a>
        </div>
      )}

      {profile.address && (
        <div>
          <h3 className="text-sm font-medium text-gray-500">آدرس</h3>
          <p className="mt-1 text-sm text-gray-900">{profile.address}</p>
        </div>
      )}
    </div>
  )
} 