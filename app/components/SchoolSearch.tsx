'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

interface SchoolSearchProps {
  userId: string
  activeSchoolIds: string[]
}

interface School {
  id: string
  display_name: string
  name?: string
  avatar_url?: string
  description?: string
}

export default function SchoolSearch({ userId, activeSchoolIds }: SchoolSearchProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [requestLoading, setRequestLoading] = useState<{ [key: string]: boolean }>({})
  const supabase = createClient()

  const searchSchools = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, name, avatar_url, description')
      .eq('category', 'place')
      .contains('roles', ['school'])
      .or(`display_name.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(5)

    if (error) {
      console.error('Error searching schools:', error)
      alert('خطا در جستجوی آموزشگاه‌ها')
    } else {
      setSearchResults(data || [])
    }
    setLoading(false)
  }

  const handleRequest = async (schoolId: string) => {
    try {
      setRequestLoading(prev => ({ ...prev, [schoolId]: true }))

      // Check if there's an existing request
      const { data: existingRequest } = await supabase
        .from('school_teachers')
        .select('status')
        .eq('school_id', schoolId)
        .eq('teacher_id', userId)
        .maybeSingle()

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          alert('شما قبلاً دعوت‌نامه‌ای از این آموزشگاه دریافت کرده‌اید')
          return
        }
        if (existingRequest.status === 'requested') {
          alert('شما قبلاً به این آموزشگاه درخواست همکاری ارسال کرده‌اید')
          return
        }
        if (existingRequest.status === 'accepted') {
          alert('شما در حال حاضر با این آموزشگاه همکاری می‌کنید')
          return
        }
        if (existingRequest.status === 'rejected') {
          const { data: rejectedRequest } = await supabase
            .from('school_teachers')
            .select('rejected_by')
            .eq('school_id', schoolId)
            .eq('teacher_id', userId)
            .single()

          if (rejectedRequest?.rejected_by === userId) {
            alert('شما قبلاً این درخواست را رد کرده‌اید. می‌توانید از بخش درخواست‌های رد شده آن را مجدداً بررسی کنید')
          } else {
            alert('این آموزشگاه قبلاً درخواست همکاری شما را رد کرده است')
          }
          return
        }
      }

      // Send the request
      const { error } = await supabase
        .from('school_teachers')
        .insert([
          {
            school_id: schoolId,
            teacher_id: userId,
            status: 'requested',
            role: 'teacher'
          }
        ])

      if (error) throw error

      alert('درخواست همکاری با موفقیت ارسال شد')
      setQuery('')
      setSearchResults([])
    } catch (error: any) {
      console.error('Error sending request:', error)
      alert(error.message || 'خطا در ارسال درخواست')
    } finally {
      setRequestLoading(prev => ({ ...prev, [schoolId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            searchSchools(e.target.value)
          }}
          placeholder="نام آموزشگاه را جستجو کنید..."
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {loading && (
          <div className="absolute left-3 top-2">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((school) => (
            <div key={school.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {school.avatar_url ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={school.avatar_url}
                      alt={school.name || school.display_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏫</span>
                  </div>
                )}
                <div>
                  <Link
                    href={`/profile/${school.display_name}`}
                    className="text-lg font-semibold text-white hover:text-orange-500 transition-colors"
                  >
                    {school.name || school.display_name}
                  </Link>
                  {school.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{school.description}</p>
                  )}
                </div>
              </div>

              {!activeSchoolIds.includes(school.id) && (
                <button
                  onClick={() => handleRequest(school.id)}
                  disabled={requestLoading[school.id]}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {requestLoading[school.id] ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      <span>درخواست همکاری</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 