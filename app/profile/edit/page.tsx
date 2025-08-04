import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileForm from './EditProfileForm'
import { promises as fs } from 'fs'
import path from 'path'
import categoryRoles from '@/data/category_role.json'

export default async function EditProfilePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user's current profile data
  const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

  // Get provinces data
  const jsonDirectory = path.join(process.cwd(), 'public')
  const fileContents = await fs.readFile(jsonDirectory + '/data/province_city.json', 'utf8')
  const provincesData = JSON.parse(fileContents)

        // Transform provinces data
  const provinces = provincesData.map((province: any) => ({
          id: province['province-fa'],
          name: province['province-fa'],
          cities: province.cities.map((city: any) => ({
            id: city['city-fa'],
            name: city['city-fa'],
            province_id: province['province-fa']
          }))
        }))

  // Get category options from category_role.json
  const CATEGORY_OPTIONS = categoryRoles.map(item => ({
    value: item.key,
    label: item.label,
    roles: item.roles
  }))

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-gray-50 text-2xl font-bold mb-6">ویرایش پروفایل</h1>
        <EditProfileForm
          userId={user.id}
          initialProfile={profile}
          provinces={provinces}
          categoryOptions={CATEGORY_OPTIONS}
        />
      </div>
    </div>
  )
} 