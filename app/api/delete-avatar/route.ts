import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ 
        error: 'File path is required',
        details: 'Please provide a file path to delete'
      }, { status: 400 })
    }

    console.log('Deleting avatar:', filePath)

    // Create admin client
    const supabaseAdmin = await createAdminClient()
    
    // Delete the file
    const { error: deleteError } = await supabaseAdmin.storage
      .from('avatars')
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Delete failed',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('Avatar deleted successfully:', filePath)

    return NextResponse.json({ 
      success: true,
      message: 'Avatar deleted successfully',
      path: filePath
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 