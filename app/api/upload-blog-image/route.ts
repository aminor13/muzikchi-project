import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Basic validations
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${user.id}/featured/${fileName}`

    // Convert to Buffer for stable upload
    const ab = await file.arrayBuffer()
    const buffer = Buffer.from(ab)

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, buffer, {
        cacheControl: '31536000',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath)

    return NextResponse.json({ success: true, url: publicUrl, path: filePath })
  } catch (e) {
    console.error('upload-blog-image error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
