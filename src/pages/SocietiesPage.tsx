import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip } from 'react-leaflet'
import { fetchSocieties, fetchScrapedSocieties, type Society, type ScrapedSociety } from '@/lib/supabase'
import { cn, hexColor, rubrikColor } from '@/lib/utils'

const HEXAWARE: [number, number] = [12.9897, 77.7281]
const RUBRIK: [number, number]   = [12.9259, 77.6762]
const CENTER: [number, number]   = [12.9578, 77.7022]

type CombinedSociety = {
  key: string
  name: string
  locality: string
  lat: number
  lng: number
  dist_hexaware_km: number
  dist_rubrik_km: number
  active_count: number
  scraped: boolean
}

// Merge OSM-seeded societies (comprehensive) with NoBroker-scraped societies (active counts).
// Two entries are the same place if their centres are within ~300m (0.003 degrees).
function merge(all: Society[], scraped: ScrapedSociety[]): CombinedSociety[] {
  const usedScrapedIndices = new Set<number>()
  const result: CombinedSociety[] = []

  for (const s of all) {
    const matchIdx = scraped.findIndex(
      (d, i) =>
        !usedScrapedIndices.has(i) &&
        Math.abs(d.lat - s.lat) < 0.003 &&
        Math.abs(d.lng - s.lng) < 0.003,
    )
    if (matchIdx !== -1) {
      usedScrapedIndices.add(matchIdx)
      const d = scraped[matchIdx]
      result.push({
        key: s.osm_ref,
        name: s.name,
        locality: d.locality ?? '',
        lat: s.lat,
        lng: s.lng,
        dist_hexaware_km: s.dist_hexaware_km,
        dist_rubrik_km: s.dist_rubrik_km,
        active_count: d.active_count,
        scraped: true,
      })
    } else {
      result.push({
        key: s.osm_ref,
        name: s.name,
        locality: '',
        lat: s.lat,
        lng: s.lng,
        dist_hexaware_km: s.dist_hexaware_km,
        dist_rubrik_km: s.dist_rubrik_km,
        active_count: 0,
        scraped: false,
      })
    }
  }

  // Add scraped societies not matched to any OSM entry
  for (let i = 0; i < scraped.length; i++) {
    if (usedScrapedIndices.has(i)) continue
    const d = scraped[i]
    result.push({
      key: `db-${d.name}`,
      name: d.name,
      locality: d.locality,
      lat: d.lat,
      lng: d.lng,
      dist_hexaware_km: d.dist_hexaware_km,
      dist_rubrik_km: d.dist_rubrik_km,
      active_count: d.active_count,
      scraped: true,
    })
  }

  return result.sort((a, b) => a.dist_hexaware_km - b.dist_hexaware_km)
}

export default function SocietiesPage() {
  const [societies, setSocieties] = useState<CombinedSociety[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSocieties(), fetchScrapedSocieties()])
      .then(([all, scraped]) => setSocieties(merge(all, scraped)))
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const hoveredSociety = hovered ? societies.find((s) => s.key === hovered) : null
  const others = hoveredSociety ? societies.filter((s) => s.key !== hovered) : societies

  return (
    <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
      {/* ── Left panel ── */}
      <div className="w-80 xl:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0">
        <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
          {loading
            ? 'Loading…'
            : `${societies.length} societies · sorted by distance to Hexaware`}
        </div>
        {error && (
          <p className="px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        <div className="overflow-y-auto flex-1">
          {societies.map((s) => (
            <div
              key={s.key}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'px-4 py-3 border-b border-gray-100 cursor-default select-none transition-colors',
                hovered === s.key ? 'bg-blue-50' : 'hover:bg-gray-50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-tight truncate">{s.name}</p>
                  {s.locality && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.locality}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {s.active_count > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                      {s.active_count} listing{s.active_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  {!s.scraped && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      not scraped
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', hexColor(s.dist_hexaware_km))}>
                  Hex {s.dist_hexaware_km.toFixed(1)}km
                </span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', rubrikColor(s.dist_rubrik_km))}>
                  Rub {s.dist_rubrik_km.toFixed(1)}km
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right map ── */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 text-sm text-gray-500">
            Loading…
          </div>
        )}
        <MapContainer center={CENTER} zoom={12} className="w-full h-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Office radius circles */}
          <Circle center={HEXAWARE} radius={5000}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.06, weight: 1.5 }} />
          <CircleMarker center={HEXAWARE} radius={8}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -10]} className="font-medium text-xs">Hexaware</Tooltip>
          </CircleMarker>

          <Circle center={RUBRIK} radius={8000}
            pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.06, weight: 1.5 }} />
          <CircleMarker center={RUBRIK} radius={8}
            pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -10]} className="font-medium text-xs">Rubrik</Tooltip>
          </CircleMarker>

          {/* Non-hovered society markers */}
          {others
            .filter((s) => s.lat && s.lng)
            .map((s) => (
              <CircleMarker
                key={s.key}
                center={[s.lat, s.lng]}
                radius={s.active_count > 0 ? 7 : 4}
                pathOptions={{
                  color:       s.active_count > 0 ? '#2563eb' : s.scraped ? '#9ca3af' : '#d1d5db',
                  fillColor:   s.active_count > 0 ? '#2563eb' : s.scraped ? '#9ca3af' : '#e5e7eb',
                  fillOpacity: s.active_count > 0 ? 0.75 : 0.4,
                  weight: 1,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} className="text-xs">{s.name}</Tooltip>
              </CircleMarker>
            ))}

          {/* Hovered marker — rendered last so it sits on top */}
          {hoveredSociety?.lat && hoveredSociety.lng && (
            <CircleMarker
              center={[hoveredSociety.lat, hoveredSociety.lng]}
              radius={13}
              pathOptions={{ color: '#ca8a04', fillColor: '#facc15', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip permanent direction="top" offset={[0, -14]} className="font-semibold text-xs">
                {hoveredSociety.name}
              </Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
