import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BandMembersManagement from '@/components/BandMembersManagement'

export default async function BandMembersPage() {
  const cookieStore = cookies()
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Check if user is a band
  const { data: profile } = await supabase
    .from('profiles')
    .select('category')
    .eq('id', user.id)
    .single()

  if (!profile || profile.category !== 'band') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <BandMembersManagement bandId={user.id} />
    </div>
  )
} 