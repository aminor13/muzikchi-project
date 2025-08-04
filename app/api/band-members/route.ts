import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    console.log('Request data:', requestData);
    const { musician_id } = requestData;

    // Get the user's profile to check if they are a band
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, category, name, display_name')
      .eq('id', user.id)
      .single();

    console.log('User ID:', user.id);
    console.log('Profile:', profile);
    console.log('Profile category:', profile?.category);
    console.log('Is band?', profile?.category === 'band');

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to get profile: ' + profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.category !== 'band') {
      return NextResponse.json({ 
        error: `Unauthorized - must be a band. Current category: ${profile.category}` 
      }, { status: 403 });
    }

    // Check if there's already an active invite
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('band_members')
      .select('*')
      .eq('member_id', musician_id)
      .eq('band_id', user.id)
      .eq('status', 'pending')
      .single();

    console.log('Existing invite check:', { existingInvite, inviteCheckError });

    if (existingInvite) {
      return NextResponse.json({ error: 'An invite is already pending' }, { status: 400 });
    }

    // Create the invite
    const now = new Date().toISOString();
    const insertData = {
      member_id: musician_id,
      band_id: user.id,
      status: 'pending',
      role: 'member', // Default role
      created_at: now,
      updated_at: now,
      request_type: 'invite'  // گروه موسیقی دعوت کرده است
    };
    console.log('Attempting to insert:', insertData);

    const { data: invite, error: inviteError } = await supabase
      .from('band_members')
      .insert([insertData])
      .select()
      .single();

    if (inviteError) {
      console.error('Insert error:', inviteError);
      return NextResponse.json({ 
        error: 'Failed to create invite: ' + inviteError.message,
        details: inviteError
      }, { status: 500 });
    }

    console.log('Successfully created invite:', invite);
    return NextResponse.json(invite);
  } catch (error: any) {
    console.error('Error creating band invite:', error);
    return NextResponse.json({ 
      error: 'Failed to create invite: ' + (error.message || 'Unknown error'),
      details: error
    }, { status: 500 });
  }
}

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
      .from('band_members')
      .select('*')
      .eq('id', invite_id)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', debug: inviteError },
        { status: 404 }
      )
    }

    // Check if the user is the member
    if (invite.member_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only respond to your own invites' },
        { status: 403 }
      )
    }

    // Check if the invite can be accepted
    if (action === 'accept' && invite.status === 'rejected' && invite.rejected_by === user.id) {
      return NextResponse.json(
        { error: 'Cannot accept an invite that you rejected' },
        { status: 400 }
      )
    }

    // Update the invite status
    const updateData = action === 'reject' 
      ? { status: 'rejected', rejected_by: user.id }
      : { status: 'accepted', rejected_by: null }

    const { error: updateError } = await supabase
      .from('band_members')
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
    console.error('Error handling band member invite:', error)
    return NextResponse.json(
      { error: 'Internal server error', debug: error },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { 
      status: 401,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent' or 'received'
    const status = searchParams.get('status'); // 'pending', 'accepted', 'rejected'

    let query = supabase
      .from('band_members')
      .select(`
        *,
        band:profiles!band_id(*),
        musician:profiles!member_id(*)
      `);

    // Filter by type
    if (type === 'sent') {
      query = query.eq('band_id', user.id);
    } else if (type === 'received') {
      query = query.eq('member_id', user.id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: invites, error: invitesError } = await query;

    if (invitesError) {
      throw invitesError;
    }

    return NextResponse.json(invites, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching band invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
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

    console.log('Attempting to leave band membership:', { membershipId, userId: user.id })

    // Get the membership details to verify ownership
    const { data: membership, error: membershipError } = await supabase
      .from('band_members')
      .select('*')
      .eq('id', membershipId)
      .single()

    if (membershipError || !membership) {
      console.error('Membership not found:', { membershipError, membershipId })
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    console.log('Found membership:', membership)

    // Check if the user is the member
    if (membership.member_id !== user.id) {
      console.error('Unauthorized leave attempt:', { 
        membershipMemberId: membership.member_id, 
        currentUserId: user.id 
      })
      return NextResponse.json(
        { error: 'Unauthorized - You can only leave your own memberships' },
        { status: 403 }
      )
    }

    // Update the membership status to 'left' instead of deleting
    const { data: updateResult, error: updateError } = await supabase
      .from('band_members')
      .update({ 
        status: 'left',
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .eq('member_id', user.id)
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
        { error: 'Failed to leave band', debug: updateError },
        { status: 500 }
      )
    }

    console.log('Successfully left band membership')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving band:', error)
    return NextResponse.json(
      { error: 'Internal server error', debug: error },
      { status: 500 }
    )
  }
} 