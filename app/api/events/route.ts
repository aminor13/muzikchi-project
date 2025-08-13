import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // اعتبارسنجی داده‌های ورودی
    if (!body.title || !body.event_date || !body.custom_venue) {
      return NextResponse.json(
        { error: 'لطفا همه فیلدهای ضروری را پر کنید' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'تنظیمات Supabase یافت نشد' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // ثبت رویداد در دیتابیس
    const { data: event, error } = await supabase
      .from('events')
      .insert([
        {
          title: body.title,
          description: body.description,
          event_date: body.event_date,
          custom_venue: body.custom_venue,
          organizer_id: body.organizer_id,
          ticket_price: body.ticket_price,
          capacity: body.capacity,
          poster_url: body.poster_url,
          status: 'upcoming'
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت رویداد' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'تنظیمات Supabase یافت نشد' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'upcoming'
    
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey (
          name,
          display_name,
          avatar_url,
          category
        )
      `)
      .eq('status', status)
      .order('event_date', { ascending: true })

    if (error) throw error

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت رویدادها' },
      { status: 500 }
    )
  }
} 