import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = params

  // ابتدا مقدار فعلی را می‌خوانیم
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('views')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const newViews = (profile.views || 0) + 1

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ views: newViews })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, views: newViews })
} 