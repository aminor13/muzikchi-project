import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  type?: 'musician' | 'band' | 'business'
}

interface ProfileHeaderProps {
  profile: Profile
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Hero Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      
      {/* Profile Header */}
      <div className="relative px-8 pb-8">
        {/* Avatar */}
        <div className="absolute -top-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-3xl">
                {profile.display_name?.[0].toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="ml-44 pt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile.show_name ? profile.name : profile.display_name}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {profile.category === 'individual' ? 'موزیسین' : 'کسب‌وکار موسیقی'}
            </span>
            {profile.city && profile.province && (
              <span className="text-gray-600">
                <span className="inline-block ml-1">📍</span>
                {profile.city}، {profile.province}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 