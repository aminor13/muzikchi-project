import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Get table info
  const { data: tableInfo, error: tableError } = await supabase
    .from('events')
    .select('*')
    .limit(1)

  if (tableError) {
    return NextResponse.json({ error: tableError.message }, { status: 500 })
  }

  // Try to update a record
  const { data: updateTest, error: updateError } = await supabase
    .from('events')
    .update({
      status: 'pending',
      admin_note: 'test note',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', tableInfo[0]?.id || '')
    .select()

  return NextResponse.json({
    tableStructure: tableInfo ? Object.keys(tableInfo[0] || {}) : [],
    updateResult: updateTest,
    updateError: updateError?.message,
    originalRecord: tableInfo?.[0]
  })
} 