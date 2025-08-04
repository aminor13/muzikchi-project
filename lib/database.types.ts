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
          created_at: string
          updated_at: string
          stage_name: string | null
          primary_instrument: string | null
          avatar_url: string | null
          bio: string | null
          performance_count: number | null
          music_experience: number | null
          equipments: string[] | null
          first_name: string | null
          last_name: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          stage_name?: string | null
          primary_instrument?: string | null
          avatar_url?: string | null
          bio?: string | null
          performance_count?: number | null
          music_experience?: number | null
          equipments?: string[] | null
          first_name?: string | null
          last_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          stage_name?: string | null
          primary_instrument?: string | null
          avatar_url?: string | null
          bio?: string | null
          performance_count?: number | null
          music_experience?: number | null
          equipments?: string[] | null
          first_name?: string | null
          last_name?: string | null
        }
      }
      school_teachers: {
        Row: {
          id: string
          school_id: string
          teacher_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'requested'
          role: 'teacher' | 'admin'
          rejected_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          teacher_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'requested'
          role?: 'teacher' | 'admin'
          rejected_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          teacher_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'requested'
          role?: 'teacher' | 'admin'
          rejected_by?: string | null
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