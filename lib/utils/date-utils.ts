/**
 * Date utilities for leave management
 * These functions ensure consistency with backend Django models
 */

/**
 * Calculate leave duration in days (inclusive of both start and end dates)
 * This matches the Django backend calculation: (end_date - start_date).days + 1
 * 
 * Examples:
 * - Same day (17/10/2025 to 17/10/2025) = 1 day
 * - Two days (17/10/2025 to 18/10/2025) = 2 days
 * - Three days (18/10/2025 to 20/10/2025) = 3 days
 */
export function calculateLeaveDuration(startDate: Date | string, endDate: Date | string): number {
  let start: Date
  let end: Date
  
  // Convert strings to Date objects if needed
  if (typeof startDate === 'string') {
    // Handle YYYY-MM-DD format
    start = new Date(startDate + 'T00:00:00')
  } else {
    start = new Date(startDate)
  }
  
  if (typeof endDate === 'string') {
    // Handle YYYY-MM-DD format
    end = new Date(endDate + 'T00:00:00')
  } else {
    end = new Date(endDate)
  }
  
  // Calculate difference in days
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Add 1 to include both start and end dates (inclusive calculation)
  return diffDays + 1
}

/**
 * Calculate leave duration from Date objects (for React date pickers)
 */
export function calculateLeaveDurationFromDates(startDate?: Date, endDate?: Date): number {
  if (!startDate || !endDate) return 0
  return calculateLeaveDuration(startDate, endDate)
}

/**
 * Format Date object to YYYY-MM-DD string (backend format)
 */
export function formatDateForBackend(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Parse YYYY-MM-DD string to Date object (avoiding timezone issues)
 */
export function parseDateFromBackend(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Generate array of dates between start and end (inclusive)
 * Used for calendar marking and leave application processing
 */
export function getDateRange(startDate: Date | string, endDate: Date | string): string[] {
  const start = typeof startDate === 'string' ? parseDateFromBackend(startDate) : startDate
  const end = typeof endDate === 'string' ? parseDateFromBackend(endDate) : endDate
  
  const dates: string[] = []
  const currentDate = new Date(start)
  
  while (currentDate <= end) {
    dates.push(formatDateForBackend(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

/**
 * Validate that start date is not after end date
 */
export function validateDateRange(startDate: Date | string, endDate: Date | string): boolean {
  const start = typeof startDate === 'string' ? parseDateFromBackend(startDate) : startDate
  const end = typeof endDate === 'string' ? parseDateFromBackend(endDate) : endDate
  
  return start <= end
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(
  start1: Date | string, end1: Date | string,
  start2: Date | string, end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? start1 : formatDateForBackend(start1)
  const e1 = typeof end1 === 'string' ? end1 : formatDateForBackend(end1)
  const s2 = typeof start2 === 'string' ? start2 : formatDateForBackend(start2)
  const e2 = typeof end2 === 'string' ? end2 : formatDateForBackend(end2)
  
  // Check for overlap: start1 <= end2 && end1 >= start2
  return s1 <= e2 && e1 >= s2
}