'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types/profile'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  profile: Profile | null
  loading: boolean
  error: string | null
  updateProfile: (profile: Partial<Profile>) => Promise<void>
  updateUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          if (authError.message.includes('Auth session missing')) {
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }
          throw authError
        }
        
        setUser(user)

        if (user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Error fetching profile:', profileError)
            setProfile(null)
          } else {
            setProfile(data)
          }
        } else {
          setProfile(null)
        }
      } catch (error) {
        if (error instanceof Error && 
            !error.message.includes('Auth session missing') && 
            !error.message.toLowerCase().includes('email')) {
          console.error('Error fetching user:', error)
          setError('خطا در بارگذاری اطلاعات کاربر')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (!userError && user) {
          fetchUserAndProfile()
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
        .select()
        .single()

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : { id: user.id, ...updates } as Profile)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const updateUser = (newUser: User | null) => {
    setUser(newUser)
  }

  return (
    <UserContext.Provider value={{ user, setUser, profile, loading, error, updateProfile, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 