import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('Test upload API called')
    
    // Create admin client
    const supabaseAdmin = await createAdminClient()
    
    // Create a simple test file
    const testContent = 'This is a test file for upload testing'
    const testFileName = `test-${Date.now()}.txt`
    const testFilePath = `test/${testFileName}`

    console.log('Test file path:', testFilePath)

    // Upload test file to avatars bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: true
      })

    if (uploadError) {
      console.error('Test upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Test upload failed',
        details: uploadError.message
      }, { status: 500 })
    }

    console.log('Test upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(testFilePath)

    console.log('Test public URL:', publicUrl)

    // Clean up test file
    await supabaseAdmin.storage
      .from('avatars')
      .remove([testFilePath])

    return NextResponse.json({ 
      success: true,
      message: 'Test upload successful',
      url: publicUrl,
      path: testFilePath
    })

  } catch (error) {
    console.error('Test upload unexpected error:', error)
    return NextResponse.json({ 
      error: 'Test upload unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 