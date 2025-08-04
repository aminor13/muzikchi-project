import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SchoolTeachersManagement from '@/components/SchoolTeachersManagement'

export default async function SchoolTeachersPage() {
  const cookieStore = cookies()
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Check if user is a school
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles?.includes('school')) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <SchoolTeachersManagement schoolId={user.id} />
    </div>
  )
} 