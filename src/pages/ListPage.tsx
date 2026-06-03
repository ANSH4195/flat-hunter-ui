import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchProperties, fetchLastUpdated, type Property } from '@/lib/supabase'
import { formatRent } from '@/lib/utils'
import { useBlacklist } from '@/lib/useBlacklist'
import PropertyCard from '@/components/PropertyCard'

type Sort = 'newest' | 'cheapest' | 'hex' | 'rubrik'
type Furnishing = 'furnished' | 'semi' | 'unfurnished' | 'unknown'

const FURNISHING_OPTIONS: { value: Furnishing | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi', label: 'Semi' },
  { value: 'unfurnished', label: 'Unfurnished' },
]

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'cheapest', label: 'Cheapest first' },
  { value: 'hex', label: 'Closest to Hexaware' },
  { value: 'rubrik', label: 'Closest to Rubrik' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SELECT_CLS = 'text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900'

export default function ListPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [maxRent, setMaxRent] = useState(55000)
  const [maxHex, setMaxHex] = useState(10)
  const [maxRub, setMaxRub] = useState(12)
  const [furnishing, setFurnishing] = useState<Furnishing | 'all'>('all')
  const [society, setSociety] = useState('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [showBanned, setShowBanned] = useState(false)
  const bannedRef = useRef<HTMLDivElement>(null)

  const { blacklist, ban, unban } = useBlacklist()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bannedRef.current && !bannedRef.current.contains(e.target as Node)) {
        setShowBanned(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    Promise.all([fetchProperties(), fetchLastUpdated()])
      .then(([props, ts]) => { setProperties(props); setLastUpdated(ts) })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const societies = useMemo(() => {
    const names = new Set<string>()
    for (const p of properties) {
      const n = p.society_name?.trim()
      if (n) names.add(n)
    }
    return ['all', ...Array.from(names).sort((a, b) => a.localeCompare(b))]
  }, [properties])

  const filtered = useMemo(() => {
    let list = properties.filter((p) =>
      p.total_rent <= maxRent &&
      p.dist_hexaware_km <= maxHex &&
      p.dist_rubrik_km <= maxRub &&
      !blacklist.has(p.society_name?.trim() ?? '')
    )
    if (furnishing !== 'all') list = list.filter((p) => p.furnishing === furnishing)
    if (society !== 'all') list = list.filter((p) => p.society_name?.trim() === society)
    switch (sort) {
      case 'cheapest': return [...list].sort((a, b) => a.total_rent - b.total_rent)
      case 'hex':      return [...list].sort((a, b) => a.dist_hexaware_km - b.dist_hexaware_km)
      case 'rubrik':   return [...list].sort((a, b) => a.dist_rubrik_km - b.dist_rubrik_km)
      default:         return list
    }
  }, [properties, maxRent, maxHex, maxRub, blacklist, furnishing, society, sort])

  function resetFilters() {
    setMaxRent(55000)
    setMaxHex(10)
    setMaxRub(12)
    setFurnishing('all')
    setSociety('all')
  }

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4">
        {/* Rent slider */}
        <div className="flex items-center gap-3 min-w-48">
          <span className="text-sm text-gray-500 whitespace-nowrap">Max rent</span>
          <input
            type="range" min={20000} max={55000} step={5000} value={maxRent}
            onChange={(e) => setMaxRent(Number(e.target.value))}
            className="w-28 accent-gray-900"
          />
          <span className="text-sm font-medium w-10">{formatRent(maxRent)}</span>
        </div>

        {/* Hexaware distance slider */}
        <div className="flex items-center gap-3 min-w-48">
          <span className="text-sm text-gray-500 whitespace-nowrap">Hexaware</span>
          <input
            type="range" min={1} max={10} step={1} value={maxHex}
            onChange={(e) => setMaxHex(Number(e.target.value))}
            className="w-28 accent-blue-600"
          />
          <span className="text-sm font-medium w-12">≤{maxHex}km</span>
        </div>

        {/* Rubrik distance slider */}
        <div className="flex items-center gap-3 min-w-48">
          <span className="text-sm text-gray-500 whitespace-nowrap">Rubrik</span>
          <input
            type="range" min={1} max={12} step={1} value={maxRub}
            onChange={(e) => setMaxRub(Number(e.target.value))}
            className="w-28 accent-orange-500"
          />
          <span className="text-sm font-medium w-12">≤{maxRub}km</span>
        </div>

        {/* Furnishing chips */}
        <div className="flex gap-1.5">
          {FURNISHING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFurnishing(opt.value)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                furnishing === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Society dropdown */}
        <select
          value={society}
          onChange={(e) => setSociety(e.target.value)}
          className={SELECT_CLS}
        >
          {societies.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All societies' : s}</option>
          ))}
        </select>

        {/* Blacklist pill */}
        {blacklist.size > 0 && (
          <div className="relative" ref={bannedRef}>
            <button
              onClick={() => setShowBanned((v) => !v)}
              className="text-sm px-3 py-1 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              {blacklist.size} hidden
            </button>
            {showBanned && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-52">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Hidden societies</p>
                <ul className="flex flex-col gap-1">
                  {Array.from(blacklist).sort().map((s) => (
                    <li key={s} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 truncate">{s}</span>
                      <button
                        onClick={() => { unban(s); if (blacklist.size === 1) setShowBanned(false) }}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Unhide"
                      >
                        Unhide
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className={`${SELECT_CLS} ml-auto`}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="px-6 py-4">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-5 text-sm text-gray-500">
          <span>{loading ? 'Loading…' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}</span>
          {lastUpdated && <span>Last updated: {formatDate(lastUpdated)}</span>}
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
            Failed to load listings: {error}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                p={p}
                onBan={p.society_name ? () => ban(p.society_name.trim()) : undefined}
              />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No listings match your filters</p>
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
