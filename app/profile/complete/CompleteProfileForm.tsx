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
  roles: item.roles
}))

// سطح مهارت‌ها
const SKILL_LEVELS = [
  { value: 'beginner', label: 'مبتدی' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'پیشرفته' },
  { value: 'professional', label: 'حرفه‌ای' }
]

function CategorySelection({ onSelect, selectedCategory, categoryOptions }: { 
  onSelect: (category: 'person' | 'crew' | 'place' | 'band') => void, 
  selectedCategory: string,
  categoryOptions: { value: string; label: string }[]
}) {
  const ICON_MAP: Record<string, ComponentType<any>> = {
    person: UserIcon,
    crew: Wrench,
    place: MapPin,
    band: Music2,
  }

  return (
    <div className="mb-8 bg-gray-800">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 bg-gray-800">
        {categoryOptions.map(option => {
          const Icon = ICON_MAP[option.value] || UserIcon
          const rolesForCategory = CATEGORY_OPTIONS.find(c => c.value === option.value)?.roles || []
          const isSelected = selectedCategory === option.value
          return (
            <div key={option.value} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onSelect(option.value as 'person' | 'crew' | 'place' | 'band')}
                title={option.label}
                aria-pressed={isSelected}
                className={`${isSelected ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'} w-full flex items-center justify-center rounded-md py-3 sm:py-4`}
              >
                <Icon className="w-8 h-8" />
                <span className="sr-only">{option.label}</span>
              </button>
              {!selectedCategory && rolesForCategory.length > 0 && (
                <div className="mt-2 text-xs text-gray-300 text-center leading-5">
                  {rolesForCategory.map((role: any) => (
                    <div key={role.value}>{role.label}</div>
                  ))}
                </div>
              )}
              {!selectedCategory && rolesForCategory.length === 0 && option.value === 'band' && (
                <div className="mt-2 text-xs text-gray-300 text-center leading-5">گروه موسیقی</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CompleteProfileForm({ userId, initialProfile, provinces, categoryOptions }: CompleteProfileFormProps) {
  console.log('CompleteProfileForm rendered with:', { userId, initialProfile, provinces, categoryOptions });
  
  const { updateUser } = useUser()
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
    roles: []
  })

  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // state برای سازهای نوازنده
  const [musicianInstruments, setMusicianInstruments] = useState<{ instrument: string, skill: string }[]>([])
  // state برای سازهای مدرس
  const [teacherInstruments, setTeacherInstruments] = useState<string[]>([])
  // state برای نمایش منوی افزودن ساز
  const [showAddInstrument, setShowAddInstrument] = useState<'musician' | 'teacher' | null>(null)
  // state برای انتخاب موقت ساز و مهارت
  const [selectedInstrument, setSelectedInstrument] = useState<string>('')
  const [selectedSkill, setSelectedSkill] = useState<string>('beginner')

  // لاگ مقدار category برای دیباگ
  //console.log('form.category:', form.category)

  const [instrumentsLoaded, setInstrumentsLoaded] = useState(false);

  // اضافه کردن state برای مودال
  const [showModal, setShowModal] = useState(false)

  // Initialize form with existing profile data
  useEffect(() => {
    if (initialProfile && instrumentsLoaded) {
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
        category: (['person','crew','place','band'].includes(initialProfile.category as string) ? initialProfile.category as 'person' | 'crew' | 'place' | 'band' : ''),
        roles: initialProfile.roles || []
      });
      // اینجا نیازی به setMusicianInstruments و setTeacherInstruments نیست چون بالا انجام شد
    }
  }, [initialProfile, instrumentsLoaded]);

  // Debug form state
  useEffect(() => {
    console.log('Form state changed:', {
      category: form.category,
      roles: form.roles,
      display_name: form.display_name,
      name: form.name,
      province: form.province,
      city: form.city,
      gender: form.gender
    });
  }, [form]);

  useEffect(() => {
    const fetchInstruments = async () => {
      const { data, error } = await supabase
        .from('profile_instruments')
        .select('*')
        .eq('profile_id', userId);

      if (!error && data) {
        setMusicianInstruments(data.filter((i: any) => i.type === 'musician').map((i: any) => ({
          instrument: i.instrument_id,
          skill: i.skill
        })));
        setTeacherInstruments(data.filter((i: any) => i.type === 'teacher').map((i: any) => i.instrument_id));
        setInstrumentsLoaded(true);
      }
    };
    if (userId) fetchInstruments();
  }, [userId]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProvince = e.target.value
    setForm(prev => ({ ...prev, province: selectedProvince, city: '' }))
    
    if (selectedProvince) {
      const provinceCities = provinces.find(p => p.id === selectedProvince)?.cities || []
      setCities(provinceCities)
    } else {
      setCities([])
    }
  }

  const validateDisplayName = (value: string) => {
    if (!value) {
      setDisplayNameError('نام کاربری الزامی است')
      return false
    }
    if (value.includes(' ')) {
      setDisplayNameError('نام کاربری نمی‌تواند شامل فاصله باشد')
      return false
    }
    if (!/^[a-zA-Z0-9._]+$/.test(value)) {
      setDisplayNameError('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، نقطه و زیرخط باشد')
      return false
    }
    if (value.length < 3 || value.length > 30) {
      setDisplayNameError('نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد')
      return false
    }
    setDisplayNameError(null)
    return true
  }

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setForm(prev => ({ ...prev, display_name: value }))
    validateDisplayName(value)
  }

  const validateForm = () => {
    let valid = true
    setError(null)

    // اعتبارسنجی نام کاربری
    if (!form.display_name) {
      setError('نام کاربری الزامی است')
      valid = false
    } else if (form.display_name.includes(' ')) {
      setError('نام کاربری نمی‌تواند شامل فاصله باشد')
      valid = false
    } else if (!/^[a-zA-Z0-9._]+$/.test(form.display_name)) {
      setError('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، نقطه و زیرخط باشد')
      valid = false
    } else if (form.display_name.length < 3 || form.display_name.length > 30) {
      setError('نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد')
      valid = false
    }

    // اعتبارسنجی نام (فقط حروف فارسی و فاصله)
    if (form.name && !/^[\u0600-\u06FF\s]+$/.test(form.name)) {
      setError('نام فقط باید شامل حروف فارسی باشد')
      valid = false
    }

    // اعتبارسنجی توضیحات (حداکثر ۵۰۰ کاراکتر)
    if (form.description && form.description.length > 500) {
      setError('توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد')
      valid = false
    }

    // اعتبارسنجی انتخاب دسته‌بندی
    if (!form.category) {
      setError('لطفاً یک دسته‌بندی انتخاب کنید')
      valid = false
    }

    if (!form.roles || form.roles.length === 0) {
      // For 'band' category, roles are not required
      if (form.category !== 'band') {
        setError('لطفاً حداقل یک نقش انتخاب کنید')
        valid = false
      }
    }

    return valid
  }

  // استخراج لیست سازها (flat)
  const allInstruments = instrumentGroups.flatMap(group =>
    group.instruments ? group.instruments :
      group.subgroups ? group.subgroups.flatMap(sub => sub.instruments) : []
  )

  // آیا نقش musician انتخاب شده؟
  const isMusician = form.roles.includes('musician')
  // آیا نقش teacher انتخاب شده؟
  const isTeacher = form.roles.includes('teacher')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('handleSubmit started')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('کاربر یافت نشد')

      console.log('Current user:', user.id)

      // Validate form using validateForm function
      if (!validateForm()) {
        setLoading(false)
        return
      }

      // Validate required fields
      if (!form.display_name || !form.name || !form.province || !form.city || !form.category) {
        setError('لطفاً همه فیلدهای ضروری را پر کنید')
        setLoading(false)
        return
      }

      // Ensure gender is set for non-place categories
      if (form.category !== 'place' && !form.gender) {
        setError('لطفاً جنسیت را انتخاب کنید')
        setLoading(false)
        return
      }

      console.log('Validation passed, preparing data...')

      // Clean and prepare the data
      const updateData = {
        id: user.id,
        email: user.email,
        display_name: form.display_name.trim(),
        name: form.name.trim(),
        gender: form.category === 'place' ? null : form.gender,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        province: form.province,
        city: form.city,
        avatar_url: form.avatar_url || null,
        description: form.description?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        category: form.category,
        roles: Array.isArray(form.roles) ? form.roles : [],
        is_complete: true,
        updated_at: new Date().toISOString()
      }

      console.log('Update data prepared:', updateData)

      // First try to get the existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching existing profile:', fetchError)
        throw new Error('خطا در بازیابی پروفایل')
      }

      console.log('Existing profile check completed')

      // Always use upsert instead of trying to determine insert vs update
      const { data, error } = await supabase
        .from('profiles')
        .upsert(updateData)
        .select()

      console.log('Profile operation response:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '23505' && error.message && error.message.includes('display_name')) {
          setError('این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.');
        } else {
          setError(`خطا در ذخیره پروفایل: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('Profile saved successfully')

      // Handle instruments only if profile update was successful
      if (data) {
        console.log('Handling instruments...')
        
        // Delete existing instruments
        await supabase
          .from('profile_instruments')
          .delete()
          .eq('profile_id', user.id);

        // Insert musician instruments if any
        if (isMusician && musicianInstruments.length > 0) {
          const { error: musicianError } = await supabase
            .from('profile_instruments')
            .insert(
              musicianInstruments.map(item => ({
                profile_id: user.id,
                instrument_id: item.instrument,
                skill: item.skill,
                type: 'musician'
              }))
            );

          if (musicianError) {
            console.error('Musician insert error:', musicianError);
            setError('خطا در ذخیره سازهای نوازنده');
            return;
          }
        }

        // Insert teacher instruments if any
        if (isTeacher && teacherInstruments.length > 0) {
          const { error: teacherError } = await supabase
            .from('profile_instruments')
            .insert(
              teacherInstruments.map(inst => ({
                profile_id: user.id,
                instrument_id: inst,
                skill: null,
                type: 'teacher'
              }))
            );

          if (teacherError) {
            console.error('Teacher insert error:', teacherError);
            setError('خطا در ذخیره سازهای مدرس');
            return;
          }
        }

        console.log('Instruments handled successfully')

        // Update user state to trigger re-render of header
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          updateUser(currentUser)
        }

        console.log('User state updated')

        // Show success modal
        setShowModal(true);
        console.log('Success modal shown')
      }
      
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('خطا در ذخیره پروفایل')
    } finally {
      setLoading(false)
      console.log('handleSubmit completed')
    }
  }

  if (loading) {
    return <div className="text-center text-gray-100 py-8">در حال بارگذاری...</div>
  }

  if (!form.category) {
    return (
      <div className="max-w-4xl mx-auto p-6  bg-gray-800 rounded-lg shadow-sm">
        <CategorySelection 
          onSelect={(category) => setForm(prev => ({ ...prev, category, gender: '', roles: [] }))}
          selectedCategory={form.category}
          categoryOptions={categoryOptions}
        />
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-sm">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <CategorySelection 
          onSelect={(category) => setForm(prev => ({ ...prev, category, gender: '', roles: [] }))}
          selectedCategory={form.category}
          categoryOptions={categoryOptions}
        />

        <div className="mt-8 space-y-6">
          {/* انتخاب نقش‌ها */}
          {form.category && form.category !== 'band' && (
            <div>
              {(() => {
                const categoryRoles = CATEGORY_OPTIONS.find(c => c.value === form.category)?.roles;
                if (!categoryRoles || categoryRoles.length === 0) return null;
                
                return (
                  <div className="flex flex-wrap gap-4">
                    {categoryRoles.map(role => (
                      <label key={role.value} className="text-gray-100 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.roles?.includes(role.value)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setForm(prev => ({
                              ...prev,
                              roles: checked
                                ? [...(prev.roles || []), role.value]
                                : (prev.roles || []).filter(r => r !== role.value)
                            }))
                          }}
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          {form.category === 'band' && (
            <div>
              <div className="flex flex-wrap gap-4">
                <span className="text-gray-100 flex items-center gap-2">گروه موسیقی</span>
              </div>
            </div>
          )}
          {/* فیلدهای مشترک و شرطی */}
          <div className="space-y-8">
            {/* اطلاعات شخصی */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-100 border-b border-gray-700 pb-2">اطلاعات شخصی</h3>
              {/* نام کاربری (نمایشی) */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">نام کاربری <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={handleDisplayNameChange}
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  required
                  dir="ltr"
                />
                {displayNameError && (<p className="mt-1 text-sm text-red-600">{displayNameError}</p>)}
              </div>
              {/* نام */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">نام <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  required
                />
                {nameError && <p className="text-red-600 text-sm">{nameError}</p>}
              </div>
              {/* جنسیت - فقط برای غیر مکان/فضا */}
              {form.category !== 'place' && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">جنسیت <span className="text-red-500">*</span></label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'mixed' | '' }))}
                    className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {form.category?.toLowerCase() === 'band' ? (
                      <>
                        <option value="male">آقایان</option>
                        <option value="female">خانم‌ها</option>
                        <option value="mixed">مختلط</option>
                      </>
                    ) : (
                      <>
                        <option value="male">مرد</option>
                        <option value="female">زن</option>
                      </>
                    )}
                  </select>
                </div>
              )}
              {/* سال تولد - فقط برای غیر مکان/فضا و غیر گروه موسیقی */}
              {form.category !== 'place' && form.category !== 'band' && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">سال تولد</label>
                  <select
                    value={form.birth_year}
                    onChange={e => setForm(prev => ({ ...prev, birth_year: e.target.value }))}
                    className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  >
                    <option value="">انتخاب کنید</option>
                    {Array.from({ length: 1403 - 1300 + 1 }, (_, i) => {
                      const year = 1403 - i;
                      return (<option key={year} value={year}>{year}</option>);
                    })}
                  </select>
                </div>
              )}
              {/* استان */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">استان <span className="text-red-500">*</span></label>
                <select
                  value={form.province}
                  onChange={handleProvinceChange}
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  {provinces.map((province) => (<option key={province.id} value={province.id}>{province.name}</option>))}
                </select>
              </div>
              {/* شهر */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">شهر <span className="text-red-500">*</span></label>
                <select
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  required
                  disabled={!form.province}
                >
                  <option value="">انتخاب کنید</option>
                  {cities.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
                </select>
              </div>
              {/* توضیحات */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="text-white w-full rounded-md border border-gray-500 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-800"
                  rows={4}
                />
                {descriptionError && <p className="text-red-600 text-sm">{descriptionError}</p>}
              </div>
              {/* عکس پروفایل */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">عکس پروفایل</label>
                <div className="flex items-center gap-4">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="پروفایل"
                      className="h-20 w-20 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Check file size (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          setError('حجم عکس باید کمتر از ۲ مگابایت باشد');
                          return;
                        }

                        // Check file type
                        if (!file.type.startsWith('image/')) {
                          setError('لطفاً یک فایل عکس انتخاب کنید');
                          return;
                        }

                        setAvatarUploading(true);
                        try {
                          console.log('Starting upload for file:', file.name, file.size, file.type);
                          
                          // Delete previous avatar if exists
                          if (form.avatar_url) {
                            console.log('Deleting previous avatar:', form.avatar_url);
                            try {
                              // Extract file path from URL
                              const urlParts = form.avatar_url.split('/storage/v1/object/public/avatars/');
                              if (urlParts.length > 1) {
                                const filePath = urlParts[1];
                                const response = await fetch(`/api/delete-avatar?path=${filePath}`);
                                const result = await response.json();
                                if (!response.ok) {
                                  throw new Error(result.error || 'خطا در حذف عکس قبلی');
                                }
                                console.log('Previous avatar deleted:', filePath);
                              }
                            } catch (deleteError) {
                              console.warn('Error deleting previous avatar:', deleteError);
                              // Continue with upload even if delete fails
                            }
                          }
                          
                          // Use the new API route for upload
                          const formData = new FormData();
                          formData.append('file', file);

                          console.log('FormData created, sending request...');

                          const response = await fetch('/api/upload-avatar', {
                            method: 'POST',
                            body: formData,
                          });

                          console.log('Response received:', response.status, response.statusText);

                          const result = await response.json();
                          console.log('Response JSON:', result);

                          if (!response.ok) {
                            throw new Error(result.error || 'خطا در آپلود عکس');
                          }

                          // Update the form state with the new avatar URL
                          setForm(prev => ({ ...prev, avatar_url: result.url }));
                          setError(null); // Clear any previous errors
                          console.log('Upload successful, URL:', result.url);
                        } catch (error) {
                          console.error('Error uploading avatar:', error);
                          setError(`خطا در آپلود عکس: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
                        } finally {
                          setAvatarUploading(false);
                        }
                      }}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      onClick={(e) => {
                        // Only prevent form submission, allow file selection
                        e.stopPropagation();
                      }}
                      className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-orange-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      {avatarUploading ? 'در حال آپلود...' : 'انتخاب عکس'}
                    </label>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-400">عکس باید مربعی باشد و حجم آن کمتر از 2 مگابایت باشد.</p>
              </div>
            </div>
          </div>

          {/* دکمه ثبت */}
          <div className="flex justify-end">
            {(() => {
              const isDisabled = !form.category || loading || (form.category !== 'band' && (!form.roles || form.roles.length === 0));
              console.log('Button disabled check:', {
                category: form.category,
                loading,
                roles: form.roles,
                rolesLength: form.roles?.length,
                isDisabled
              });
              return (
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              );
            })()}
          </div>
        </div>
      </form>


      <CompleteProfileModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
      />
    </>
  )
}