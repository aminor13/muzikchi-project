import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test storage bucket access
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Storage bucket list error:', bucketError)
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketError.message
      }, { status: 500 })
    }

    // Check if avatars bucket exists
    const avatarsBucket = bucketList?.find(bucket => bucket.name === 'avatars')
    
    if (!avatarsBucket) {
      return NextResponse.json({ 
        error: 'Avatars bucket not found',
        availableBuckets: bucketList?.map(b => b.name) || []
      }, { status: 404 })
    }

    // Test listing files in avatars bucket
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 10 })

    if (listError) {
      console.error('Storage list error:', listError)
      return NextResponse.json({ 
        error: 'Failed to list files in avatars bucket',
        details: listError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Storage bucket working',
      bucketInfo: {
        name: avatarsBucket.name,
        public: avatarsBucket.public,
        fileCount: files?.length || 0
      },
      files: files?.slice(0, 5) || [] // Return first 5 files for debugging
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 