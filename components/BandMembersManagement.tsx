'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Database } from '@/types/supabase'
import categoryRoles from '@/data/category_role.json'

type Profile = Database['public']['Tables']['profiles']['Row']
type BandMember = {
  id: string
  band_id: string
  member_id: string
  status: 'accepted' | 'rejected' | 'pending' | 'requested'
  role: string
  rejected_by: string | null
  musician: {
    id: string
    display_name: string
    name: string | null
    avatar_url: string | null
    roles: string[]
  }
}

type SearchProfile = Pick<Profile, 'id' | 'display_name' | 'name' | 'avatar_url'> & {
  roles: string[]
}

export default function BandMembersManagement({ bandId }: { bandId: string }) {
  const [members, setMembers] = useState<BandMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<BandMember[]>([])
  const [receivedRequests, setReceivedRequests] = useState<BandMember[]>([])
  const [rejectedRequests, setRejectedRequests] = useState<BandMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Search for musicians
  const searchMusicians = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, name, avatar_url, roles')
        .neq('category', 'band')
        .eq('ready_for_cooperate', true)
        .or('roles.cs.{musician},roles.cs.{vocalist}')
        .or(`display_name.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(5)

      if (error) {
        console.error('Error searching musicians:', error)
        return
      }

      const filteredData = (data || []).filter((profile: SearchProfile) =>
        profile && 
        profile.display_name && 
        (profile.display_name.toLowerCase().includes(query.toLowerCase()) ||
        (profile.name && profile.name.toLowerCase().includes(query.toLowerCase()))) &&
        profile.roles && 
        (profile.roles.includes('musician') || profile.roles.includes('vocalist'))
      )

      setSearchResults(filteredData)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      searchMusicians(value)
    }, 300)
  }

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [])

  // Fetch current members, pending invites, and received requests
  useEffect(() => {
    fetchMembers()
    fetchPendingInvites()
    fetchReceivedRequests()
    fetchRejectedRequests()
  }, [bandId])

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('band_members')
      .select(`
        id,
        band_id,
        member_id,
        status,
        role,
        rejected_by,
        musician:profiles!member_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('band_id', bandId)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching members:', error)
      return
    }

    setMembers(data as unknown as BandMember[])
  }

  const fetchPendingInvites = async () => {
    const { data, error } = await supabase
      .from('band_members')
      .select(`
        id,
        band_id,
        member_id,
        status,
        role,
        rejected_by,
        musician:profiles!member_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('band_id', bandId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error fetching pending invites:', error)
      return
    }

    setPendingInvites(data as unknown as BandMember[])
  }

  const fetchReceivedRequests = async () => {
    const { data, error } = await supabase
      .from('band_members')
      .select(`
        id,
        band_id,
        member_id,
        status,
        role,
        rejected_by,
        musician:profiles!member_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('band_id', bandId)
      .eq('status', 'requested')

    if (error) {
      console.error('Error fetching received requests:', error)
      return
    }

    setReceivedRequests(data as unknown as BandMember[])
  }

  const fetchRejectedRequests = async () => {
    const { data, error } = await supabase
      .from('band_members')
      .select(`
        id,
        band_id,
        member_id,
        status,
        role,
        rejected_by,
        musician:profiles!member_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('band_id', bandId)
      .eq('status', 'rejected')

    if (error) {
      console.error('Error fetching rejected requests:', error)
      return
    }

    setRejectedRequests(data as unknown as BandMember[])
  }

  const getRoleLabel = (roles: string[]): string => {
    const personCategory = categoryRoles.find(cat => cat.key === 'person')
    if (!personCategory || !roles || roles.length === 0) return ''
    
    return roles
      .map(role => {
        const roleObj = personCategory.roles.find(r => r.value === role)
        return roleObj ? roleObj.label : role
      })
      .join('، ')
  }

  // Send invite to musician
  const inviteMusician = async (musicianId: string) => {
    const { error } = await supabase
      .from('band_members')
      .insert([{
        band_id: bandId,
        member_id: musicianId,
        status: 'pending',
        role: 'member'
      }])

    if (error) {
      if (error.code === '23505') { // Unique violation
        alert('این هنرمند قبلاً دعوت شده است')
      } else {
        alert('خطا در ارسال دعوت')
        console.error('Error inviting musician:', error)
      }
      return
    }

    alert('دعوت با موفقیت ارسال شد')
    setSearchQuery('')
    setSearchResults([])
    fetchPendingInvites() // Refresh pending invites list
  }

  // Cancel invite
  const cancelInvite = async (inviteId: string) => {
    if (!confirm('آیا از لغو این دعوت اطمینان دارید؟')) {
      return
    }

    const { error } = await supabase
      .from('band_members')
      .delete()
      .eq('id', inviteId)

    if (error) {
      alert('خطا در لغو دعوت')
      console.error('Error canceling invite:', error)
      return
    }

    fetchPendingInvites()
  }

  // Remove member
  const removeMember = async (memberId: string) => {
    if (!confirm('آیا از حذف این عضو اطمینان دارید؟')) {
      return
    }

    const { error } = await supabase
      .from('band_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      alert('خطا در حذف عضو')
      console.error('Error removing member:', error)
      return
    }

    fetchMembers()
  }

  // Handle request acceptance/rejection
  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!confirm(`آیا از ${status === 'accepted' ? 'پذیرش' : 'رد'} این درخواست اطمینان دارید؟`)) {
      return
    }

    const { error } = await supabase
      .from('band_members')
      .update({ status })
      .eq('id', requestId)

    if (error) {
      alert(`خطا در ${status === 'accepted' ? 'پذیرش' : 'رد'} درخواست`)
      console.error('Error handling request:', error)
      return
    }

    // Refresh all relevant lists
    fetchMembers()
    fetchReceivedRequests()
    fetchRejectedRequests()
  }

  // Delete rejected request completely
  const deleteRejectedRequest = async (requestId: string) => {
    if (!confirm('با حذف کامل این درخواست، کاربر می‌تواند مجدداً درخواست همکاری ارسال کند. آیا مطمئن هستید؟')) {
      return
    }

    const { error } = await supabase
      .from('band_members')
      .delete()
      .eq('id', requestId)

    if (error) {
      alert('خطا در حذف درخواست')
      console.error('Error deleting request:', error)
      return
    }

    fetchRejectedRequests()
  }

  return (
    <div className="container mx-auto p-6 bg-gray-900">
      <h2 className="text-white text-2xl font-bold mb-6 text-center">مدیریت اعضای گروه</h2>
      {/* Current Members Section */}
      <div>
        <h3 className="text-white text-xl font-semibold mb-4">اعضای فعلی</h3>
        <div className="space-y-4 mb-12">
          {members.map((member) => (
            <div key={member.id} className="bg-gray-800 flex items-center justify-between p-4 border rounded-lg mb-1">
              <div className="flex items-center gap-4">
                {member.musician.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={member.musician.avatar_url}
                      alt={member.musician.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {member.musician.display_name}
                    {member.musician.name && member.musician.name !== member.musician.display_name && 
                      <span className="text-white mr-2">({member.musician.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(member.musician.roles)}</p>
                </div>
              </div>
              <button
                onClick={() => removeMember(member.id)}
                className="bg-gray-800 border border-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                حذف
              </button>
            </div>
          ))}
          
          {members.length === 0 && (
            <p className="text-gray-600 text-center py-4">هنوز عضوی به گروه اضافه نشده است</p>
          )}
        </div>
      </div>
      {/* Search Section */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">افزودن عضو جدید</h3>
        <div className="bg-gray-800 rounded-lg flex gap-4 mb-14">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="جستجوی نام هنرمند..."
            className="flex-1 p-2 border rounded-lg bg-gray-800 text-white"
          />
        </div>
        
        {loading && <p className="text-gray-100">در حال جستجو...</p>}
        
        {searchResults.length > 0 && (
          <div className="space-y-4">
            {searchResults.map((musician) => (
              <div key={musician.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-800 mb-10">
                <div className="flex items-center gap-4">
                  {musician.avatar_url && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={musician.avatar_url}
                        alt={musician.display_name}
                        fill
                        sizes="(max-width: 48px) 100vw, 48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-white font-semibold">
                      {musician.display_name}
                      {musician.name && musician.name !== musician.display_name && 
                        <span className="text-white mr-2">({musician.name})</span>
                      }
                    </h4>
                    <p className="text-sm text-gray-200">{getRoleLabel(musician.roles)}</p>
                  </div>
                </div>
                <button
                  onClick={() => inviteMusician(musician.id)}
                  className="bg-gray-800 border border-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ارسال دعوت
                </button>
              </div>
            ))}
          </div>
        )}
        
        {searchQuery && !loading && searchResults.length === 0 && (
          <p className="text-gray-100 text-center">نتیجه‌ای یافت نشد</p>
        )}
      </div>

      {/* Pending Invites Section */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">دعوت‌های ارسال شده در انتظار پاسخ</h3>
        <div className="space-y-4 border rounded-lg bg-gray-900">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-800">
              <div className="flex items-center gap-4">
                {invite.musician.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={invite.musician.avatar_url}
                      alt={invite.musician.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {invite.musician.display_name}
                    {invite.musician.name && invite.musician.name !== invite.musician.display_name && 
                      <span className="text-white mr-2">({invite.musician.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(invite.musician.roles)}</p>
                  <p className="text-sm text-amber-600">در انتظار پاسخ</p>
                </div>
              </div>
              <button
                onClick={() => cancelInvite(invite.id)}
                className="bg-gray-800 border border-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
              >
                لغو دعوت
              </button>
            </div>
          ))}
          
          {pendingInvites.length === 0 && (
            <p className="text-gray-100 text-center py-4">دعوتی وجود ندارد</p>
          )}
        </div>
      </div>

      {/* Received Requests Section */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">درخواست‌های دریافت شده</h3>
        <div className="space-y-4 border rounded-lg bg-gray-900">
          {receivedRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-800">
              <div className="flex items-center gap-4">
                {request.musician.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={request.musician.avatar_url}
                      alt={request.musician.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {request.musician.display_name}
                    {request.musician.name && request.musician.name !== request.musician.display_name && 
                      <span className="text-white mr-2">({request.musician.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(request.musician.roles)}</p>
                  <p className="text-sm text-blue-500">درخواست همکاری</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequestResponse(request.id, 'accepted')}
                  className="bg-gray-800 border border-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  پذیرش
                </button>
                <button
                  onClick={() => handleRequestResponse(request.id, 'rejected')}
                  className="bg-gray-800 border border-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  رد
                </button>
              </div>
            </div>
          ))}
          
          {receivedRequests.length === 0 && (
            <p className="text-gray-100 text-center py-4">درخواستی وجود ندارد</p>
          )}
        </div>
      </div>

      {/* Rejected Requests Section */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">درخواست‌های رد شده</h3>
        <div className="space-y-4 border rounded-lg bg-gray-900">
          {rejectedRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-4 border border-red-500/30 rounded-lg bg-gray-800">
              <div className="flex items-center gap-4">
                {request.musician.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={request.musician.avatar_url}
                      alt={request.musician.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {request.musician.display_name}
                    {request.musician.name && request.musician.name !== request.musician.display_name && 
                      <span className="text-white mr-2">({request.musician.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(request.musician.roles)}</p>
                  <p className="text-sm text-red-500">
                    {request.rejected_by === request.member_id ? 'درخواست توسط نوازنده/خواننده رد شده' : 'درخواست توسط گروه رد شده'}
                  </p>
                </div>
              </div>
              {request.rejected_by !== request.member_id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequestResponse(request.id, 'accepted')}
                    className="bg-gray-800 border border-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    title="پذیرش مجدد درخواست"
                  >
                    پذیرش
                  </button>
                  <button
                    onClick={() => deleteRejectedRequest(request.id)}
                    className="bg-gray-800 border border-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    title="حذف کامل درخواست و امکان درخواست مجدد"
                  >
                    حذف کامل
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {rejectedRequests.length === 0 && (
            <p className="text-gray-100 text-center py-4">درخواستی وجود ندارد</p>
          )}
        </div>
      </div>
    </div>
  )
} 