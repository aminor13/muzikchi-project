'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function TestUserPage() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error getting user:', error)
        setLoading(false)
        return
      }
      
      if (user) {
        setUserData({
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        })
      }
      
      setLoading(false)
    }
    
    checkUser()
  }, [])

  if (loading) {
    return <div className="p-8 text-white">در حال بارگذاری...</div>
  }

  if (!userData) {
    return <div className="p-8 text-white">کاربری یافت نشد</div>
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">اطلاعات کاربر</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {userData.id}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Email Confirmed At:</strong> {userData.email_confirmed_at || 'null'}</p>
        <p><strong>Created At:</strong> {userData.created_at}</p>
        <p><strong>Last Sign In At:</strong> {userData.last_sign_in_at}</p>
        <p><strong>Email Confirmed:</strong> {userData.email_confirmed_at ? 'بله' : 'خیر'}</p>
      </div>
    </div>
  )
} 