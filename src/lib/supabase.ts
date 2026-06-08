import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export type Property = {
  id: string
  source: string
  source_id: string
  url: string
  title: string
  locality: string
  society_name: string
  address: string
  lat: number
  lng: number
  dist_hexaware_km: number
  dist_rubrik_km: number
  bedrooms: number
  rent: number
  maintenance: number
  total_rent: number
  furnishing: 'furnished' | 'semi' | 'unfurnished' | 'unknown'
  floor: string
  parking: boolean
  is_gated_society: boolean
  amenities: string[]
  images: string[]
  water_supply_notes: string
  is_active: boolean
  first_seen_at: string
  last_seen_at: string
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('is_active', true)
    .lte('total_rent', 55000)
    .lte('dist_hexaware_km', 10)
    .lte('dist_rubrik_km', 12)
    .order('first_seen_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Property[]
}

// All known societies in the area (seeded from OSM via scraper/seed_societies.py)
export type Society = {
  osm_ref: string
  name: string
  lat: number
  lng: number
  dist_hexaware_km: number
  dist_rubrik_km: number
}

export async function fetchSocieties(): Promise<Society[]> {
  const { data, error } = await supabase
    .from('societies')
    .select('osm_ref, name, lat, lng, dist_hexaware_km, dist_rubrik_km')
    .order('dist_hexaware_km')
  if (error) throw error
  return (data ?? []) as Society[]
}

// Active listing counts per NoBroker-scraped society
export type ScrapedSociety = {
  name: string
  locality: string
  lat: number
  lng: number
  dist_hexaware_km: number
  dist_rubrik_km: number
  active_count: number
}

export async function fetchScrapedSocieties(): Promise<ScrapedSociety[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('society_name, locality, lat, lng, dist_hexaware_km, dist_rubrik_km, is_active')
    .not('society_name', 'is', null)
    .neq('society_name', '')
  if (error) throw error

  const map = new Map<string, ScrapedSociety>()
  for (const row of (data ?? []) as Array<{
    society_name: string; locality: string; lat: number; lng: number
    dist_hexaware_km: number; dist_rubrik_km: number; is_active: boolean
  }>) {
    const name = row.society_name.trim()
    if (!name) continue
    if (!map.has(name)) {
      map.set(name, {
        name,
        locality: row.locality,
        lat: row.lat,
        lng: row.lng,
        dist_hexaware_km: row.dist_hexaware_km,
        dist_rubrik_km: row.dist_rubrik_km,
        active_count: 0,
      })
    }
    if (row.is_active) map.get(name)!.active_count++
  }

  return Array.from(map.values())
}

export async function fetchLastUpdated(): Promise<string | null> {
  const { data } = await supabase
    .from('scrape_runs')
    .select('run_at')
    .eq('status', 'ok')
    .order('run_at', { ascending: false })
    .limit(1)
    .single()
  return data?.run_at ?? null
}
