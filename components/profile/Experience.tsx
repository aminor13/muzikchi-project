import ProfileSection from './ProfileSection'
import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  performance_count?: 'lt10' | '10to50' | 'gt50'
}

interface ExperienceProps {
  profile: Profile
}

export default function Experience({ profile }: ExperienceProps) {
  if (!profile.description && !profile.performance_count) return null;

  return (
    <ProfileSection title="توضیحات و تجربیات">
      {profile.description && (
        <div className="mb-6">
          <h4 className="text-gray-600 mb-2">درباره:</h4>
          <p className="text-gray-700 leading-relaxed">
            {profile.description}
          </p>
        </div>
      )}

      {profile.performance_count && (
        <div>
          <h4 className="text-gray-600 mb-2">تعداد اجراها:</h4>
          <span className="text-gray-700">
            {profile.performance_count === 'lt10' ? 'کمتر از ۱۰ اجرا' :
             profile.performance_count === '10to50' ? 'بین ۱۰ تا ۵۰ اجرا' :
             profile.performance_count === 'gt50' ? 'بیش از ۵۰ اجرا' :
             profile.performance_count}
          </span>
        </div>
      )}
    </ProfileSection>
  )
} 