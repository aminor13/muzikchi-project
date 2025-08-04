'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function deleteProfile() {
  try {
    console.log('Starting profile deletion action...')
    
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing required environment variables')
      throw new Error('متغیرهای محیطی Supabase تنظیم نشده‌اند')
    }

    console.log('Creating Supabase client...')
    const supabase = await createClient()

    console.log('Getting cookies...')
    // Get cookies and convert to string properly
    const cookieStore = await cookies()
    const cookieString = cookieStore.getAll()
      .map((cookie: RequestCookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')
    
    // Get the base URL from headers
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process?.env?.NODE_ENV === 'development' ? 'http' : 'https'
    
    console.log('Sending delete request to API...')
    // Use absolute URL for the API endpoint
    const response = await fetch(`${protocol}://${host}/api/profile/delete`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Cookie: cookieString,
      },
    })

    console.log('Parsing API response...')
    const data = await response.json()

    if (!response.ok) {
      console.error('API deletion error:', data.error)
      throw new Error(data.error || 'خطا در حذف پروفایل')
    }

    console.log('Verifying profile deletion...')
    // Double check deletion with direct Supabase client
    const { data: profile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (checkError) {
      console.log('Error checking profile:', checkError)
    }

    if (profile) {
      console.error('Profile still exists after deletion')
      throw new Error('خطا در حذف پروفایل - پروفایل هنوز وجود دارد')
    }

    console.log('Signing out...')
    // Sign out from server side
    await supabase.auth.signOut()
    
    console.log('Profile deletion completed successfully')
    return { success: true, redirect: '/' }
  } catch (error) {
    console.error('Delete profile error:', error)
    return { error: error instanceof Error ? error.message : 'خطا در حذف پروفایل' }
  }
} 

// تابع تست برای حذف یک فایل از یک باکت خاص
export async function testDeleteFromBucket(bucket: string, path: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('خطا در حذف فایل:', error);
      return { success: false, error: error.message };
    }
    console.log('فایل با موفقیت حذف شد');
    return { success: true };
  } catch (err) {
    console.error('خطای غیرمنتظره:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
} 