import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InvitesList from './InvitesList'
import SchoolSearch from '@/app/components/SchoolSearch'
import ActiveSchoolMemberships from './ActiveSchoolMemberships'
import { getUser } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface School {
  id: string
  display_name: string
  avatar_url?: string
  description?: string
  name?: string
  category?: string
}

interface Invite {
  id: string
  school_id: string
  teacher_id: string
  status: string
  role: string
  created_at: string
  school: School
}

interface Membership {
  id: string
  school_id: string
  teacher_id: string
  status: string
  role: string
  created_at: string
  school: School
}

export default async function SchoolInvitesPage() {
  const { user, error: userError } = await getUser()

  if (!user || userError) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Check if user is a teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('teacher')) {
    redirect('/')
  }

  // First get pending school teacher records
  const { data: pendingTeachers } = await supabase
    .from('school_teachers')
    .select('school_id')
    .eq('teacher_id', user.id)
    .eq('status', 'pending');

  // Then get the school profiles for received invites
  const { data: receivedInvitesProfiles, error: receivedInvitesError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      name,
      avatar_url,
      description,
      category
    `)
    .in('id', pendingTeachers?.map(m => m.school_id) || []);

  // Get membership details for received invites
  let enrichedReceivedInvites = [];
  if (receivedInvitesProfiles && !receivedInvitesError) {
    const { data: memberships } = await supabase
      .from('school_teachers')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('status', 'pending')
      .in('school_id', receivedInvitesProfiles.map(p => p.id));

    if (memberships) {
      enrichedReceivedInvites = memberships.map(membership => ({
        ...membership,
        school: receivedInvitesProfiles.find(p => p.id === membership.school_id)
      }));
    }
  }

  // First get requested school teacher records
  const { data: requestedTeachers } = await supabase
    .from('school_teachers')
    .select('school_id')
    .eq('teacher_id', user.id)
    .eq('status', 'requested');

  // Then get the school profiles for sent requests
  const { data: sentRequestsProfiles, error: sentRequestsError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      name,
      avatar_url,
      description,
      category
    `)
    .in('id', requestedTeachers?.map(m => m.school_id) || []);

  // Get membership details for sent requests
  let enrichedSentRequests = [];
  if (sentRequestsProfiles && !sentRequestsError) {
    const { data: memberships } = await supabase
      .from('school_teachers')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('status', 'requested')
      .in('school_id', sentRequestsProfiles.map(p => p.id));

    if (memberships) {
      enrichedSentRequests = memberships.map(membership => ({
        ...membership,
        school: sentRequestsProfiles.find(p => p.id === membership.school_id)
      }));
    }
  }

  // Get rejected invites
  const { data: rejectedTeachers } = await supabase
    .from('school_teachers')
    .select('school_id')
    .eq('teacher_id', user.id)
    .eq('status', 'rejected');

  // Get the school profiles for rejected invites
  const { data: rejectedInvitesProfiles, error: rejectedInvitesError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      name,
      avatar_url,
      description,
      category
    `)
    .in('id', rejectedTeachers?.map(m => m.school_id) || []);

  // Get membership details for rejected invites
  let enrichedRejectedInvites = [];
  if (rejectedInvitesProfiles && !rejectedInvitesError) {
    const { data: memberships } = await supabase
      .from('school_teachers')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('status', 'rejected')
      .in('school_id', rejectedInvitesProfiles.map(p => p.id));

    if (memberships) {
      enrichedRejectedInvites = memberships.map(membership => ({
        ...membership,
        school: rejectedInvitesProfiles.find(p => p.id === membership.school_id)
      }));
    }
  }

  // Get user's active school memberships
  const { data: activeMemberships } = await supabase
    .from('school_teachers')
    .select(`
      id,
      school_id,
      teacher_id,
      status,
      role,
      created_at,
      school:profiles!school_id(
        id,
        display_name,
        name,
        avatar_url,
        description,
        category
      )
    `)
    .eq('teacher_id', user.id)
    .eq('status', 'accepted')
    .returns<Membership[]>();

  const activeSchoolIds = activeMemberships?.map(m => m.school_id) || [];

  if (receivedInvitesError || sentRequestsError || rejectedInvitesError) {
    console.error('Error fetching data:', { receivedInvitesError, sentRequestsError, rejectedInvitesError })
    return (
      <main className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white text-center">دعوت‌های آموزشگاه‌های موسیقی</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">خطا در دریافت اطلاعات. لطفاً صفحه را رفرش کنید.</p>
            <p className="text-red-500 text-sm mt-1 font-mono">{receivedInvitesError?.message || sentRequestsError?.message || rejectedInvitesError?.message}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-white text-center text-2xl font-bold mb-12">دعوت‌های آموزشگاه‌های موسیقی</h1>
        
        {/* Active School Memberships Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">عضویت‌های فعال</h2>
          <ActiveSchoolMemberships memberships={activeMemberships || []} userId={user.id} />
        </div>

        {/* School Search Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">جستجوی آموزشگاه‌های موسیقی</h2>
          <SchoolSearch userId={user.id} activeSchoolIds={activeSchoolIds} />
        </div>

        {/* Received Invites Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">دعوت‌های دریافتی</h2>
          <InvitesList invites={enrichedReceivedInvites} userId={user.id} type="received" />
        </div>

        {/* Sent Requests Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">درخواست‌های ارسال شده</h2>
          <InvitesList invites={enrichedSentRequests} userId={user.id} type="sent" />
        </div>

        {/* Rejected Invites Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">درخواست‌های رد شده</h2>
          <InvitesList invites={enrichedRejectedInvites} userId={user.id} type="rejected" />
        </div>
      </div>
    </main>
  )
} 