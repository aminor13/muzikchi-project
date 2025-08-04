'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import CollaborationRequestButton from './CollaborationRequestButton'

interface Band {
  id: string
  name: string
  display_name: string
  avatar_url?: string
  description?: string
  looking_for_musician: boolean
}

export default function BandSearch({ userId, activeBandIds }: { userId: string, activeBandIds: string[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [bands, setBands] = useState<Band[]>([])
  const [loading, setLoading] = useState(false)
  const [existingRequests, setExistingRequests] = useState<{[key: string]: boolean}>({})
  const supabase = createClient()

  useEffect(() => {
    const fetchBands = async () => {
      if (!searchTerm.trim()) {
        setBands([])
        return
      }

      setLoading(true)
      try {
        // Fetch bands
        const { data: bands, error: bandsError } = await supabase
          .from('profiles')
          .select('id, name, display_name, avatar_url, description, looking_for_musician')
          .eq('category', 'band')
          .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .order('name')

        if (bandsError) throw bandsError
        setBands(bands || [])

        // Fetch requests
        if (bands && bands.length > 0) {
          const { data: requests, error: requestsError } = await supabase
            .from('band_members')
            .select('band_id, status')
            .eq('member_id', userId)
            .in('band_id', bands.map(b => b.id))
            .order('created_at', { ascending: false })

          if (requestsError) {
            console.error('Error fetching requests:', requestsError)
          } else {
            const requestMap: {[key: string]: boolean} = {}
            // Group by band_id and take the most recent status for each band
            const latestRequests = requests?.reduce((acc: any[], req: any) => {
              if (!acc.find(r => r.band_id === req.band_id)) {
                acc.push(req)
              }
              return acc
            }, []) || []
            
            latestRequests.forEach(req => {
              requestMap[req.band_id] = req.status === 'requested'
            })
            setExistingRequests(requestMap)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchBands, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, userId])

  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="نام یا نام کاربری گروه مورد نظر را وارد کنید..."
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
        />
        {loading && (
          <div className="absolute left-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {bands.map(band => (
          <div key={band.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                {band.avatar_url ? (
                  <Image
                    src={band.avatar_url}
                    alt={band.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🎵
                  </div>
                )}
              </div>
              <div>
                <Link href={`/profile/${band.display_name}`} className="text-lg font-semibold text-white hover:text-orange-500 transition-colors">
                  {band.name}
                </Link>
                <div className="text-gray-400 text-sm">@{band.display_name}</div>
                {band.description && (
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{band.description}</p>
                )}
              </div>
            </div>
            <CollaborationRequestButton
              bandId={band.id}
              userId={userId}
              hasActiveRequest={existingRequests[band.id] || false}
              isActiveMember={activeBandIds.includes(band.id)}
            />
          </div>
        ))}

        {!loading && searchTerm.trim() && bands.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            گروهی با این نام یا نام کاربری یافت نشد
          </div>
        )}

        {/* {!searchTerm.trim() && (
          <div className="text-center text-gray-400 py-8">
            برای جستجوی گروه‌های موسیقی، نام یا نام کاربری گروه مورد نظر را وارد کنید
          </div>
        )} */}
      </div>
    </div>
  )
} 