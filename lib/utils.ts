import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatUTCtoISTDate, formatUTCtoIST, isValidUTCTimestamp } from './timezone'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format UTC timestamp or date string for IST display
 * Converts UTC timestamp to readable IST format like "Oct 16, 2025"
 * 
 * @deprecated Use formatUTCtoISTDate from timezone.ts for new code
 */
export function formatDate(date: string | Date): string {
  if (!date) return ''
  
  // If it's a UTC timestamp, convert to IST
  if (typeof date === 'string' && isValidUTCTimestamp(date)) {
    return formatUTCtoISTDate(date, 'DD MMM YYYY')
  }
  
  // Fallback for legacy date strings or Date objects
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format UTC timestamp for IST display with both date and time
 * Example: "Oct 16, 2025 at 2:30 PM IST"
 */
export function formatDateTime(utcTimestamp: string | Date): string {
  if (!utcTimestamp) return ''
  
  return formatUTCtoIST(utcTimestamp, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true
  }) + ' IST'
}

/**
 * Format UTC timestamp for IST time display only
 * Example: "2:30 PM" or "14:30"
 */
export function formatTime(utcTimestamp: string | Date, hour12: boolean = true): string {
  if (!utcTimestamp) return ''
  
  return formatUTCtoIST(utcTimestamp, {
    showDate: false,
    timeStyle: 'short',
    hour12
  })
}

/**
 * Get relative time string in IST context
 * Example: "2 hours ago", "in 30 minutes"
 */
export function getRelativeTime(utcTimestamp: string | Date): string {
  if (!utcTimestamp) return ''
  
  const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return formatDate(utcTimestamp)
}
