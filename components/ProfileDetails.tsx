import { Database } from '@/types/supabase'

interface Instrument {
  instrument: string
  experience_level: string
}

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  type?: 'musician' | 'band' | 'business'
  music_experience?: string
}

interface ProfileDetailsProps {
  profile: Profile
  instruments: Instrument[]
}

export default function ProfileDetails({ profile, instruments }: ProfileDetailsProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>{profile.show_name ? profile.name : profile.display_name}</h2>
      <p><strong>نوع:</strong> {profile.type === 'musician' ? 'موزیسین' :
                               profile.type === 'band' ? 'گروه موسیقی' :
                               'کسب‌وکار موسیقی'}</p>
      <p><strong>جنسیت:</strong> {profile.gender === 'male' ? 'مرد' :
                                 profile.gender === 'female' ? 'زن' :
                                 'گروه'}</p>
      <p><strong>محل سکونت:</strong> {profile.city}، {profile.province}</p>
      <p><strong>سال تولد:</strong> {profile.birth_year}</p>
      {profile.music_experience && (
        <p><strong>سابقه موسیقی:</strong> {profile.music_experience} سال</p>
      )}
      {profile.description && (
        <p><strong>توضیحات:</strong><br />{profile.description}</p>
      )}

      {instruments.length > 0 && (
        <>
          <h3>سازها</h3>
          <ul>
            {instruments.map((item, i) => (
              <li key={i}>
                {item.instrument} ({item.experience_level})
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
} 