'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

interface FormData {
  password: string
  password_confirm: string
  email: string
}

interface FormErrors {
  password?: string
  password_confirm?: string
  email?: string
  submit?: string
}

export default function ProfileWizardStep1() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({
    password: '',
    password_confirm: '',
    email: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // پاک کردن خطای فیلد در صورت تغییر
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // بررسی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر نیست'
    }

    // بررسی رمز عبور
    if (formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد'
    }

    // بررسی تطابق رمز عبور
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'رمز عبور و تکرار آن مطابقت ندارند'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const waitForProfile = async (userId: string, maxAttempts = 5, delay = 1000): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error(`Error fetching profile on attempt ${attempt}:`, error)
          return false
        }

        if (profile) {
          console.log(`Profile found on attempt ${attempt}`)
          return true
        }

        if (attempt < maxAttempts) {
          console.log(`Profile not found on attempt ${attempt}, waiting ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`Error on attempt ${attempt}:`, error)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    return false
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // First, check if a profile already exists for this email
      // Use a more robust query to avoid 406 errors
      let existingProfile = null
      let checkError = null
      
      try {
        const result = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', formData.email.trim())
          .maybeSingle()
        
        existingProfile = result.data
        checkError = result.error
      } catch (error) {
        console.warn('Error in email check, continuing with signup...', error)
        // Continue with signup even if email check fails
      }

      if (checkError) {
        console.error('Error checking existing profile:', checkError)
        // Don't throw error for 406, just continue
        if (checkError.code === '406' || checkError.message?.includes('406')) {
          console.warn('Received 406 error, continuing with signup...')
        } else {
          throw checkError
        }
      }

      if (existingProfile) {
        setErrors(prev => ({
          ...prev,
          submit: 'این ایمیل قبلاً ثبت‌نام شده است.'
        }))
        setLoading(false)
        return
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      })

      if (error) throw error

      if (data?.user) {
        // Create initial profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: formData.email.trim(),
            is_complete: false
          }])

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // If it's a duplicate key error, try to fetch the profile
          if (profileError.code === '23505') {
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (fetchError) {
              throw fetchError
            }

            if (existingProfile) {
              console.log('Found existing profile:', existingProfile)
            }
          } else {
            throw profileError
          }
        }

        // Wait for profile to be available
        const profileAvailable = await waitForProfile(data.user.id)
        if (!profileAvailable) {
          console.error('Profile was not found after multiple attempts')
          throw new Error('خطا در ایجاد پروفایل. لطفاً دوباره تلاش کنید.')
        }

        // Show success message
        setErrors(prev => ({
          ...prev,
          submit: 'ایمیل تایید برای شما ارسال شد. لطفاً ایمیل خود را تایید کنید.'
        }))

        // Redirect to complete profile page after a short delay
        setTimeout(() => {
          router.push('/profile/complete')
        }, 2000)
      }
    } catch (error) {
      console.error('Error signing up:', error)
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.'
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            ایجاد حساب کاربری
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 max-w-sm mx-auto">
          <div className="rounded-md shadow-sm">
            <div className="mb-4 relative">
              <label htmlFor="email" className="sr-only">
                ایمیل
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-gray-800 max-w-sm mx-auto"
                placeholder="ایمیل"
                dir="ltr"
              />
            </div>
            <div className="mb-4 relative">
              <label htmlFor="password" className="sr-only">
                رمز عبور
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 bg-gray-800 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm max-w-sm mx-auto pr-10"
                placeholder="رمز عبور"
                dir="ltr"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <label htmlFor="password_confirm" className="sr-only">
                تکرار رمز عبور
              </label>
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-100 bg-gray-800 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm max-w-sm mx-auto pr-10"
                placeholder="تکرار رمز عبور"
                dir="ltr"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                aria-label={showPasswordConfirm ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {errors.email && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="mr-3">
                  <div className="text-sm text-red-700">{errors.email}</div>
                </div>
              </div>
            </div>
          )}

          {errors.password && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="mr-3">
                  <div className="text-sm text-red-700">{errors.password}</div>
                </div>
              </div>
            </div>
          )}

          {errors.password_confirm && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="mr-3">
                  <div className="text-sm text-red-700">{errors.password_confirm}</div>
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="mr-3">
                  <div className="text-sm text-red-700">{errors.submit}</div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 max-w-sm mx-auto"
          >
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>

        </form>
      </div>
    </div>
  )
} 