import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InvitesList from './InvitesList'
import BandSearch from '@/app/components/BandSearch'
import ActiveMemberships from './ActiveMemberships'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Band {
  id: string
  display_name: string
  avatar_url?: string
  description?: string
  name?: string
  category?: string
}

interface BaseMembership {
  id: string
  band_id: string
  member_id: string
  status: string
  role: string
  rejected_by?: string
  created_at: string
  band: Band
}

interface Invite extends BaseMembership {}
interface Membership extends BaseMembership {}

type InviteType = "received" | "sent" | "rejected" | "self_rejected";

export default async function BandInvitesPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect('/login')
  }

  // Check if user is a musician/vocalist
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.some((role: string) => ['musician', 'vocalist', 'singer'].includes(role))) {
    redirect('/')
  }

  // First get pending band member records
  const { data: pendingMembers } = await supabase
    .from('band_members')
    .select('band_id')
    .eq('member_id', user.id)
    .eq('status', 'pending');

  // Then get the band profiles for received invites
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
    .in('id', pendingMembers?.map(m => m.band_id) || []);

  // Get membership details for received invites
  let enrichedReceivedInvites = [];
  if (receivedInvitesProfiles && !receivedInvitesError) {
    const { data: memberships } = await supabase
      .from('band_members')
      .select('*')
      .eq('member_id', user.id)
      .eq('status', 'pending')
      .in('band_id', receivedInvitesProfiles.map(p => p.id));

    if (memberships) {
      enrichedReceivedInvites = memberships.map(membership => ({
        ...membership,
        band: receivedInvitesProfiles.find(p => p.id === membership.band_id)
      }));
    }
  }

  // First get requested band member records
  const { data: requestedMembers } = await supabase
    .from('band_members')
    .select('band_id')
    .eq('member_id', user.id)
    .eq('status', 'requested');

  // Then get the band profiles for sent requests
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
    .in('id', requestedMembers?.map(m => m.band_id) || []);

  // Get membership details for sent requests
  let enrichedSentRequests = [];
  if (sentRequestsProfiles && !sentRequestsError) {
    const { data: memberships } = await supabase
      .from('band_members')
      .select('*')
      .eq('member_id', user.id)
      .eq('status', 'requested')
      .in('band_id', sentRequestsProfiles.map(p => p.id));

    if (memberships) {
      enrichedSentRequests = memberships.map(membership => ({
        ...membership,
        band: sentRequestsProfiles.find(p => p.id === membership.band_id)
      }));
    }
  }

  // Get user's active band memberships
  const { data: activeMemberships } = await supabase
    .from('band_members')
    .select(`
      id,
      band_id,
      member_id,
      status,
      role,
      created_at,
      band:profiles!band_id(
        id,
        display_name,
        name,
        avatar_url,
        description,
        category
      )
    `)
    .eq('member_id', user.id)
    .eq('status', 'accepted')
    .returns<Membership[]>();

  // Get rejected band member records
  const { data: rejectedMembers } = await supabase
    .from('band_members')
    .select(`
      id,
      band_id,
      member_id,
      status,
      role,
      rejected_by,
      created_at,
      band:profiles!band_id(
        id,
        display_name,
        name,
        avatar_url,
        description,
        category
      )
    `)
    .eq('member_id', user.id)
    .eq('status', 'rejected')
    .returns<Invite[]>();

  // Separate rejected requests based on who rejected them
  const selfRejectedRequests = rejectedMembers?.filter(m => m.rejected_by === user.id) || [];
  const bandRejectedRequests = rejectedMembers?.filter(m => m.rejected_by !== user.id) || [];

  // Then get the band profiles for rejected requests
  const { data: rejectedRequestsProfiles, error: rejectedRequestsError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      name,
      avatar_url,
      description,
      category
    `)
    .in('id', rejectedMembers?.map(m => m.band_id) || []);

  // Get membership details for rejected requests
  let enrichedRejectedRequests = [];
  if (rejectedRequestsProfiles && !rejectedRequestsError) {
    const { data: memberships } = await supabase
      .from('band_members')
      .select('*')
      .eq('member_id', user.id)
      .eq('status', 'rejected')
      .in('band_id', rejectedRequestsProfiles.map(p => p.id));

    if (memberships) {
      enrichedRejectedRequests = memberships.map(membership => ({
        ...membership,
        band: rejectedRequestsProfiles.find(p => p.id === membership.band_id)
      }));
    }
  }

  const activeBandIds = activeMemberships?.map(m => m.band_id) || [];

  if (receivedInvitesError || sentRequestsError) {
    console.error('Error fetching data:', { receivedInvitesError, sentRequestsError })
    return (
      <main className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white text-center">مدیریت عضویت در گروه‌های موسیقی</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">خطا در دریافت اطلاعات. لطفاً صفحه را رفرش کنید.</p>
            <p className="text-red-500 text-sm mt-1 font-mono">{receivedInvitesError?.message || sentRequestsError?.message}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-white text-center text-2xl font-bold mb-12">مدیریت عضویت در گروه‌های موسیقی</h1>
        
        {/* Active Memberships Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">عضویت‌های فعال</h2>
          <ActiveMemberships memberships={activeMemberships || []} userId={user.id} />
        </div>

        {/* Band Search Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">جستجوی گروه‌های موسیقی</h2>
          <BandSearch userId={user.id} activeBandIds={activeBandIds} />
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

        {/* Rejected by Band Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">درخواست‌های رد شده توسط گروه</h2>
          <InvitesList invites={bandRejectedRequests} userId={user.id} type="rejected" />
        </div>

        {/* Self Rejected Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">درخواست‌های رد شده توسط شما</h2>
          <InvitesList invites={selfRejectedRequests} userId={user.id} type="self_rejected" />
        </div>
      </div>
    </main>
  )
} 