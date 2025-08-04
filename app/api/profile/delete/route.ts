import { createClient, createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    console.log('Starting profile deletion process...')
    
    const cookieStore = await cookies()
    console.log('Creating Supabase clients...')
    
    const supabase = await createClient()
    const adminClient = await createAdminClient()
    
    console.log('Getting current user...')
    // Get the current user securely
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('User error:', userError)
      return NextResponse.json(
        { error: 'Authentication error: ' + userError.message },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('No user found in session')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }

    console.log('User found:', user.id)
    const userId = user.id

    // Clean up storage buckets first
    console.log('Cleaning up storage buckets...')
    
    // 1. Clean up avatar bucket (check both old and new paths)
    console.log('Cleaning up avatar bucket...')
    
    // Check user's directory
    const { data: avatarListUser, error: avatarListUserError } = await supabase
      .storage
      .from('avatars')
      .list(`${userId}`)

    if (avatarListUserError) {
      console.error('Failed to list avatar files in user directory:', avatarListUserError)
    } else if (avatarListUser && avatarListUser.length > 0) {
      const { error: avatarDeleteUserError } = await supabase
        .storage
        .from('avatars')
        .remove(avatarListUser.map(file => `${userId}/${file.name}`))
      
      if (avatarDeleteUserError) {
        console.error('Failed to delete avatar files from user directory:', avatarDeleteUserError)
      }
    }

    // Check avatars directory (old path)
    const { data: avatarListOld, error: avatarListOldError } = await supabase
      .storage
      .from('avatars')
      .list('avatars')

    if (avatarListOldError) {
      console.error('Failed to list avatar files in avatars directory:', avatarListOldError)
    } else if (avatarListOld && avatarListOld.length > 0) {
      // Find and delete files that belong to this user
      const userFiles = avatarListOld.filter(file => file.name.startsWith(userId))
      if (userFiles.length > 0) {
        const { error: avatarDeleteOldError } = await supabase
          .storage
          .from('avatars')
          .remove(userFiles.map(file => `avatars/${file.name}`))
        
        if (avatarDeleteOldError) {
          console.error('Failed to delete avatar files from avatars directory:', avatarDeleteOldError)
        }
      }
    }

    // Check root directory (in case any files ended up there)
    const { data: avatarListRoot, error: avatarListRootError } = await supabase
      .storage
      .from('avatars')
      .list('')

    if (avatarListRootError) {
      console.error('Failed to list avatar files in root directory:', avatarListRootError)
    } else if (avatarListRoot && avatarListRoot.length > 0) {
      // Find and delete files that belong to this user
      const userFiles = avatarListRoot.filter(file => 
        file.name.startsWith(userId) && !file.name.includes('/')
      )
      if (userFiles.length > 0) {
        const { error: avatarDeleteRootError } = await supabase
          .storage
          .from('avatars')
          .remove(userFiles.map(file => file.name))
        
        if (avatarDeleteRootError) {
          console.error('Failed to delete avatar files from root directory:', avatarDeleteRootError)
        }
      }
    }

    // 2. Clean up gallery bucket
    console.log('Cleaning up gallery bucket...')
    const { data: galleryList, error: galleryListError } = await supabase
      .storage
      .from('gallery')
      .list(`${userId}`)

    if (galleryListError) {
      console.error('Failed to list gallery files:', galleryListError)
    } else if (galleryList && galleryList.length > 0) {
      const { error: galleryDeleteError } = await supabase
        .storage
        .from('gallery')
        .remove(galleryList.map(file => `${userId}/${file.name}`))
      
      if (galleryDeleteError) {
        console.error('Failed to delete gallery files:', galleryDeleteError)
      }
    }

    // 3. Clean up event_posters bucket
    console.log('Cleaning up event posters bucket...')
    const { data: postersList, error: postersListError } = await supabase
      .storage
      .from('event_posters')
      .list(`${userId}`)

    if (postersListError) {
      console.error('Failed to list event poster files:', postersListError)
    } else if (postersList && postersList.length > 0) {
      const { error: postersDeleteError } = await supabase
        .storage
        .from('event_posters')
        .remove(postersList.map(file => `${userId}/${file.name}`))
      
      if (postersDeleteError) {
        console.error('Failed to delete event poster files:', postersDeleteError)
      }
    }

    // Delete from all related tables in sequence
    console.log('Deleting profile instruments...')
    // 1. Delete from profile_instruments
    const { error: instrumentsError } = await supabase
      .from('profile_instruments')
      .delete()
      .eq('profile_id', userId)

    if (instrumentsError) {
      console.error('Failed to delete instruments:', instrumentsError)
    }

    console.log('Deleting profile gallery...')
    // 2. Delete from profile_gallery
    const { error: galleryError } = await supabase
      .from('profile_gallery')
      .delete()
      .eq('profile_id', userId)

    if (galleryError) {
      console.error('Failed to delete gallery:', galleryError)
    }

    console.log('Deleting school teachers...')
    // 3. Delete from school_teachers
    const { error: teachersError } = await supabase
      .from('school_teachers')
      .delete()
      .eq('teacher_id', userId)

    if (teachersError) {
      console.error('Failed to delete teacher records:', teachersError)
    }

    // 3b. Delete from school_teachers where school_id = userId (for music schools)
    const { error: schoolOwnerError } = await supabase
      .from('school_teachers')
      .delete()
      .eq('school_id', userId)

    if (schoolOwnerError) {
      console.error('Failed to delete school owner records:', schoolOwnerError)
    }

    console.log('Deleting band memberships...')
    // 4. Delete from band_members (as member)
    const { error: memberError } = await supabase
      .from('band_members')
      .delete()
      .eq('member_id', userId)

    if (memberError) {
      console.error('Failed to delete band memberships:', memberError)
    }

    console.log('Deleting band members...')
    // 5. Delete from band_members (as band owner)
    const { error: bandError } = await supabase
      .from('band_members')
      .delete()
      .eq('band_id', userId)

    if (bandError) {
      console.error('Failed to delete band members:', bandError)
    }

    console.log('Deleting profile...')
    // Finally delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Profile deletion error:', profileError)
      return NextResponse.json(
        { error: 'Failed to delete profile: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('Deleting auth user...')
    // Delete the user from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('Auth user deletion error:', authError)
      return NextResponse.json(
        { error: 'Failed to delete auth user: ' + authError.message },
        { status: 500 }
      )
    }

    console.log('Signing out user...')
    // Sign out the user
    await supabase.auth.signOut()

    console.log('Clearing cookies...')
    // Clear all cookies
    const response = NextResponse.json(
      { message: 'Profile deleted successfully' },
      { status: 200 }
    )

    // Clear auth cookies
    response.cookies.set('sb-access-token', '', {
      expires: new Date(0),
      path: '/',
    })
    response.cookies.set('sb-refresh-token', '', {
      expires: new Date(0),
      path: '/',
    })

    console.log('Profile deletion completed successfully')
    return response

  } catch (error) {
    console.error('Unexpected error during profile deletion:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 