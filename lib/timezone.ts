/**
 * Comprehensive Timezone Utilities for IST Display with UTC Storage
 * 
 * This module provides utilities to:
 * 1. Convert UTC timestamps to IST for display
 * 2. Convert IST user inputs to UTC for storage
 * 3. Handle date operations in IST context
 * 4. Format dates and times consistently in IST
 */

// IST timezone constant
export const IST_TIMEZONE = 'Asia/Kolkata'

/**
 * Get current time in IST
 */
export const getCurrentIST = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
}

/**
 * Get current UTC time
 */
export const getCurrentUTC = (): Date => {
  return new Date()
}

/**
 * Convert UTC timestamp to IST Date object
 */
export const convertUTCtoIST = (utcTimestamp: string | Date): Date => {
  const utcDate = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp
  return new Date(utcDate.toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
}

/**
 * Convert IST Date object to UTC timestamp string
 */
export const convertISTtoUTC = (istDate: Date): string => {
  // Create a date string in IST format
  const istString = istDate.toISOString().replace('Z', '+05:30')
  // Parse it back to get UTC equivalent
  const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000))
  return utcDate.toISOString()
}

/**
 * Get IST date string (YYYY-MM-DD) from UTC timestamp
 */
export const getISTDateString = (utcTimestamp?: string | Date): string => {
  const date = utcTimestamp ? convertUTCtoIST(utcTimestamp) : getCurrentIST()
  return date.toISOString().split('T')[0]
}

/**
 * Get UTC date string (YYYY-MM-DD) for IST date
 * Used when user selects a date in IST but we need to query UTC data
 */
export const getUTCDateStringForISTDate = (istDateString: string): string => {
  const istDate = new Date(istDateString + 'T00:00:00')
  const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000))
  return utcDate.toISOString().split('T')[0]
}

/**
 * Format UTC timestamp for IST display
 */
export const formatUTCtoIST = (
  utcTimestamp: string | Date,
  options: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
    hour12?: boolean
    showDate?: boolean
    showTime?: boolean
  } = {}
): string => {
  const {
    dateStyle = 'medium',
    timeStyle = 'medium',
    hour12 = false,
    showDate = true,
    showTime = true
  } = options

  const utcDate = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp

  if (!showDate && !showTime) return ''

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    hour12
  }

  if (showDate && showTime) {
    formatOptions.dateStyle = dateStyle
    formatOptions.timeStyle = timeStyle
  } else if (showDate) {
    formatOptions.dateStyle = dateStyle
  } else if (showTime) {
    formatOptions.timeStyle = timeStyle
  }

  return utcDate.toLocaleString('en-IN', formatOptions)
}

/**
 * Format UTC timestamp to IST time only (HH:MM:SS or HH:MM AM/PM)
 */
export const formatUTCtoISTTime = (
  utcTimestamp: string | Date,
  hour12: boolean = false,
  includeSeconds: boolean = true
): string => {
  const utcDate = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12
  }

  if (includeSeconds) {
    options.second = '2-digit'
  }

  return utcDate.toLocaleTimeString('en-IN', options)
}

/**
 * Format UTC timestamp to IST date only (DD/MM/YYYY or YYYY-MM-DD)
 */
export const formatUTCtoISTDate = (
  utcTimestamp: string | Date,
  format: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY' = 'DD/MM/YYYY'
): string => {
  const istDate = convertUTCtoIST(utcTimestamp)
  
  switch (format) {
    case 'YYYY-MM-DD':
      return istDate.toISOString().split('T')[0]
    case 'DD MMM YYYY':
      return istDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    case 'DD/MM/YYYY':
    default:
      return istDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
  }
}

/**
 * Check if a UTC timestamp falls on a specific IST date
 */
export const isUTCTimestampOnISTDate = (utcTimestamp: string | Date, istDateString: string): boolean => {
  const istDate = getISTDateString(utcTimestamp)
  return istDate === istDateString
}

/**
 * Get start and end UTC timestamps for an IST date range
 * Useful for querying data for a specific IST date
 */
export const getUTCRangeForISTDate = (istDateString: string): { start: string; end: string } => {
  // Start of IST date (00:00:00 IST)
  const istStart = new Date(istDateString + 'T00:00:00')
  const utcStart = new Date(istStart.getTime() - (5.5 * 60 * 60 * 1000))
  
  // End of IST date (23:59:59 IST)
  const istEnd = new Date(istDateString + 'T23:59:59')
  const utcEnd = new Date(istEnd.getTime() - (5.5 * 60 * 60 * 1000))
  
  return {
    start: utcStart.toISOString(),
    end: utcEnd.toISOString()
  }
}

/**
 * Parse user date input (assumed to be in IST) and convert to UTC for API calls
 */
export const parseISTDateForAPI = (istDateString: string, time: string = '00:00:00'): string => {
  const istDateTime = new Date(istDateString + 'T' + time)
  const utcDateTime = new Date(istDateTime.getTime() - (5.5 * 60 * 60 * 1000))
  return utcDateTime.toISOString()
}

/**
 * Get IST business date (handles cross-midnight scenarios)
 * If it's before 6 AM IST, consider it as previous business day
 */
export const getISTBusinessDate = (utcTimestamp?: string | Date): string => {
  const istDate = utcTimestamp ? convertUTCtoIST(utcTimestamp) : getCurrentIST()
  
  // If before 6 AM IST, consider it as previous day for business purposes
  if (istDate.getHours() < 6) {
    const previousDay = new Date(istDate)
    previousDay.setDate(previousDay.getDate() - 1)
    return previousDay.toISOString().split('T')[0]
  }
  
  return istDate.toISOString().split('T')[0]
}

/**
 * Duration formatting utilities
 */
export const formatDuration = (durationMs: number): string => {
  const hours = Math.floor(durationMs / (1000 * 60 * 60))
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Parse duration string (HH:MM:SS) to milliseconds
 */
export const parseDurationToMs = (durationStr: string): number => {
  const parts = durationStr.split(':')
  const hours = parseInt(parts[0]) || 0
  const minutes = parseInt(parts[1]) || 0
  const seconds = parseInt(parts[2]) || 0
  
  return (hours * 3600 + minutes * 60 + seconds) * 1000
}

/**
 * Timezone-aware date comparison utilities
 */
export const isSameISTDate = (date1: string | Date, date2: string | Date): boolean => {
  const ist1 = getISTDateString(date1)
  const ist2 = getISTDateString(date2)
  return ist1 === ist2
}

export const isToday = (utcTimestamp: string | Date): boolean => {
  const todayIST = getISTDateString()
  const dateIST = getISTDateString(utcTimestamp)
  return todayIST === dateIST
}

export const isYesterday = (utcTimestamp: string | Date): boolean => {
  const yesterday = new Date(getCurrentIST())
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayIST = yesterday.toISOString().split('T')[0]
  const dateIST = getISTDateString(utcTimestamp)
  return yesterdayIST === dateIST
}

/**
 * Validation utilities
 */
export const isValidUTCTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp)
  return !isNaN(date.getTime()) && timestamp.includes('T')
}

export const isValidISTDateString = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}