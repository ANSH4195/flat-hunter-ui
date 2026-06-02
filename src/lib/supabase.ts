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
    .lte('dist_hexaware_km', 5)
    .lte('dist_rubrik_km', 8)
    .order('first_seen_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Property[]
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
