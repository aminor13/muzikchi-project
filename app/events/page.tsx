import { createClient } from '@/utils/supabase/server'
import EventsPageClient from './EventsPageClient'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      profiles!inner(
        display_name,
        name
      )
    `)
    .eq('status', 'approved')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })

  return <EventsPageClient events={events || []} />
} 