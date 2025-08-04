import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  poster_url: string | null;
  ticket_price: number | null;
  capacity: number | null;
  ticket_link: string | null;
  profiles: {
    display_name: string;
    name: string;
    created_by: string;
  };
  province: string | null;
  city: string | null;
}

export async function GET() {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles!inner (
        display_name,
        name
      )
    `)
    .eq('status', 'approved')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format events for display
  const formattedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: new Date(event.date).toLocaleDateString('fa-IR'),
    time: event.time,
    location: event.venue,
    description: event.description,
    image_url: event.poster_url,
    ticket_price: event.ticket_price,
    capacity: event.capacity,
    ticket_link: event.ticket_link,
    organizer_name: event.profiles.display_name,
    organizer_real_name: event.profiles.name,
    created_by: event.created_by,
    province: event.province,
    city: event.city
  }))

  return NextResponse.json(formattedEvents)
} 