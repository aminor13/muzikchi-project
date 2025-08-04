import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EventForm from './EventForm'

export default async function CreateEvent() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to get display_name and check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, category, roles')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  // Allow all authenticated users to create events
  const canCreateEvents = true

  return (
    <div className="min-h-screen bg-gray-500 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-orange-500 mb-6">ثبت رویداد جدید</h1>
          <EventForm userId={profile.display_name} displayName={profile.display_name} />
        </div>
      </div>
    </div>
  )
} 