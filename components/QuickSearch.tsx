'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import provinceCityData from '@/data/province_city.json'

interface CityOption {
  city: string;
  province: string;
}

export default function QuickSearch() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<CityOption[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Get all cities with their provinces
  const allCities: CityOption[] = provinceCityData.flatMap(province => 
    province.cities.map(city => ({
      city: city["city-fa"],
      province: province["province-fa"]
    }))
  )

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update suggestions when search term changes
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = allCities.filter(item =>
        item.city.includes(searchTerm)
      ).slice(0, 5) // Limit to 5 suggestions
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      const selectedCity = allCities.find(item => item.city === searchTerm)
      if (selectedCity) {
        router.push(`/explore?province=${encodeURIComponent(selectedCity.province)}&city=${encodeURIComponent(selectedCity.city)}&showSearchForm=true`)
      }
    }
  }

  const handleSuggestionClick = (suggestion: CityOption) => {
    setSearchTerm(suggestion.city)
    setShowSuggestions(false)
    router.push(`/explore?province=${encodeURIComponent(suggestion.province)}&city=${encodeURIComponent(suggestion.city)}&showSearchForm=true`)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div ref={wrapperRef} className="relative">
        <form onSubmit={handleQuickSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="نام شهر"
              className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right bg-gray-800 text-gray-100 placeholder-gray-400"
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 cursor-pointer hover:bg-gray-700 text-gray-100 text-right"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.city} ({suggestion.province})
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <p className="text-sm text-gray-200">جستجو بر اساس:</p>
        <div className="flex flex-wrap gap-2">
          {provinceCityData.map((province: any) => (
            <button
              key={province["province-en"]}
              onClick={() => router.push(`/explore?province=${encodeURIComponent(province["province-fa"])}&showSearchForm=true`)}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-full text-gray-100"
            >
              {province["province-fa"]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push('/explore')}
        className="mx-auto flex items-center justify-center gap-2 bg-gradient-to-l from-gray-900 to-gray-700 font-bold text-base px-6 py-2 rounded-full shadow-lg hover:bg-orange-500 transition-colors text-white max-w-xs"
      >
        جستجوی پیشرفته
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
} 