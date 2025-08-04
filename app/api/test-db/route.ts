import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    // Test basic columns first
    const { data: basicData, error: basicError } = await supabase
      .from('profiles')
      .select('id, name, display_name, avatar_url, province, city, category, roles')
      .limit(1)

    if (basicError) {
      console.error('Basic columns error:', basicError)
      return NextResponse.json({ 
        error: 'Basic columns error',
        message: basicError.message,
        details: basicError.details,
        hint: basicError.hint
      }, { status: 500 })
    }

    // Test additional columns
    let additionalColumns: Record<string, string> = {}
    
    try {
      const { data: readyData } = await supabase
        .from('profiles')
        .select('ready_for_cooperate')
        .limit(1)
      additionalColumns.ready_for_cooperate = 'exists'
    } catch (e) {
      additionalColumns.ready_for_cooperate = 'missing'
    }

    try {
      const { data: lookingData } = await supabase
        .from('profiles')
        .select('looking_for_musician')
        .limit(1)
      additionalColumns.looking_for_musician = 'exists'
    } catch (e) {
      additionalColumns.looking_for_musician = 'missing'
    }

    try {
      const { data: genderData } = await supabase
        .from('profiles')
        .select('gender')
        .limit(1)
      additionalColumns.gender = 'exists'
    } catch (e) {
      additionalColumns.gender = 'missing'
    }

    try {
      const { data: completeData } = await supabase
        .from('profiles')
        .select('is_complete')
        .limit(1)
      additionalColumns.is_complete = 'exists'
    } catch (e) {
      additionalColumns.is_complete = 'missing'
    }

    // Test profile_instruments table
    let profileInstrumentsStatus = 'missing'
    try {
      const { data: piData, error: piError } = await supabase
        .from('profile_instruments')
        .select('*')
        .limit(1)
      
      if (!piError) {
        profileInstrumentsStatus = 'exists'
        if (piData && piData.length > 0) {
          additionalColumns.profile_instruments_columns = Object.keys(piData[0]).join(', ')
        }
      }
    } catch (e) {
      profileInstrumentsStatus = 'error'
    }

    // Test the complete query with join
    let joinQueryStatus = 'error'
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('profiles')
        .select('id, name, display_name, avatar_url, province, city, category, roles, ready_for_cooperate, looking_for_musician, profile_instruments:profile_instruments(instrument_id)')
        .eq('is_complete', true)
        .limit(1)
      
      if (!joinError) {
        joinQueryStatus = 'success'
        additionalColumns.join_query_result = `Found ${joinData?.length || 0} profiles`
      } else {
        joinQueryStatus = 'failed'
        additionalColumns.join_query_error = joinError.message
      }
    } catch (e) {
      joinQueryStatus = 'exception'
      additionalColumns.join_query_exception = e instanceof Error ? e.message : 'Unknown error'
    }

    return NextResponse.json({ 
      success: true, 
      basicData: basicData,
      additionalColumns,
      profileInstrumentsTable: profileInstrumentsStatus,
      joinQueryStatus,
      message: 'Column and table test completed'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    )
  }
} 