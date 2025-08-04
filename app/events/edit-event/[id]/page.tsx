import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EventForm from '@/app/events/create-event/EventForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: Props) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, category, roles')
    .eq('id', user.id)
    .single()

  if (!profile || !(profile.category === 'band' || profile.roles?.includes('venue'))) {
    redirect('/')
  }

  // Get event data
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!event) {
    redirect('/my-events')
  }

  // Check if user owns this event
  if (event.created_by !== profile.display_name) {
    redirect('/my-events')
  }

  return (
    <div className="min-h-screen bg-gray-500 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-orange-500 mb-6">ویرایش رویداد</h1>
          <EventForm userId={profile.display_name} initialData={event} />
        </div>
      </div>
    </div>
  )
} 