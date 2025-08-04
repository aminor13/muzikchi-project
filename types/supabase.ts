export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          name: string
          email: string
          phone: string | null
          description: string | null
          address: string | null
          instagram: string | null
          birth_year: string | null
          gender: 'male' | 'female' | 'mixed' | null
          province: string | null
          city: string | null
          avatar_url: string | null
          instruments: string[] | null
          genres: string[] | null
          is_complete: boolean
          is_verified: boolean
          verification_token: string | null
          verification_token_expires_at: string | null
          reset_token: string | null
          reset_token_expires_at: string | null
          updated_at: string
          category: 'individual' | 'business'
          roles: string[] | null
          show_name: boolean
        }
        Insert: {
          id: string
          display_name: string
          name: string
          email: string
          phone?: string | null
          description?: string | null
          address?: string | null
          instagram?: string | null
          birth_year?: string | null
          gender?: 'male' | 'female' | 'mixed' | null
          province?: string | null
          city?: string | null
          avatar_url?: string | null
          instruments?: string[] | null
          genres?: string[] | null
          is_complete?: boolean
          is_verified?: boolean
          verification_token?: string | null
          verification_token_expires_at?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          updated_at?: string
          category: 'individual' | 'business'
          roles?: string[] | null
          show_name?: boolean
        }
        Update: {
          id?: string
          display_name?: string
          name?: string
          email?: string
          phone?: string | null
          description?: string | null
          address?: string | null
          instagram?: string | null
          birth_year?: string | null
          gender?: 'male' | 'female' | 'mixed' | null
          province?: string | null
          city?: string | null
          avatar_url?: string | null
          instruments?: string[] | null
          genres?: string[] | null
          is_complete?: boolean
          is_verified?: boolean
          verification_token?: string | null
          verification_token_expires_at?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          updated_at?: string
          category?: 'individual' | 'business'
          roles?: string[] | null
          show_name?: boolean
        }
      }
      profile_instruments: {
        Row: {
          id: string
          profile_id: string
          instrument_id: string
          skill: 'beginner' | 'intermediate' | 'advance' | 'professional'
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          instrument_id: string
          skill: 'beginner' | 'intermediate' | 'advance' | 'professional'
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          instrument_id?: string
          skill?: 'beginner' | 'intermediate' | 'advance' | 'professional'
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          profile_id: string
          url: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          url: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          url?: string
          title?: string
          description?: string | null
          created_at?: string
        }
      }
      band_members: {
        Row: {
          id: string
          band_id: string
          member_id: string
          status: 'pending' | 'accepted' | 'rejected'
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          band_id: string
          member_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          band_id?: string
          member_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Province = {
  id: string
  name: string
}

export type City = {
  id: string
  name: string
  province_id: string
} 