'use client'

import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Province, City } from '@/types/profile'
import categoryRoles from '@/data/category_role.json'
import instrumentGroups from '@/data/instruments'
import CompleteProfileModal from '@/app/components/CompleteProfileModal'
import { useUser } from '@/context/userContext'
import { User as UserIcon, Wrench, MapPin, Music2 } from 'lucide-react'

interface CompleteProfileFormProps {
  userId: string
  initialProfile: Database['public']['Tables']['profiles']['Row'] | null
  provinces: Province[]
  categoryOptions: { value: string; label: string }[]
}

interface FormData {
  display_name: string
  name: string
  gender: 'male' | 'female' | 'mixed' | ''
  birth_year: string
  province: string
  city: string
  avatar_url: string
  description: string
  phone: string
  address: string
  category: 'person' | 'crew' | 'place' | 'band' | ''
  roles: string[]
}

const CATEGORY_OPTIONS = categoryRoles.map(item => ({
  value: item.key,
  label: item.label,
  description: item.description,
  roles: item.roles.map(r => r.value),
  icon: item.key === 'person' ? UserIcon : item.key === 'band' ? Music2 : Wrench,
}))

export default function CompleteProfileForm({ userId, initialProfile, provinces, categoryOptions }: CompleteProfileFormProps) {
  const supabase = createClient<Database>()
  const router = useRouter()
  const { profile, setProfile } = useUser()
  const [form, setForm] = useState<FormData>({
    display_name: '',
    name: '',
    gender: '',
    birth_year: '',
    province: '',
    city: '',
    avatar_url: '',
    description: '',
    phone: '',
    address: '',
    category: '',
    roles: [],
  })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (initialProfile) {
      setForm({
        display_name: initialProfile.display_name || '',
        name: initialProfile.name || '',
        gender: initialProfile.gender || '',
        birth_year: initialProfile.birth_year?.toString() || '',
        province: initialProfile.province || '',
        city: initialProfile.city || '',
        avatar_url: initialProfile.avatar_url || '',
        description: initialProfile.description || '',
        phone: initialProfile.phone || '',
        address: initialProfile.address || '',
        category: initialProfile.category || '',
        roles: initialProfile.roles || [],
      })
    }
  }, [initialProfile])

  // منطق جدید: هنگام تغییر دسته‌بندی، نقش "band" را به صورت خودکار به لیست نقش‌ها اضافه یا از آن حذف می‌کند
  useEffect(() => {
    if (form.category === 'band') {
      // اگر دسته‌بندی "band" باشد و هنوز در لیست نقش‌ها نباشد، آن را اضافه کن
      if (!form.roles.includes('band')) {
        setForm(prev => ({
          ...prev,
          roles: [...prev.roles, 'band']
        }));
      }
    } else {
      // اگر دسته‌بندی "band" نباشد و در لیست نقش‌ها باشد، آن را حذف کن
      if (form.roles.includes('band')) {
        setForm(prev => ({
          ...prev,
          roles: prev.roles.filter(role => role !== 'band')
        }));
      }
    }
  }, [form.category]);


  const getCities = () => {
    const selectedProvince = provinces.find(p => p.name === form.province)
    return selectedProvince ? selectedProvince.cities : []
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 2 * 1024 * 1024) {
        alert('حجم فایل باید کمتر از 2 مگابایت باشد.')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleFormChange = (key: keyof FormData, value: any) => {
    setForm(prev => {
      const newForm = { ...prev, [key]: value }

      if (key === 'category') {
        const selectedCategory = CATEGORY_OPTIONS.find(c => c.value === value)
        if (selectedCategory) {
          // اگر دسته‌بندی جدید نقش‌های مرتبط داشته باشد، آن نقش‌ها را جایگزین نقش‌های فعلی کن.
          // در غیر این صورت، لیست نقش‌ها را خالی کن.
          newForm.roles = selectedCategory.roles
        } else {
          newForm.roles = []
        }
      }

      if (key === 'province') {
        newForm.city = '' // Reset city when province changes
      }

      return newForm
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      let avatar_url = form.avatar_url
      if (file) {
        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const filePath = `${userId}/${Math.random()}.${fileExt}`
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        
        avatar_url = publicUrlData.publicUrl
        setUploading(false)
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name,
          name: form.name,
          gender: form.gender,
          birth_year: form.birth_year ? parseInt(form.birth_year) : null,
          province: form.province,
          city: form.city,
          avatar_url: avatar_url,
          description: form.description,
          phone: form.phone,
          address: form.address,
          category: form.category,
          roles: form.roles,
          is_complete: true,
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setProfile(data as any)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('خطا در ذخیره پروفایل. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-orange-400">تکمیل پروفایل</h2>
        <p className="text-gray-400 text-center mb-8">لطفا اطلاعات پروفایل خود را تکمیل کنید.</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* اطلاعات عمومی */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <UserIcon className="w-6 h-6 ml-2 text-orange-400" />
                اطلاعات عمومی
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-300">نام نمایشی (مورد استفاده در URL)</label>
                  <input
                    type="text"
                    id="display_name"
                    value={form.display_name}
                    onChange={(e) => handleFormChange('display_name', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300">نوع پروفایل</label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                    required
                  >
                    <option value="">یک گزینه را انتخاب کنید</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-300">جنسیت</label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => handleFormChange('gender', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                    <option value="mixed">مختلط</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="birth_year" className="block text-sm font-medium text-gray-300">سال تولد</label>
                  <input
                    type="number"
                    id="birth_year"
                    value={form.birth_year}
                    onChange={(e) => handleFormChange('birth_year', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                    min="1300" max="1403"
                  />
                </div>
              </div>
            </div>

            {/* اطلاعات تماس و مکان */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <MapPin className="w-6 h-6 ml-2 text-orange-400" />
                اطلاعات تماس و مکان
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">شماره تلفن</label>
                  <input
                    type="tel"
                    id="phone"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-300">استان</label>
                  <select
                    id="province"
                    value={form.province}
                    onChange={(e) => handleFormChange('province', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                    required
                  >
                    <option value="">استان را انتخاب کنید</option>
                    {provinces.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300">شهر</label>
                  <select
                    id="city"
                    value={form.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                    required
                    disabled={!form.province}
                  >
                    <option value="">شهر را انتخاب کنید</option>
                    {getCities().map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* توضیحات */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <Music2 className="w-6 h-6 ml-2 text-orange-400" />
                توضیحات و توانمندی‌ها
              </h3>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">توضیحات</label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm p-3 focus:border-orange-500 focus:ring-orange-500"
                ></textarea>
                <p className="mt-1 text-sm text-gray-400">توضیحات کوتاهی درباره خودتان یا گروهتان بنویسید.</p>
              </div>

              {/* Roles Checkboxes */}
              {form.category && form.category !== 'band' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300">نقش‌ها</label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {categoryRoles.find(cat => cat.key === form.category)?.roles.map(role => (
                      <label key={role.value} className="flex items-center text-gray-300">
                        <input
                          type="checkbox"
                          name="roles"
                          value={role.value}
                          checked={form.roles.includes(role.value)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...form.roles, e.target.value]
                              : form.roles.filter(r => r !== e.target.value);
                            handleFormChange('roles', newRoles);
                          }}
                          className="form-checkbox h-5 w-5 text-orange-600 bg-gray-600 rounded"
                        />
                        <span className="ml-2 text-sm">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* آپلود عکس پروفایل */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2 text-orange-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l1.5-1.5a1.125 1.125 0 011.5 0L7.5 17.25l-1.5 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                عکس پروفایل
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {form.avatar_url ? (
                    <img className="h-20 w-20 rounded-full object-cover" src={form.avatar_url} alt="Profile picture" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="avatar-upload" className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    {uploading ? 'در حال آپلود...' : 'انتخاب عکس'}
                    <input id="avatar-upload" type="file" className="sr-only" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-400">عکس باید مربعی باشد و حجم آن کمتر از 2 مگابایت باشد.</p>
              <p className="mt-2 text-sm text-orange-400">توجه: تا زمانی که عکس پروفایل آپلود نکنید، پروفایل شما در بخش اکسپلور نمایش داده نمی‌شود.</p>
            </div>
          </div>

          {/* دکمه ثبت */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploading ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>

        <CompleteProfileModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            router.push('/explore');
          }}
          title="پروفایل شما تکمیل شد!"
          message="شما می‌توانید پروفایل خود را در بخش اکسپلور مشاهده کنید."
        />
      </div>
    </div>
  )
}
