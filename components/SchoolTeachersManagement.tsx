'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Database } from '@/types/supabase'
import categoryRoles from '@/data/category_role.json'

type Profile = Database['public']['Tables']['profiles']['Row']
type SchoolTeacher = {
  id: string
  school_id: string
  teacher_id: string
  status: 'accepted' | 'rejected' | 'pending' | 'requested'
  role: string
  rejected_by: string | null
  teacher: {
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

export default function SchoolTeachersManagement({ schoolId }: { schoolId: string }) {
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([])
  const [pendingInvites, setPendingInvites] = useState<SchoolTeacher[]>([])
  const [receivedRequests, setReceivedRequests] = useState<SchoolTeacher[]>([])
  const [rejectedRequests, setRejectedRequests] = useState<SchoolTeacher[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Fetch current teachers, pending invites, and received requests
  useEffect(() => {
    fetchTeachers()
    fetchPendingInvites()
    fetchReceivedRequests()
    fetchRejectedRequests()
  }, [schoolId])

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('school_teachers')
      .select(`
        id,
        school_id,
        teacher_id,
        status,
        role,
        rejected_by,
        teacher:profiles!teacher_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('school_id', schoolId)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching teachers:', error)
      return
    }

    setTeachers(data as unknown as SchoolTeacher[])
  }

  const fetchPendingInvites = async () => {
    const { data, error } = await supabase
      .from('school_teachers')
      .select(`
        id,
        school_id,
        teacher_id,
        status,
        role,
        rejected_by,
        teacher:profiles!teacher_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('school_id', schoolId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error fetching pending invites:', error)
      return
    }

    setPendingInvites(data as unknown as SchoolTeacher[])
  }

  const fetchReceivedRequests = async () => {
    const { data, error } = await supabase
      .from('school_teachers')
      .select(`
        id,
        school_id,
        teacher_id,
        status,
        role,
        rejected_by,
        teacher:profiles!teacher_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('school_id', schoolId)
      .eq('status', 'requested')

    if (error) {
      console.error('Error fetching received requests:', error)
      return
    }

    setReceivedRequests(data as unknown as SchoolTeacher[])
  }

  const fetchRejectedRequests = async () => {
    const { data, error } = await supabase
      .from('school_teachers')
      .select(`
        id,
        school_id,
        teacher_id,
        status,
        role,
        rejected_by,
        teacher:profiles!teacher_id (
          id,
          display_name,
          name,
          avatar_url,
          roles
        )
      `)
      .eq('school_id', schoolId)
      .eq('status', 'rejected')

    if (error) {
      console.error('Error fetching rejected requests:', error)
      return
    }

    setRejectedRequests(data as unknown as SchoolTeacher[])
  }

  // Search for teachers
  const searchTeachers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, name, avatar_url, roles')
      .contains('roles', ['teacher'])
      .or(`display_name.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(5)

    setLoading(false)

    if (error) {
      console.error('Error searching teachers:', error)
      return
    }

    // Filter results to only include those that match the name search
    const filteredData = data?.filter((profile: { display_name: string; name?: string | null }) => 
      profile.display_name.toLowerCase().includes(query.toLowerCase()) ||
      (profile.name && profile.name.toLowerCase().includes(query.toLowerCase()))
    )

    setSearchResults(filteredData || [])
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

  // Send invite to teacher
  const inviteTeacher = async (teacherId: string) => {
    // Check if there's an existing relationship
    const { data: existingRelation, error: checkError } = await supabase
      .from('school_teachers')
      .select('id, status')
      .eq('school_id', schoolId)
      .eq('teacher_id', teacherId)
      .maybeSingle() // Use maybeSingle instead of single to avoid 406 error

    if (checkError) {
      alert('خطا در بررسی وضعیت دعوت')
      console.error('Error checking invite status:', checkError)
      return
    }

    if (existingRelation) {
      switch(existingRelation.status) {
        case 'pending':
          alert('این استاد قبلاً دعوت شده و در انتظار پاسخ است')
          break
        case 'accepted':
          alert('این استاد در حال حاضر عضو مدرسه است')
          break
        case 'requested':
          alert('این استاد قبلاً درخواست عضویت داده است')
          break
        case 'rejected':
          alert('درخواست این استاد قبلاً رد شده است')
          break
        default:
          alert('امکان دعوت این استاد وجود ندارد')
      }
      return
    }

    const { error } = await supabase
      .from('school_teachers')
      .insert([{
        school_id: schoolId,
        teacher_id: teacherId,
        status: 'pending',
        role: 'teacher' // This value must match the CHECK constraint
      }])

    if (error) {
      if (error.code === '42501') { // Permission denied
        alert('شما مجوز لازم برای دعوت استاد را ندارید')
      } else if (error.code === '23505') { // Unique violation
        alert('این استاد قبلاً دعوت شده است')
      } else if (error.code === '23514') { // Check violation
        alert('خطا: نقش تعیین شده معتبر نیست')
        console.error('Error inviting teacher:', error)
      } else {
        alert('خطا در ارسال دعوت')
        console.error('Error inviting teacher:', error)
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
      .from('school_teachers')
      .delete()
      .eq('id', inviteId)

    if (error) {
      alert('خطا در لغو دعوت')
      console.error('Error canceling invite:', error)
      return
    }

    fetchPendingInvites()
  }

  // Remove teacher
  const removeTeacher = async (teacherId: string) => {
    if (!confirm('آیا از حذف این استاد اطمینان دارید؟')) {
      return
    }

    const { error } = await supabase
      .from('school_teachers')
      .delete()
      .eq('id', teacherId)

    if (error) {
      alert('خطا در حذف استاد')
      console.error('Error removing teacher:', error)
      return
    }

    fetchTeachers()
  }

  // Handle request acceptance/rejection
  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!confirm(`آیا از ${status === 'accepted' ? 'پذیرش' : 'رد'} این درخواست اطمینان دارید؟`)) {
      return
    }

    const updateData = status === 'rejected' 
      ? { status, rejected_by: schoolId }
      : { status, rejected_by: null }

    const { error } = await supabase
      .from('school_teachers')
      .update(updateData)
      .eq('id', requestId)

    if (error) {
      alert(`خطا در ${status === 'accepted' ? 'پذیرش' : 'رد'} درخواست`)
      console.error('Error handling request:', error)
      return
    }

    // Refresh all relevant lists
    fetchTeachers()
    fetchReceivedRequests()
    fetchRejectedRequests()
  }

  // Delete rejected request completely
  const deleteRejectedRequest = async (requestId: string) => {
    if (!confirm('با حذف کامل این درخواست، کاربر می‌تواند مجدداً درخواست همکاری ارسال کند. آیا مطمئن هستید؟')) {
      return
    }

    const { error } = await supabase
      .from('school_teachers')
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
      <h2 className="text-white text-2xl font-bold mb-6 text-center">مدیریت اساتید</h2>
      {/* Current Teachers Section */}
      <div>
        <h3 className="text-white text-xl font-semibold mb-4">اساتید فعلی</h3>
        <div className="space-y-4 mb-12">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-gray-800 flex items-center justify-between p-4 border rounded-lg mb-1">
              <div className="flex items-center gap-4">
                {teacher.teacher.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={teacher.teacher.avatar_url}
                      alt={teacher.teacher.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {teacher.teacher.display_name}
                    {teacher.teacher.name && teacher.teacher.name !== teacher.teacher.display_name && 
                      <span className="text-white mr-2">({teacher.teacher.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(teacher.teacher.roles)}</p>
                </div>
              </div>
              <button
                onClick={() => removeTeacher(teacher.id)}
                className="bg-gray-800 border border-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                حذف
              </button>
            </div>
          ))}
          
          {teachers.length === 0 && (
            <p className="text-gray-600 text-center py-4">هنوز استادی به آموزشگاه اضافه نشده است</p>
          )}
        </div>
      </div>
      {/* Search Section */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">افزودن استاد جدید</h3>
        <div className="bg-gray-800 rounded-lg flex gap-4 mb-14">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchTeachers(e.target.value)
            }}
            placeholder="جستجوی نام استاد..."
            className="flex-1 p-2 border rounded-lg bg-gray-800 text-white"
          />
        </div>
        
        {loading && <p className="text-gray-100">در حال جستجو...</p>}
        
        {searchResults.length > 0 && (
          <div className="space-y-4">
            {searchResults.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-800 mb-10">
                <div className="flex items-center gap-4">
                  {teacher.avatar_url && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={teacher.avatar_url}
                        alt={teacher.display_name}
                        fill
                        sizes="(max-width: 48px) 100vw, 48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-white font-semibold">
                      {teacher.display_name}
                      {teacher.name && teacher.name !== teacher.display_name && 
                        <span className="text-white mr-2">({teacher.name})</span>
                      }
                    </h4>
                    <p className="text-sm text-gray-200">{getRoleLabel(teacher.roles)}</p>
                  </div>
                </div>
                <button
                  onClick={() => inviteTeacher(teacher.id)}
                  className="bg-gray-800 border border-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ارسال دعوت
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invites Section */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">دعوت‌های ارسال شده</h3>
        <div className="space-y-4 border rounded-lg bg-gray-900">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-800">
              <div className="flex items-center gap-4">
                {invite.teacher.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={invite.teacher.avatar_url}
                      alt={invite.teacher.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {invite.teacher.display_name}
                    {invite.teacher.name && invite.teacher.name !== invite.teacher.display_name && 
                      <span className="text-white mr-2">({invite.teacher.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(invite.teacher.roles)}</p>
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
                {request.teacher.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={request.teacher.avatar_url}
                      alt={request.teacher.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {request.teacher.display_name}
                    {request.teacher.name && request.teacher.name !== request.teacher.display_name && 
                      <span className="text-white mr-2">({request.teacher.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(request.teacher.roles)}</p>
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
                {request.teacher.avatar_url && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={request.teacher.avatar_url}
                      alt={request.teacher.display_name}
                      fill
                      sizes="(max-width: 48px) 100vw, 48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {request.teacher.display_name}
                    {request.teacher.name && request.teacher.name !== request.teacher.display_name && 
                      <span className="text-white mr-2">({request.teacher.name})</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-200">{getRoleLabel(request.teacher.roles)}</p>
                  <p className="text-sm text-red-500">
                    {request.rejected_by === request.teacher_id ? 'توسط استاد رد شد' : 'توسط آموزشگاه رد شد'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {request.rejected_by !== request.teacher_id && (
                  <>
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
                  </>
                )}
              </div>
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