import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

// Define route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Define route handler with explicit types from Next.js
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    console.log('API route called')
    
    const params = await context.params
    const { id } = params
    
    console.log('Received event ID:', id)
    console.log('Event ID type:', typeof id)
    console.log('Event ID length:', id?.length)
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format:', id)
      return new Response(
        JSON.stringify({ error: `Invalid event ID format: ${id}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const body = await request.json()
    console.log('Raw request body:', body)
    
    const status = body.status?.toString()
    const admin_note = body.admin_note
    
    console.log('Parsed request:', { 
      status, 
      admin_note, 
      eventId: id,
      statusType: typeof status,
      validStatus: status === 'approved' || status === 'rejected'
    })
    
    // Validate input
    if (!status || !(status === 'approved' || status === 'rejected')) {
      console.log('Invalid status:', { 
        receivedStatus: status,
        statusExists: !!status,
        statusType: typeof status,
        validValues: ['approved', 'rejected'],
        statusEquality: {
          approved: status === 'approved',
          rejected: status === 'rejected'
        }
      })
      return new Response(
        JSON.stringify({ error: `Invalid status: ${status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (status === 'rejected' && !admin_note?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Admin note is required for rejections' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get authenticated Supabase client
    const supabase = await createClient()

    // First, check if the event exists and how many rows match
    const { data: foundEvents, error: findError, count } = await supabase
      .from('events')
      .select('id, status', { count: 'exact' })
      .eq('id', id)

    console.log('Select before update:', { foundEvents, count, findError })

    if (findError) {
      console.error('Error checking event:', findError)
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!foundEvents || foundEvents.length !== 1) {
      return new Response(
        JSON.stringify({ error: `Event not found or not unique (found: ${foundEvents?.length})` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Auth error:', { authError })
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      console.log('Profile error or not admin:', { profileError, is_admin: profile?.is_admin })
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Prepare update data
    const updateData = {
      status,
      admin_note: admin_note?.trim() || null,
      reviewed_at: new Date().toISOString(),
    }

    console.log('Attempting to update event with:', updateData)

    // Update event status
    const { data: event, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', {
        error: updateError,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        message: updateError.message
      })
      return new Response(
        JSON.stringify({ error: `Failed to update event: ${updateError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Event updated successfully:', event)
    return new Response(JSON.stringify(event), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 