'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import date from 'jalali-convertor'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import './TimePicker.css'
import PersianDatePicker from '@/app/components/PersianDatePicker'
import provinceCityData from '@/data/province_city.json'

// --- تغییرات در اینجا اعمال شده است ---

// اضافه کردن نسبت‌های رایج عمودی (4:5) و مربعی (1:1)
// 16/9 = 1.77
// 4/3 = 1.33
// 1/1 = 1 (مربعی)
// 4/5 = 0.8 (عمودی - پست اینستاگرام)
// 9/16 = 0.5625 (عمودی - استوری اینستاگرام)
const POSTER_ASPECT_RATIOS = [16 / 9, 4 / 3, 1 / 1, 4 / 5, 9 / 16] 

// --- پایان تغییرات ---

interface EventFormProps {
  userId: string;
  displayName?: string;
  initialData?: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    description: string;
    ticket_price?: number;
    capacity?: number;
    poster_url?: string;
    ticket_link?: string;
    province?: string;
    city?: string;
  };
}

export default function EventForm({ userId, initialData }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const posterFileRef = useRef<File | null>(null)

  // Form field states
  const [title, setTitle] = useState(initialData?.title || '')
  const [time, setTime] = useState(initialData?.time || '')
  const [venue, setVenue] = useState(initialData?.venue || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [ticketPrice, setTicketPrice] = useState(initialData?.ticket_price?.toString() || '')
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '')
  const [ticketLink, setTicketLink] = useState(initialData?.ticket_link || '')
  const [province, setProvince] = useState(initialData?.province || '')
  const [city, setCity] = useState(initialData?.city || '')

  // Set initial values when editing
  useEffect(() => {
    if (initialData?.date) {
      const gregorianDate = new Date(initialData.date)
      const jalaliDate = date.g2j(
        gregorianDate.getFullYear(),
        gregorianDate.getMonth() + 1,
        gregorianDate.getDate()
      )
      setSelectedDay({
        year: jalaliDate[0],
        month: jalaliDate[1],
        day: jalaliDate[2]
      })
      if (initialData.poster_url) {
        setPosterPreview(initialData.poster_url)
      }
    }
    if (initialData?.province) setProvince(initialData.province)
    if (initialData?.city) setCity(initialData.city)
  }, [initialData])

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
      img.onload = () => {
        const aspectRatio = img.width / img.height
        // تلرانس (0.05) برای جلوگیری از خطاهای کوچک در نسبت ابعاد
        const isValidRatio = POSTER_ASPECT_RATIOS.some(ratio => Math.abs(aspectRatio - ratio) < 0.05)
        URL.revokeObjectURL(objectUrl)
        resolve(isValidRatio)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(false)
      }
    })
  }

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      
      // --- تغییرات در اینجا اعمال شده است ---
      
      // فعلاً از اعتبارسنجی ابعاد صرف نظر می‌کنیم تا کاربر تجربه بهتری داشته باشد،
      // اما راهنمای نسبت‌ها را برای کمک به او در قسمت توضیحات به‌روز می‌کنیم.
      // اگر می‌خواهید اعتبارسنجی را فعال کنید، فقط کامنت‌های زیر را بردارید.
      
      // const isValid = await validateImageDimensions(file)
      // if (!isValid) {
      //   setError('نسبت طول به عرض تصویر آپلود شده برای پوستر مناسب نیست.')
      //   e.target.value = ''
      //   return
      // }
      
      // Store the file in ref only to avoid React state corruption
      posterFileRef.current = file
      
      // Create preview using FileReader
      const reader = new FileReader()
      reader.onload = (e) => {
        setPosterPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      setPosterFile(file) // اضافه شدن این خط برای نمایش نام فایل
      setError(null)
    }
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvince(e.target.value)
    setCity('') // Reset city when province changes
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    console.log('submit started')

    try {
      const supabase = createClient()
      let poster_url = initialData?.poster_url || null

      // Upload new poster if selected
      if (posterFileRef.current) {
        // Delete old poster if exists
        if (initialData?.poster_url) {
          const oldPath = initialData.poster_url.split('/').pop()
          if (oldPath) {
            await supabase.storage.from('event-posters').remove([oldPath])
          }
        }

        // Use direct Supabase upload with proper file handling
        const file = posterFileRef.current!
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        console.log('Uploading file from ref:', file.name, file.size)
        
        // Use fetch to upload file directly
        const formData = new FormData()
        formData.append('file', file)
        
        console.log('Uploading with fetch, file size:', file.size)
        
        const response = await fetch('/api/upload-event-poster', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`خطا در آپلود فایل: ${errorData.error}`)
        }
        
        const { publicUrl } = await response.json()
        console.log('Upload success, public URL:', publicUrl)
        poster_url = publicUrl
      }

      console.log('before upload')

      if (!selectedDay) {
        throw new Error('لطفاً تاریخ را انتخاب کنید')
      }

      // Convert Persian date to Gregorian
      const gregorianDate = date.j2g(selectedDay.year, selectedDay.month, selectedDay.day)
      const formattedDate = `${gregorianDate[0]}-${String(gregorianDate[1]).padStart(2, '0')}-${String(gregorianDate[2]).padStart(2, '0')}`

      // Check if the selected date is in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(formattedDate)
      if (selectedDate < today) {
        throw new Error('تاریخ انتخاب شده نمی‌تواند در گذشته باشد')
      }

      const eventData = {
        title,
        date: formattedDate,
        time,
        venue,
        description,
        ticket_price: ticketPrice ? parseInt(ticketPrice) : null,
        capacity: capacity ? parseInt(capacity) : null,
        poster_url,
        ticket_link: ticketLink || null,
        created_by: userId, // This is now user.id
        status: 'pending',
        province,
        city
      }

      let eventId = initialData?.id

      if (initialData) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialData.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select('id')
          .single()
        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        if (!data) throw new Error('رویداد ایجاد شد اما شناسه آن دریافت نشد')
        eventId = data.id
      }

      console.log('after upload')

      router.push(`/events/${eventId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    } finally {
      setLoading(false)
    }

    console.log('before redirect')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-100">
          عنوان رویداد *
        </label>
        <input
          type="text"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="مثال: کنسرت گروه..."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-100 mb-1">
            تاریخ *
          </label>
          <PersianDatePicker
            value={selectedDay}
            onChange={setSelectedDay}
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-100">
            ساعت *
          </label>
          <TimePicker
            value={time}
            onChange={(newTime) => setTime(newTime || '')}
            className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            format="HH:mm"
            disableClock={true}
            locale="fa-IR"
            clearIcon={null}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-100">استان *</label>
          <select
            id="province"
            required
            value={province}
            onChange={handleProvinceChange}
            className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">انتخاب استان</option>
            {provinceCityData.map((p: any) => (
              <option key={p["province-fa"]} value={p["province-fa"]}>{p["province-fa"]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-100">شهر *</label>
          <select
            id="city"
            required
            value={city}
            onChange={handleCityChange}
            disabled={!province}
            className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">انتخاب شهر</option>
            {provinceCityData.find((p: any) => p["province-fa"] === province)?.cities.map((c: any) => (
              <option key={c["city-fa"]} value={c["city-fa"]}>{c["city-fa"]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-100">
          مکان برگزاری *
        </label>
        <input
          type="text"
          id="venue"
          required
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="نام و آدرس محل برگزاری"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-100">
          توضیحات *
        </label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="جزئیات رویداد را وارد کنید..."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="ticket_price" className="block text-sm font-medium text-gray-100">
            قیمت بلیت (تومان)
          </label>
          <input
            type="number"
            id="ticket_price"
            min="0"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(e.target.value)}
            className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="اختیاری"
          />
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-100">
            ظرفیت
          </label>
          <input
            type="number"
            id="capacity"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="اختیاری"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ticket_link" className="block text-sm font-medium text-gray-100">
          لینک خرید بلیت
        </label>
        <input
          type="url"
          id="ticket_link"
          value={ticketLink}
          onChange={(e) => setTicketLink(e.target.value)}
          className="mt-1 text-gray-100 block w-full bg-gray-800 rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="https://..."
          pattern="https?://.*"
        />
        <p className="mt-1 text-sm text-gray-500">آدرس باید با http:// یا https:// شروع شود</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-100">
          پوستر رویداد *
        </label>
        <div className="mt-1 space-y-4">
          <div className="relative">
            <input
              type="file"
              id="poster-upload"
              required
              accept="image/*"
              onChange={handlePosterChange}
              className="hidden"
            />
            <label
              htmlFor="poster-upload"
              className="inline-block cursor-pointer text-sm text-gray-400
                bg-gray-800 hover:bg-gray-700
                px-4 py-2 rounded-md border border-gray-600
                transition-colors"
            >
              انتخاب پوستر
            </label>
            {posterFile && (
              <span className="mr-2 text-sm text-gray-400">
                {posterFile.name}
              </span>
            )}
          </div>
          {posterPreview && (
            // --- تغییرات در اینجا اعمال شده است ---
            // حذف نسبت ابعاد ثابت (aspect-[16/9]) برای نمایش صحیح پوسترهای عمودی و مربعی
            <div className="relative w-full max-h-96 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <img 
                src={posterPreview} 
                alt="پیش‌نمایش پوستر" 
                className="block w-auto h-auto max-w-full max-h-96 object-contain mx-auto"
              />
            </div>
            // --- پایان تغییرات ---
          )}
          <p className="text-sm text-gray-400">
            <span className="block">
                پیشنهاد ما برای بهترین نمایش پوستر عمودی است 
            </span>
            {/* <span className="block mt-1">
              **نسبت‌های مجاز:** عمودی (۴:۵، ۹:۱۶)، مربعی (۱:۱)، افقی (۱۶:۹، ۴:۳)
            </span> */}
            <span className="inline-block mx-1">🖼️</span>
            <span className="block mt-1">فرمت‌های مجاز: JPG، PNG، GIF</span>
          </p>
        </div>
      </div>


      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'در حال ثبت...' : (initialData ? 'ویرایش رویداد' : 'ثبت رویداد')}
        </button>
      </div>
    </form>
  )
}