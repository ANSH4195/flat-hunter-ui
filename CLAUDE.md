# flat-hunter-ui

React frontend for the flat-hunter scraper. Reads from the same Supabase project as the scraper (read-only via anon key). Deployed to GitHub Pages at `https://ansh4195.github.io/flat-hunter-ui/`.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Map | Leaflet + react-leaflet (no API key needed) |
| Data | `@supabase/supabase-js` (anon key, read-only) |
| Linting | Biome |
| Package manager | pnpm |

---

## Pages

### `/` — Listings (default)

Property card grid/list. Primary view.

**Header bar**
- App title "Flat Hunter" (left)
- "Last updated: <date>" badge — pull `max(last_seen_at)` from `scrape_runs` where `status = 'ok'`
- Tab switcher: Listings | Map (right)

**Filter bar** (below header, sticky)
- Price slider: 20K–55K, steps of 5K, filters on `total_rent`
- Furnishing chips: All / Furnished / Semi / Unfurnished (multi-select)
- Sort dropdown: Newest first (default) | Cheapest first | Closest to Hexaware | Closest to Rubrik

**Property cards** — one card per listing, fields:
- Society name (bold) + locality (muted)
- Total rent (large, `₹XXK/mo`) — if maintenance > 0, show breakdown on hover/tooltip: `₹Xk rent + ₹Xk maintenance`
- Distance badges (two, always shown side by side):
  - `Hexaware X.Xkm` — color: green ≤3km, yellow 3–5km, orange >5km
  - `Rubrik X.Xkm` — color: green ≤5km, yellow 5–7km, orange >7km
- Floor chip: e.g. `Floor 3`
- Furnishing chip: Furnished / Semi / Unfurnished
- Parking chip: always shown (only gated+parking listings are in DB)
- Thumbnail image (first image from `images[]`; fallback: grey placeholder)
- "New" badge if `first_seen_at` is within the last 48h
- "View listing" button → opens `url` in new tab

Cards are sorted per the active sort option. No pagination — all results fit client-side (expected ≤200 after filters).

**Empty state**: "No listings match your filters" with a reset button.

---

### `/map` — Map

Leaflet map showing both office radius circles and property markers.

**Map setup**
- Tile layer: OpenStreetMap (no API key)
- Initial center: midpoint of the two offices → `(12.9489, 77.7116)`
- Initial zoom: 12

**Office circles**
- Hexaware (Prestige Shantiniketan, Whitefield): `[12.9719, 77.7469]`
  - Blue circle, radius 5km, fill opacity 0.05
  - Pin marker labeled "Hexaware"
- Rubrik (Embassy TechVillage, ORR/Bellandur): `[12.9259, 77.6762]`
  - Orange circle, radius 8km, fill opacity 0.05
  - Pin marker labeled "Rubrik"

**Property markers**
- One marker per active listing with `lat`/`lng`
- Cluster markers when zoomed out (use `react-leaflet-cluster` or Leaflet.markercluster)
- Click popup shows: society name, locality, total rent, Hexaware distance, Rubrik distance, "View listing" link

---

## Data

### Supabase client (`src/lib/supabase.ts`)

```ts
// Use the anon key — read-only, safe to expose in frontend
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
```

### Main query

```ts
supabase
  .from('properties')
  .select('*')
  .eq('is_active', true)
  .lte('total_rent', 55000)       // display threshold (DB stores up to 60K)
  .lte('dist_hexaware_km', 5)     // display threshold (DB stores up to 5.5km)
  .lte('dist_rubrik_km', 8)       // display threshold (DB stores up to 8.5km)
  .order('first_seen_at', { ascending: false })
```

The DB stores slightly wider results (60K / 5.5km / 8.5km buffers for geocoding noise). The frontend applies the actual user-facing limits (55K / 5km / 8km) at query time.

### Last-updated timestamp

```ts
supabase
  .from('scrape_runs')
  .select('run_at')
  .eq('status', 'ok')
  .order('run_at', { ascending: false })
  .limit(1)
  .single()
```

---

## Env vars

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Project URL — `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key from Project Settings → API |

Set as GitHub Actions secrets for the deploy workflow. For local dev, copy `.env.example` to `.env.local`.

---

## Deploy

GitHub Actions (`deploy.yml`) builds on every push to `main` and publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`. GitHub Pages must be configured to serve from the `gh-pages` branch in repo Settings → Pages.

The Vite `base` is set to `/flat-hunter-ui/` to match the GitHub Pages sub-path.

---

## Local dev

```bash
cp .env.example .env.local   # fill in Supabase URL + anon key
pnpm install
pnpm dev
```

---

## Project structure

```
src/
  lib/
    supabase.ts     # client + Property type + fetchProperties()
    utils.ts        # cn(), distanceColor(), formatRent()
  pages/
    ListPage.tsx    # property grid with filter bar
    MapPage.tsx     # Leaflet map with office circles + markers
  components/       # shared UI: PropertyCard, DistanceBadge, FilterBar, etc.
  App.tsx           # tab routing: list ↔ map
  main.tsx          # entry point, imports Leaflet CSS + Geist font
  index.css         # @import tailwindcss
```

---

## Design notes

- **No router library** — two-tab navigation managed with a single `useState`. Simple enough to not need react-router.
- **No server-side rendering** — static GitHub Pages deploy. All filtering is client-side after one Supabase fetch.
- **Leaflet CSS** must be imported in `main.tsx` before the map renders, otherwise tiles break.
- **Distance color thresholds** differ per office: Hexaware threshold is 5km (tighter), Rubrik is 8km (looser). Color bands should reflect this:
  - Hexaware: green ≤3km / yellow 3–5km / orange (shouldn't appear, filtered at 5km)
  - Rubrik: green ≤5km / yellow 5–7km / orange 7–8km
