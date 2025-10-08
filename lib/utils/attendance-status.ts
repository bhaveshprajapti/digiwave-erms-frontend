import api from '@/lib/api'
import { authService } from '@/lib/auth'
import { Shift } from '@/lib/schemas'

export interface AttendanceStatusResult {
  status: 'present' | 'late' | 'half-day' | 'leave' | 'absent'
  reason?: string
}

interface SessionData {
  check_in: string
  check_out?: string
}

interface UserWithShifts {
  id: number
  shifts?: number[]
}

// Cache for shifts to avoid repeated API calls
let shiftsCache: Shift[] | null = null
let userShiftsCache: UserWithShifts | null = null

/**
 * Get all available shifts
 */
async function getShifts(): Promise<Shift[]> {
  if (shiftsCache) return shiftsCache
  
  try {
    const response = await api.get('/common/shifts/')
    shiftsCache = response.data
    return shiftsCache || []
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return []
  }
}

/**
 * Get current user's detailed information including assigned shifts
 */
async function getCurrentUserWithShifts(): Promise<UserWithShifts | null> {
  if (userShiftsCache) return userShiftsCache
  
  try {
    const userData = authService.getUserData()
    if (!userData?.id) return null
    
    const response = await api.get(`/accounts/users/${userData.id}/`)
    userShiftsCache = response.data
    return userShiftsCache
  } catch (error) {
    console.error('Error fetching user details:', error)
    return null
  }
}

/**
 * Parse time string (HH:MM:SS or HH:MM) to minutes from start of day
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

/**
 * Calculate working hours from sessions in minutes
 */
function calculateWorkingMinutes(sessions: SessionData[]): number {
  let totalMinutes = 0
  
  for (const session of sessions) {
    if (session.check_out) {
      const checkIn = new Date(session.check_in)
      const checkOut = new Date(session.check_out)
      const duration = checkOut.getTime() - checkIn.getTime()
      totalMinutes += Math.floor(duration / (1000 * 60))
    }
  }
  
  return totalMinutes
}

/**
 * Get the earliest check-in time from sessions
 */
function getEarliestCheckIn(sessions: SessionData[]): Date | null {
  if (sessions.length === 0) return null
  
  return sessions.reduce((earliest, session) => {
    const checkInTime = new Date(session.check_in)
    return !earliest || checkInTime < earliest ? checkInTime : earliest
  }, null as Date | null)
}

/**
 * Calculate attendance status based on business rules
 * 
 * Rules:
 * - Present: Has sessions + worked >= 4 hours + checked in within 10 minutes of shift start
 * - Late: Has sessions + checked in more than 10 minutes after shift start
 * - Half Day: Has sessions + worked >= 3.5 hours and < 4 hours (but not late)
 * - Leave: Has approved leave for that date (TODO: implement when leave API is available)
 * - Absent: No sessions for the entire day OR worked < 3.5 hours
 */
export async function calculateAttendanceStatus(
  sessions: SessionData[],
  date: string,
  totalHours?: string,
  isOnLeave?: boolean
): Promise<AttendanceStatusResult> {
  // If on approved leave, mark as leave
  if (isOnLeave) {
    return { status: 'leave', reason: 'Approved leave' }
  }
  
  // If no sessions, mark as absent
  if (!sessions || sessions.length === 0) {
    return { status: 'absent', reason: 'No check-in sessions' }
  }
  
  // Calculate working time in minutes
  const workingMinutes = totalHours 
    ? (() => {
        const [hours, minutes, seconds] = totalHours.split(':').map(Number)
        return hours * 60 + (minutes || 0) + Math.floor((seconds || 0) / 60)
      })()
    : calculateWorkingMinutes(sessions)
  
  // Get user's assigned shifts
  const user = await getCurrentUserWithShifts()
  const shifts = await getShifts()
  
  if (!user?.shifts || user.shifts.length === 0 || shifts.length === 0) {
    // Fallback logic when no shift information is available
    if (workingMinutes >= 240) { // 4+ hours
      return { status: 'present', reason: `Worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m` }
    } else if (workingMinutes >= 210) { // 3.5+ hours
      return { status: 'half-day', reason: `Half day - worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m` }
    } else {
      return { status: 'absent', reason: `Insufficient working time: ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m (minimum 3.5h required)` }
    }
  }
  
  // Find the user's primary shift (assume first assigned shift for now)
  const primaryShiftId = user.shifts[0]
  const primaryShift = shifts.find(s => s.id === primaryShiftId)
  
  if (!primaryShift) {
    // Fallback if shift not found
    if (workingMinutes >= 240) { // 4+ hours
      return { status: 'present', reason: `Worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m` }
    } else if (workingMinutes >= 210) { // 3.5+ hours
      return { status: 'half-day', reason: `Half day - worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m` }
    } else {
      return { status: 'absent', reason: `Insufficient working time: ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m (minimum 3.5h required)` }
    }
  }
  
  // Get earliest check-in time
  const earliestCheckIn = getEarliestCheckIn(sessions)
  if (!earliestCheckIn) {
    return { status: 'absent', reason: 'No valid check-in time' }
  }
  
  // Calculate shift start time for the given date
  const shiftStartMinutes = timeToMinutes(primaryShift.start_time)
  const checkInDate = new Date(date)
  checkInDate.setHours(Math.floor(shiftStartMinutes / 60))
  checkInDate.setMinutes(shiftStartMinutes % 60)
  checkInDate.setSeconds(0)
  checkInDate.setMilliseconds(0)
  
  // Calculate how late the employee was (in minutes)
  const lateMinutes = Math.floor((earliestCheckIn.getTime() - checkInDate.getTime()) / (1000 * 60))
  
  // Apply business rules
  if (workingMinutes < 210) {
    // Absent: worked less than 3.5 hours regardless of timing
    return { 
      status: 'absent', 
      reason: `Insufficient working time: ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m (minimum 3.5h required)` 
    }
  } else if (lateMinutes > 10) {
    // Late: checked in more than 10 minutes after shift start
    return { 
      status: 'late', 
      reason: `Late by ${lateMinutes} minutes (shift starts at ${primaryShift.start_time})` 
    }
  } else if (workingMinutes < 240) {
    // Half day: worked 3.5-4 hours and was on time
    return { 
      status: 'half-day', 
      reason: `Half day - worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m` 
    }
  } else {
    // Present: on time and worked sufficient hours (4+)
    return { 
      status: 'present', 
      reason: `On time and worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m` 
    }
  }
}

/**
 * Clear caches (useful for testing or when shift data changes)
 */
export function clearAttendanceStatusCache(): void {
  shiftsCache = null
  userShiftsCache = null
}