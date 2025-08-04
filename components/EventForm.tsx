'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventFormProps {
  userId: string
}

export default function EventForm({ userId }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue_id: '',
    custom_venue: '',
    ticket_price: '',
    capacity: '',
    poster_url: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ترکیب تاریخ و ساعت
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`)
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizer_id: userId,
          event_date: eventDateTime.toISOString(),
          ticket_price: formData.ticket_price ? parseInt(formData.ticket_price) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'خطا در ثبت رویداد')
      }

      router.push('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert(error instanceof Error ? error.message : 'خطا در ثبت رویداد. لطفا دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* عنوان رویداد */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          عنوان رویداد
        </label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* تاریخ و ساعت */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تاریخ
          </label>
          <input
            type="date"
            name="event_date"
            required
            value={formData.event_date}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ساعت
          </label>
          <input
            type="time"
            name="event_time"
            required
            value={formData.event_time}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* مکان */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          مکان برگزاری
        </label>
        <input
          type="text"
          name="custom_venue"
          required
          value={formData.custom_venue}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="نام و آدرس محل برگزاری"
        />
      </div>

      {/* توضیحات */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          توضیحات
        </label>
        <textarea
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* قیمت و ظرفیت */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            قیمت بلیت (تومان)
          </label>
          <input
            type="number"
            name="ticket_price"
            value={formData.ticket_price}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="اختیاری"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ظرفیت
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="اختیاری"
          />
        </div>
      </div>

      {/* لینک پوستر */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          لینک تصویر پوستر
        </label>
        <input
          type="url"
          name="poster_url"
          value={formData.poster_url}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="اختیاری"
        />
      </div>

      {/* دکمه ثبت */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'در حال ثبت...' : 'ثبت رویداد'}
      </button>
    </form>
  )
} 