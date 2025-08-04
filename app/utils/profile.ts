'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkProfile(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, is_admin, is_complete')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking profile:', error)
      return { profile: null, error }
    }

    return { profile: data, error: null }
  } catch (error) {
    console.error('Error in checkProfile:', error)
    return { profile: null, error }
  }
} 