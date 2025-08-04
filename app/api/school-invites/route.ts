import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { teacher_id, instruments, message } = await request.json();

    // Check if the user is authorized (must be a school)
    const { data: schoolData, error: schoolError } = await supabase
      .from('profiles')
      .select('id, category')
      .eq('id', user.id)
      .eq('category', 'school')
      .single();

    if (schoolError || !schoolData) {
      return NextResponse.json({ error: 'Unauthorized - must be a school' }, { status: 403 });
    }

    // Check if there's already an active invite
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('school_members')
      .select('*')
      .eq('teacher_id', teacher_id)
      .eq('school_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'An invite is already pending' }, { status: 400 });
    }

    // Create the invite
    const { data: invite, error: inviteError } = await supabase
      .from('school_members')
      .insert([
        {
          teacher_id,
          school_id: user.id,
          instruments,
          status: 'pending',
          message,
          request_type: 'invite'
        }
      ])
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    return NextResponse.json(invite);
  } catch (error) {
    console.error('Error creating school invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { invite_id, action } = await request.json();

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the invite and verify ownership
    const { data: invite, error: inviteError } = await supabase
      .from('school_members')
      .select('*')
      .eq('id', invite_id)
      .eq('teacher_id', user.id)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Update the invite status
    const { error: updateError } = await supabase
      .from('school_members')
      .update({ 
        status: action === 'accept' ? 'accepted' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', invite_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ status: 'success', action });
  } catch (error) {
    console.error('Error handling school invite:', error);
    return NextResponse.json({ error: 'Failed to process invite' }, { status: 500 });
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
      .from('school_members')
      .select(`
        *,
        school:profiles!school_id(*),
        teacher:profiles!teacher_id(*)
      `);

    // Filter by type
    if (type === 'sent') {
      query = query.eq('school_id', user.id);
    } else if (type === 'received') {
      query = query.eq('teacher_id', user.id);
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
    console.error('Error fetching school invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
} 