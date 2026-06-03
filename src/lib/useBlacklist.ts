import { useState, useCallback } from 'react'

const KEY = 'flat-hunter-blacklist'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function persist(s: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(s)))
}

export function useBlacklist() {
  const [blacklist, setBlacklist] = useState<Set<string>>(load)

  const ban = useCallback((society: string) => {
    setBlacklist((prev) => {
      const next = new Set(prev)
      next.add(society)
      persist(next)
      return next
    })
  }, [])

  const unban = useCallback((society: string) => {
    setBlacklist((prev) => {
      const next = new Set(prev)
      next.delete(society)
      persist(next)
      return next
    })
  }, [])

  return { blacklist, ban, unban }
}
