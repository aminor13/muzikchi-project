import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        display_name,
        avatar_url,
        views,
        category,
        roles,
        city,
        province
      `)
      .eq('is_complete', true)
      .order('views', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // اطمینان از وجود داده‌ها قبل از ارسال
    const profiles = data?.map(profile => ({
      ...profile,
      city: profile.city || null,
      province: profile.province || null
    })) || []

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 