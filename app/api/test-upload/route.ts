import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'User must be logged in to upload files'
      }, { status: 401 })
    }

    // Test creating a simple text file
    const testContent = 'This is a test file for storage bucket testing'
    const testFileName = `test-${Date.now()}.txt`
    const testFilePath = `${user.id}/${testFileName}`

    console.log('Testing upload with:', {
      userId: user.id,
      filePath: testFilePath,
      contentLength: testContent.length
    })

    // Try to upload a test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload test failed:', uploadError)
      return NextResponse.json({ 
        error: 'Upload test failed',
        details: uploadError.message,
        userId: user.id
      }, { status: 400 })
    }

    // Try to get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(testFilePath)

    // Clean up the test file
    await supabase.storage
      .from('avatars')
      .remove([testFilePath])

    return NextResponse.json({ 
      success: true,
      message: 'Upload test successful',
      uploadData,
      publicUrl,
      userId: user.id
    })
  } catch (error) {
    console.error('Unexpected error in upload test:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 