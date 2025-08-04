import ProfileSection from './ProfileSection'
import { Database } from '@/types/supabase'

function calculateAge(birthYear: string | null): number | null {
  if (!birthYear) return null;
  
  // تبدیل سال شمسی به میلادی
  // با فرض اینکه اختلاف تقریبی 622 سال است
  const gregorianYear = parseInt(birthYear) + 622;
  const currentYear = new Date().getFullYear();
  
  // محاسبه سن
  const age = currentYear - gregorianYear;
  
  // برگرداندن سن اگر عدد منطقی باشد
  return age >= 0 && age < 120 ? age : null;
}

interface PersonalInfoProps {
  profile: Database['public']['Tables']['profiles']['Row']
}

export default function PersonalInfo({ profile }: PersonalInfoProps) {
  const age = calculateAge(profile.birth_year);

  return (
    <ProfileSection title="اطلاعات شخصی">
      <div className="space-y-3">
        {profile.gender && (
          <div className="flex justify-between">
            <span className="text-gray-600">جنسیت:</span>
            <span>
              {profile.gender === 'male' ? 'مرد' : 
               profile.gender === 'female' ? 'زن' : 
               profile.gender === 'mixed' ? 'مختلط' :
               'نامشخص'}
            </span>
          </div>
        )}
        {age && (
          <div className="flex justify-between">
            <span className="text-gray-600">سن:</span>
            <span>{age} سال</span>
          </div>
        )}
      </div>
    </ProfileSection>
  )
} 