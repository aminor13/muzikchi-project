import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Test if we can create admin client
    const supabaseAdmin = await createAdminClient()
    
    // Test if we can list buckets
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketError) {
      console.error('Bucket list error:', bucketError)
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketError.message
      }, { status: 500 })
    }

    // Check if avatars bucket exists
    const avatarsBucket = buckets?.find(b => b.name === 'avatars')
    
    if (!avatarsBucket) {
      return NextResponse.json({ 
        error: 'Avatars bucket not found',
        availableBuckets: buckets?.map(b => b.name) || []
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin client working',
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      avatarsBucket: {
        name: avatarsBucket.name,
        public: avatarsBucket.public
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 