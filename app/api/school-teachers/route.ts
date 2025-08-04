import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user || userError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { invite_id, action } = await request.json()

    if (!invite_id || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Get the invite details
    const { data: invite, error: inviteError } = await supabase
      .from('school_teachers')
      .select('*')
      .eq('id', invite_id)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', debug: inviteError },
        { status: 404 }
      )
    }

    // Check if the user is the teacher
    if (invite.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only respond to your own invites' },
        { status: 403 }
      )
    }

    // For rejected invites that were rejected by the school, allow accepting them again
    if (action === 'accept' && invite.status === 'rejected' && invite.rejected_by !== user.id) {
      const updateData = { status: 'accepted', rejected_by: null }
      const { error: updateError } = await supabase
        .from('school_teachers')
        .update(updateData)
        .eq('id', invite_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update invite status', debug: updateError },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // For accepting a self-rejected invite, just update the status
    if (action === 'accept' && invite.status === 'rejected' && invite.rejected_by === user.id) {
      const updateData = { status: 'accepted', rejected_by: null }
      const { error: updateError } = await supabase
        .from('school_teachers')
        .update(updateData)
        .eq('id', invite_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update invite status', debug: updateError },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Update the invite status for other cases
    const updateData = action === 'reject' 
      ? { status: 'rejected', rejected_by: user.id }
      : { status: 'accepted', rejected_by: null }

    const { error: updateError } = await supabase
      .from('school_teachers')
      .update(updateData)
      .eq('id', invite_id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update invite status', debug: updateError },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling school teacher invite:', error)
    return NextResponse.json(
      { error: 'Internal server error', debug: error },
      { status: 500 }
    )
  }
} 

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user || userError) {
      console.error('Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { membershipId } = await request.json()

    if (!membershipId) {
      return NextResponse.json(
        { error: 'Membership ID is required' },
        { status: 400 }
      )
    }

    console.log('Attempting to leave school membership:', { membershipId, userId: user.id })

    // Get the membership details to verify ownership
    const { data: membership, error: membershipError } = await supabase
      .from('school_teachers')
      .select('*')
      .eq('id', membershipId)
      .single()

    if (membershipError || !membership) {
      console.error('School membership not found:', { membershipError, membershipId })
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    console.log('Found school membership:', membership)

    // Check if the user is the teacher
    if (membership.teacher_id !== user.id) {
      console.error('Unauthorized leave attempt:', { 
        membershipTeacherId: membership.teacher_id, 
        currentUserId: user.id 
      })
      return NextResponse.json(
        { error: 'Unauthorized - You can only leave your own memberships' },
        { status: 403 }
      )
    }

    // Update the membership status to 'left' instead of deleting
    const { data: updateResult, error: updateError } = await supabase
      .from('school_teachers')
      .update({ 
        status: 'left',
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .eq('teacher_id', user.id)
      .select()

    console.log('Update result:', { updateResult, updateError })

    if (updateError) {
      console.error('Update error:', updateError)
      
      // Check if it's an RLS error
      if (updateError.message && updateError.message.includes('policy')) {
        return NextResponse.json(
          { error: 'Permission denied - RLS policy blocked the operation', debug: updateError },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to leave school', debug: updateError },
        { status: 500 }
      )
    }

    console.log('Successfully left school membership')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving school:', error)
    return NextResponse.json(
      { error: 'Internal server error', debug: error },
      { status: 500 }
    )
  }
} 