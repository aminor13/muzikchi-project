"use client";

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'

type MapPickerGoogleProps = {
  province: string
  city: string
  initialPosition?: { lat: number; lng: number }
  onSelect: (latlng: { lat: number; lng: number }) => void
}

const containerStyle = { width: '100%', height: '100%' }

export default function MapPickerGoogle({ province, city, initialPosition, onSelect }: MapPickerGoogleProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey || '' })

  const [center, setCenter] = useState<{ lat: number; lng: number }>(initialPosition || { lat: 32.4279, lng: 53.6880 })
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(initialPosition || null)

  useEffect(() => {
    if (!initialPosition && typeof window !== 'undefined' && (window as any).google && (province || city)) {
      const geocoder = new (window as any).google.maps.Geocoder()
      const q = [city, province, 'Iran'].filter(Boolean).join(', ')
      geocoder.geocode({ address: q }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location
          setCenter({ lat: loc.lat(), lng: loc.lng() })
        }
      })
    }
  }, [province, city, initialPosition])

  const handleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    const pos = { lat, lng }
    setMarker(pos)
    onSelect(pos)
  }, [onSelect])

  if (!apiKey) {
    return <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm">Google Maps API key is missing</div>
  }

  if (!isLoaded) {
    return <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm">در حال بارگذاری نقشه...</div>
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      onClick={handleClick}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {marker && <Marker position={marker} />}
    </GoogleMap>
  )
}

