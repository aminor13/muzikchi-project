import ProfileSection from './ProfileSection'
import { Database } from '@/types/supabase'

type BaseProfile = Database['public']['Tables']['profiles']['Row']
type ProfileInstrument = Database['public']['Tables']['profile_instruments']['Row']

type Profile = BaseProfile & {
  performance_count?: 'lt10' | '10-30' | 'gt30'
  music_experience?: string
  equipments?: string
}

type SkillLevel = 'beginner' | 'intermediate' | 'advance' | 'professional'

// تابع تبدیل سطح مهارت به فارسی
function getSkillLevel(skill: SkillLevel): string {
  const skillLevels: Record<SkillLevel, string> = {
    'beginner': 'مبتدی',
    'intermediate': 'متوسط',
    'advance': 'پیشرفته',
    'professional': 'حرفه‌ای'
  }
  return skillLevels[skill] || skill
}

interface SpecialtiesProps {
  profile: Profile & {
    profile_instruments?: ProfileInstrument[]
  }
}

export default function Specialties({ profile }: SpecialtiesProps) {
  return (
    <>
      {profile.profile_instruments && profile.profile_instruments.length > 0 && (
        <ProfileSection title="مهارت‌های موسیقی">
          <div className="space-y-4">
            {profile.profile_instruments.map((instrument, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{instrument.instrument_id}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {getSkillLevel(instrument.skill as SkillLevel)}
                </span>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.performance_count || profile.music_experience) && (
        <ProfileSection title="تجربیات ">
          <div className="space-y-3">
            {profile.performance_count && (
              <div className="flex justify-between">
                <span className="text-gray-600">تعداد اجرا:</span>
                <span>
                  {profile.performance_count === 'lt10' ? 'کمتر از ۱۰ اجرا' :
                   profile.performance_count === '10-30' ? '۱۰ تا ۳۰ اجرا' :
                   'بیشتر از ۳۰ اجرا'}
                </span>
              </div>
            )}
            {profile.music_experience && (
              <div className="flex justify-between">
                <span className="text-gray-600">سابقه فعالیت در زمینه موسیقی:</span>
                <span>{profile.music_experience} سال</span>
              </div>
            )}
          </div>
        </ProfileSection>
      )}

      {profile.equipments && (
        <ProfileSection title="تجهیزات">
          <p className="text-gray-700 whitespace-pre-wrap">{profile.equipments}</p>
        </ProfileSection>
      )}
    </>
  )
} 