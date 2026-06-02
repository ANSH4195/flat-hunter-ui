import { useState } from 'react'
import ListPage from '@/pages/ListPage'
import MapPage from '@/pages/MapPage'

export default function App() {
  const [page, setPage] = useState<'list' | 'map'>('list')

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Flat Hunter</h1>
        <nav className="flex gap-2">
          {(['list', 'map'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                page === p
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === 'list' ? 'Listings' : 'Map'}
            </button>
          ))}
        </nav>
      </header>
      <main>{page === 'list' ? <ListPage /> : <MapPage />}</main>
    </div>
  )
}
