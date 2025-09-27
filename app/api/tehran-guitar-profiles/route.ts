import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// آیدی‌های سازهای مورد نظر شما در جدول profile_instruments
const GUITAR_INSTRUMENT_IDS = [
  'classical_guitar',
  'acoustic_guitar',
  'bass_guitar',
]

// 1. تعریف ساختار داده‌ای که مستقیماً از کوئری SELECT برمی‌گردد
// این ساختار شامل فیلد profile_instruments است که از طریق JOIN ایجاد شده است.
interface ProfileWithInstruments {
  id: string
  name: string
  display_name: string
  avatar_url: string
  views: number
  category: string
  roles: string[] | null // نوع را null هم در نظر می‌گیریم
  city: string | null
  province: string | null
  // فیلدی که از طریق JOIN اضافه شده است:
  profile_instruments: {
    instrument_id: string
  }[]
}

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
        province,
        profile_instruments!inner(instrument_id)
      `)
      .eq('is_complete', true)
      // 2. فیلتر برای گیتاریست بودن در تهران:
      .eq('city', 'تهران') // شرط تهرانی بودن
      .in('profile_instruments.instrument_id', GUITAR_INSTRUMENT_IDS) // شرط گیتاریست بودن (با JOIN)
      .not('avatar_url', 'is', null)
      .neq('avatar_url', '')
      .order('views', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching Tehran guitar profiles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. استفاده از Type جدید (ProfileWithInstruments) و پاکسازی خروجی:
    // این قسمت خطای TypeScript (خطوط 48 تا 56) را برطرف می‌کند.
    const profiles = (data as ProfileWithInstruments[] | null)?.map(profile => ({
      id: profile.id,
      name: profile.name,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      views: profile.views,
      category: profile.category,
      roles: profile.roles || [], // اطمینان از اینکه roles یک آرایه است (برای ProfileCarousel.tsx)
      city: profile.city || null,
      province: profile.province || null,
      // ⚠️ فیلد profile_instruments را در خروجی نهایی حذف می‌کنیم
      // تا ساختار آن با اینترفیس Profile در کامپوننت ProfileCarousel سازگار بماند.
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