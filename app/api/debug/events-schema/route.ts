import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('events')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('Error fetching table info:', tableError)
      return NextResponse.json({ error: tableError.message }, { status: 500 })
    }

    // Try to get enum values for status
    const { data: enumValues, error: enumError } = await supabase
      .rpc('get_status_enum_values')
      .select()

    if (enumError) {
      console.log('Error fetching enum values (this is expected if status is not an enum):', enumError)
    }

    return NextResponse.json({
      columns: tableInfo ? Object.keys(tableInfo[0] || {}) : [],
      sampleData: tableInfo?.[0],
      statusEnumValues: enumValues,
      note: 'This endpoint shows the current structure of the events table'
    })
  } catch (error) {
    console.error('Error checking schema:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 