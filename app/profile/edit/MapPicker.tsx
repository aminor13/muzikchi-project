"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'

import 'leaflet/dist/leaflet.css'

type MapPickerProps = {
  province: string
  city: string
  initialPosition?: { lat: number; lng: number }
  onSelect: (latlng: { lat: number; lng: number }) => void
}

// Fix default marker icon paths
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function ClickHandler({ onSelect }: { onSelect: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

export default function MapPicker({ province, city, initialPosition, onSelect }: MapPickerProps) {
  const [center, setCenter] = useState<LatLngExpression>(initialPosition ? [initialPosition.lat, initialPosition.lng] : [32.4279, 53.6880])
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(initialPosition || null)

  useEffect(() => {
    // Try to center by province/city name using Nominatim
    const q = [city, province, 'Iran'].filter(Boolean).join(', ')
    if (!initialPosition && q) {
      const controller = new AbortController()
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
        headers: { 'Accept-Language': 'fa', 'User-Agent': 'profile-map-picker/1.0' },
        signal: controller.signal
      })
        .then(r => r.json())
        .then((res: any[]) => {
          if (res && res.length > 0) {
            const { lat, lon } = res[0]
            setCenter([parseFloat(lat), parseFloat(lon)])
          }
        })
        .catch(() => {})
      return () => controller.abort()
    }
  }, [province, city, initialPosition])

  const handleSelect = (latlng: { lat: number; lng: number }) => {
    setMarker(latlng)
    onSelect(latlng)
  }

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={handleSelect} />
      {marker && <Marker position={[marker.lat, marker.lng]} />}
    </MapContainer>
  )
}

