import { useState } from 'react'
import ListPage from '@/pages/ListPage'
import MapPage from '@/pages/MapPage'
import SocietiesPage from '@/pages/SocietiesPage'

type Page = 'list' | 'map' | 'societies'
const TABS: { value: Page; label: string }[] = [
  { value: 'list',      label: 'Listings' },
  { value: 'map',       label: 'Map' },
  { value: 'societies', label: 'Societies' },
]

export default function App() {
  const [page, setPage] = useState<Page>('list')

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Flat Hunter</h1>
        <nav className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setPage(t.value)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                page === t.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {page === 'list'      && <ListPage />}
        {page === 'map'       && <MapPage />}
        {page === 'societies' && <SocietiesPage />}
      </main>
    </div>
  )
}
