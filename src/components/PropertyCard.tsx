import { Ban, ExternalLink } from 'lucide-react'
import { cn, hexColor, rubrikColor, formatRent } from '@/lib/utils'
import type { Property } from '@/lib/supabase'

const FURNISHING_LABEL: Record<string, string> = {
  furnished: 'Furnished',
  semi: 'Semi-furnished',
  unfurnished: 'Unfurnished',
  unknown: '',
}

function isNew(isoDate: string): boolean {
  return Date.now() - new Date(isoDate).getTime() < 48 * 60 * 60 * 1000
}

export default function PropertyCard({ p, onBan }: { p: Property; onBan?: () => void }) {
  const thumb = p.images?.[0]
  const furnishLabel = FURNISHING_LABEL[p.furnishing] ?? ''
  const maintenanceBreakdown =
    p.maintenance > 0
      ? `${formatRent(p.rent)} rent + ${formatRent(p.maintenance)} maintenance`
      : null

  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-100 shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={p.society_name || p.locality}
            className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
            loading="lazy"
            decoding="async"
            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🏠
          </div>
        )}
        {isNew(p.first_seen_at) && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            New
          </span>
        )}
        {onBan && p.society_name && (
          <button
            onClick={(e) => { e.preventDefault(); onBan() }}
            title={`Hide all listings from ${p.society_name}`}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full p-1 shadow-sm"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + rent */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate leading-tight">
              {p.society_name || p.locality}
            </p>
            <p className="text-sm text-gray-500 truncate">{p.locality}</p>
          </div>
          <div className="text-right shrink-0">
            <p
              className="text-lg font-bold text-gray-900 leading-tight cursor-default"
              title={maintenanceBreakdown ?? undefined}
            >
              {formatRent(p.total_rent)}
            </p>
            <p className="text-xs text-gray-400">/mo</p>
          </div>
        </div>

        {/* Distance badges */}
        <div className="flex gap-1.5 flex-wrap">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', hexColor(p.dist_hexaware_km))}>
            Hexaware {p.dist_hexaware_km.toFixed(1)}km
          </span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', rubrikColor(p.dist_rubrik_km))}>
            Rubrik {p.dist_rubrik_km.toFixed(1)}km
          </span>
        </div>

        {/* Chips */}
        <div className="flex gap-1.5 flex-wrap">
          {p.floor && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              Floor {p.floor}
            </span>
          )}
          {furnishLabel && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {furnishLabel}
            </span>
          )}
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            🅿 Parking
          </span>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-1">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View listing
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  )
}
