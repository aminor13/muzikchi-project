import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('Upload gallery API called')

    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        error: 'Authentication required',
        details: 'User must be logged in to upload gallery images'
      }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided')
      return NextResponse.json({
        error: 'No file provided',
        details: 'Please select a file to upload'
      }, { status: 400 })
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json({
        error: 'Invalid file type',
        details: 'Please upload an image file'
      }, { status: 400 })
    }

    // Validate file size (10MB limit for gallery)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size)
      return NextResponse.json({
        error: 'File too large',
        details: 'File size must be less than 10MB'
      }, { status: 400 })
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    console.log('File path:', filePath)

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = await createAdminClient()

    console.log('Admin client created, attempting upload...')

    // Upload file using admin client to gallery bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        error: 'Upload failed',
        details: uploadError.message
      }, { status: 500 })
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('gallery')
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
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