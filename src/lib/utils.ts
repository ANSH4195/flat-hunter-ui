import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexColor(km: number): string {
  if (km <= 3) return 'bg-green-100 text-green-800'
  return 'bg-yellow-100 text-yellow-800'
}

export function rubrikColor(km: number): string {
  if (km <= 5) return 'bg-green-100 text-green-800'
  if (km <= 7) return 'bg-yellow-100 text-yellow-800'
  return 'bg-orange-100 text-orange-800'
}

export function formatRent(n: number): string {
  return `₹${(n / 1000).toFixed(0)}K`
}
