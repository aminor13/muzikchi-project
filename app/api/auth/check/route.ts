import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      )
    }

    // Get user profile with is_admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Error fetching profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        is_admin: profile?.is_admin
      },
      isAdmin: profile?.is_admin === true
    })
  } catch (error) {
    console.error('Error checking auth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 