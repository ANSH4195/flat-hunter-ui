import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, Popup } from 'react-leaflet'
import { fetchProperties, type Property } from '@/lib/supabase'
import { formatRent, hexColor, rubrikColor, cn } from '@/lib/utils'

const HEXAWARE = { latlng: [12.9897, 77.7281] as [number, number], label: 'Hexaware', radius: 5000 }
const RUBRIK   = { latlng: [12.9259, 77.6762] as [number, number], label: 'Rubrik',   radius: 8000 }
const CENTER: [number, number] = [12.9578, 77.7022]

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="relative" style={{ height: 'calc(100vh - 57px)' }}>
      {(loading || error) && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 text-sm text-gray-500">
          {error ? `Error: ${error}` : 'Loading map…'}
        </div>
      )}

      <MapContainer
        center={CENTER}
        zoom={12}
        className="w-full h-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hexaware — blue circle + pin */}
        <Circle
          center={HEXAWARE.latlng}
          radius={HEXAWARE.radius}
          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.06, weight: 1.5 }}
        />
        <CircleMarker
          center={HEXAWARE.latlng}
          radius={8}
          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="font-medium text-xs">
            Hexaware
          </Tooltip>
        </CircleMarker>

        {/* Rubrik — orange circle + pin */}
        <Circle
          center={RUBRIK.latlng}
          radius={RUBRIK.radius}
          pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.06, weight: 1.5 }}
        />
        <CircleMarker
          center={RUBRIK.latlng}
          radius={8}
          pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="font-medium text-xs">
            Rubrik
          </Tooltip>
        </CircleMarker>

        {/* Property markers */}
        {properties
          .filter((p) => p.lat && p.lng)
          .map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{ color: '#6b7280', fillColor: '#374151', fillOpacity: 0.85, weight: 1 }}
            >
              <Popup maxWidth={240}>
                <div className="text-sm leading-snug space-y-1.5 py-0.5">
                  <p className="font-semibold text-gray-900 text-base leading-tight">
                    {p.society_name || p.locality}
                  </p>
                  <p className="text-gray-500">{p.locality}</p>
                  <p className="text-gray-900 font-medium">{formatRent(p.total_rent)}/mo</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', hexColor(p.dist_hexaware_km))}>
                      Hexaware {p.dist_hexaware_km.toFixed(1)}km
                    </span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', rubrikColor(p.dist_rubrik_km))}>
                      Rubrik {p.dist_rubrik_km.toFixed(1)}km
                    </span>
                  </div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline text-xs pt-0.5"
                  >
                    View listing →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  )
}
