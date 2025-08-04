export type Profile = {
  id: string
  display_name: string
  name: string
  email: string
  phone: string | null
  description: string | null
  address: string | null
  instagram: string | null
  birth_year: string | null
  gender: 'male' | 'female' | null
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
  website: string
  social_links: { telegram?: string; youtube?: string }
}

export interface ProfileFormData {
  type: string
  first_name: string
  last_name: string
  gender: string
  birth_year: string
  province: string
  city: string
  avatar_url: string
  address: string
  phone: string
  instagram: string
  equipments: string
  performance_count: string
  music_experience: string
  description: string
  website: string
  social_links: { telegram?: string; youtube?: string }
}

export interface Video {
  id?: string
  title: string
  url: string
  description: string
}

export interface Province {
  id: string
  name: string
  cities: City[]
}

export interface City {
  id: string
  name: string
  province_id: string
} 