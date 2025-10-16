"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  LogIn,
  LogOut,
  Timer,
  MapPin,
  Coffee
} from "lucide-react"
import authService from "@/lib/auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { checkIn, startBreak, endBreak, endOfDay, getAttendanceStatus, AttendanceStatus } from "@/lib/api/attendances"
import { getMyLeaveApplications } from "@/lib/api/leave-requests"
import { Button } from "@/components/ui/button"
import { attendanceEvents } from "@/hooks/use-attendance-updates"
import Swal from 'sweetalert2'

// Helper functions for secure user-specific localStorage
const getUserSpecificKey = (key: string) => {
  const userData = authService.getUserData()
  const userId = userData?.id
  if (!userId) return null
  return `${key}_user_${userId}`
}

const setUserSpecificStorage = (key: string, value: string) => {
  const userKey = getUserSpecificKey(key)
  if (userKey) {
    localStorage.setItem(userKey, value)
  }
}

const getUserSpecificStorage = (key: string) => {
  const userKey = getUserSpecificKey(key)
  if (userKey) {
    return localStorage.getItem(userKey)
  }
  return null
}

const removeUserSpecificStorage = (key: string) => {
  const userKey = getUserSpecificKey(key)
  if (userKey) {
    localStorage.removeItem(userKey)
  }
}

const clearUserSpecificStorage = () => {
  const userData = authService.getUserData()
  const userId = userData?.id
  if (!userId) return
  
  // Only clear stale data (from previous days), not current day data
  const storedBreakTime = getUserSpecificStorage('breakStartTime')
  if (storedBreakTime) {
    const storedDate = new Date(storedBreakTime).toDateString()
    const today = new Date().toDateString()
    if (storedDate !== today) {
      removeUserSpecificStorage('breakStartTime')
      console.log('Cleared stale break time from previous day')
    }
  }
  
  // Also clear any old non-user-specific keys for cleanup
  localStorage.removeItem('breakStartTime')
}

export function EmployeeDashboard() {
  // Helper function to format duration to HH:MM:SS with proper padding
  const formatDuration = (timeString?: string) => {
    if (!timeString) return "00:00:00"
    
    // Remove microseconds if present (e.g., "1:23:45.123456" -> "1:23:45")
    const cleanTime = timeString.split('.')[0]
    const parts = cleanTime.split(':')
    
    // Ensure proper padding for all parts
    const hours = (parts[0] || '0').padStart(2, '0')
    const minutes = (parts[1] || '0').padStart(2, '0')
    const seconds = (parts[2] || '0').padStart(2, '0')
    
    return `${hours}:${minutes}:${seconds}`
  }

  // Helper function to get current time in IST
  const getCurrentIST = () => {
    const now = new Date()
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
    const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
    const ist = new Date(utc + istOffset)
    return ist
  }

  // Helper function to get IST time in minutes from midnight
  const getISTTimeInMinutes = () => {
    const ist = getCurrentIST()
    return ist.getHours() * 60 + ist.getMinutes()
  }

  // Helper function to get IST hour
  const getISTHour = () => {
    const ist = getCurrentIST()
    return ist.getHours()
  }

  // Helper function to get appropriate color for attendance status
  const getStatusColor = (status?: string) => {
    if (!status) return "text-muted-foreground"
    
    switch (status.toLowerCase()) {
      case 'present':
      case 'active':
        return "text-green-600 font-medium"
      case 'half day':
        return "text-yellow-600 font-medium"
      case 'absent':
        return "text-red-600 font-medium"
      case 'on leave':
        return "text-blue-600 font-medium"
      case 'present (despite leave)':
        return "text-green-700 font-medium"
      case 'half day (despite leave)':
        return "text-yellow-700 font-medium"
      default:
        return "text-muted-foreground"
    }
  }
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalLeaves: 0,
    remainingLeaves: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)
  const [liveWorkingTime, setLiveWorkingTime] = useState<string>("0:00:00")
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userShifts, setUserShifts] = useState<any[]>([])
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [liveBreakTime, setLiveBreakTime] = useState<string>("0:00:00")
  const [shiftsData, setShiftsData] = useState<any[]>([]) // Cache shift data

  const loadDashboardData = async () => {
    const userData = authService.getUserData()
    if (!userData?.id) return

    try {
      setLoading(true)

      // Fetch profile update requests
      const profileRequestsPromise = api.get('/accounts/profile-update-requests/my_requests/')
        .then(res => Array.isArray(res.data) ? res.data : [])
        .catch(() => [])

      // Fetch leave requests (if API exists)
      const leaveRequestsPromise = api.get(`/leave/api/v1/applications/?user=${userData.id}`)
        .then(res => Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [])
        .catch(() => [])

      // Fetch leave balances (if API exists) 
      const leaveBalancesPromise = api.get('/leave/api/v1/balances/')
        .then(res => {
          const data = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : []
          return data.filter((b: any) => Number(b.user) === Number(userData.id))
        })
        .catch(() => [])

      // Fetch recent attendance activities
      const attendanceActivitiesPromise = api.get(`/attendance/attendances/?user=${userData.id}&page_size=10`)
        .then(res => {
          const data = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : []
          return data.slice(0, 10) // Get recent 10 days
        })
        .catch(() => [])

      const [profileRequests, leaveRequests, leaveBalances, attendanceActivities] = await Promise.all([
        profileRequestsPromise,
        leaveRequestsPromise,
        leaveBalancesPromise,
        attendanceActivitiesPromise
      ])

      // Calculate stats from real data
      const pendingRequests = profileRequests.filter((r: any) => r.status === 'pending').length
      const approvedRequests = profileRequests.filter((r: any) => r.status === 'approved').length

      // Calculate leave stats
      const approvedLeaves = leaveRequests.filter((r: any) => r.status === 'approved').length
      const totalRemainingDays = leaveBalances.reduce((total: number, balance: any) => {
        const opening = Number(balance.opening_balance) || 0
        const carriedForward = Number(balance.carried_forward) || 0
        const used = Number(balance.used) || 0
        return total + Math.max(0, opening + carriedForward - used)
      }, 0)

      setStats({
        pendingRequests,
        approvedRequests,
        totalLeaves: approvedLeaves,
        remainingLeaves: totalRemainingDays
      })

      // Helper function to get relative time
      const getRelativeTime = (date: string) => {
        const now = new Date()
        const past = new Date(date)
        const diffMs = now.getTime() - past.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor(diffMs / (1000 * 60))

        if (diffDays > 7) {
          return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (diffDays > 0) {
          return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else if (diffHours > 0) {
          return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        } else if (diffMinutes > 0) {
          return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
        } else {
          return 'Just now'
        }
      }

      // Create comprehensive activity feed
      const activity: any[] = []

      // Add profile update requests
      profileRequests.forEach((req: any) => {
        activity.push({
          id: `profile_${req.id || Math.random()}`,
          type: 'profile_update',
          title: 'Profile Update Request',
          description: req.field_name === 'multiple_fields' ?
            `Multiple field update request` :
            req.details ?
              `Updated ${req.changes?.length || 1} field(s)` :
              `Updated ${(req.field || req.field_name || 'field').replace('_', ' ')}`,
          status: req.status,
          date: getRelativeTime(req.requested_at || req.created_at),
          timestamp: new Date(req.requested_at || req.created_at).getTime()
        })
      })

      // Add leave requests
      leaveRequests.forEach((req: any) => {
        activity.push({
          id: `leave_${req.id || Math.random()}`,
          type: 'leave_request',
          title: 'Leave Request',
          description: `${req.duration_days || 1} day(s) ${req.leave_type || 'leave'} from ${new Date(req.start_date).toLocaleDateString()}`,
          status: req.status,
          date: getRelativeTime(req.created_at || req.start_date),
          timestamp: new Date(req.created_at || req.start_date).getTime()
        })
      })

      // Add attendance activities (check-ins, check-outs)
      attendanceActivities.forEach((attendance: any) => {
        const sessions = attendance.sessions || []

        sessions.forEach((session: any, sessionIndex: number) => {
          // Add check-in activity
          if (session.check_in) {
            activity.push({
              id: `checkin_${attendance.date}_${sessionIndex}`,
              type: 'check_in',
              title: 'Checked In',
              description: `Session ${sessionIndex + 1} - ${new Date(session.check_in).toLocaleTimeString()}`,
              status: 'completed',
              date: getRelativeTime(session.check_in),
              timestamp: new Date(session.check_in).getTime()
            })
          }

          // Add check-out activity
          if (session.check_out) {
            const duration = session.check_out && session.check_in ?
              Math.floor((new Date(session.check_out).getTime() - new Date(session.check_in).getTime()) / (1000 * 60)) : 0

            activity.push({
              id: `checkout_${attendance.date}_${sessionIndex}`,
              type: 'check_out',
              title: 'Checked Out',
              description: `Session ${sessionIndex + 1} - ${new Date(session.check_out).toLocaleTimeString()} (${Math.floor(duration / 60)}h ${duration % 60}m)`,
              status: 'completed',
              date: getRelativeTime(session.check_out),
              timestamp: new Date(session.check_out).getTime()
            })
          }
        })
      })

      // Sort all activities by timestamp (most recent first) and take top 10
      const sortedActivity = activity
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)

      setRecentActivity(sortedActivity)

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)

      // Only show toast if it's not a network/API unavailability issue
      if (error?.response?.status !== 404) {
        toast({
          title: 'Notice',
          description: 'Some dashboard data may not be available',
          variant: 'default'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Load user profile with shifts and cache shift data
  const loadUserProfile = async () => {
    const userData = authService.getUserData()
    if (!userData?.id) return

    try {
      const [userResponse, shiftsResponse] = await Promise.all([
        api.get(`/accounts/users/${userData.id}/`),
        api.get('/common/shifts/')
      ])

      const fullUser = userResponse.data
      setUserShifts(fullUser.shifts || [])
      setShiftsData(shiftsResponse.data || [])
      console.log('User profile and shifts loaded once in dashboard')
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Attendance functions
  const loadAttendanceStatus = async () => {
    try {
      const status = await getAttendanceStatus()
      setAttendanceStatus(status)

      // Update live working time
      const totalHours = status.total_hours || "0:00:00"
      const cleanTime = totalHours.split('.')[0]
      setLiveWorkingTime(cleanTime)

      // Check if user is on break using new field
      if (status.is_on_break && status.break_start_time) {
        const breakStart = new Date(status.break_start_time)
        setBreakStartTime(breakStart)
        setUserSpecificStorage('breakStartTime', breakStart.toISOString())
      } else {
        setBreakStartTime(null)
        removeUserSpecificStorage('breakStartTime')
      }
    } catch (error: any) {
      console.error('Error loading attendance status:', error)
    }
  }

  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0 })
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          resolve({ lat: 0, lng: 0 })
        },
        { timeout: 5000 }
      )
    })
  }

  // Check if current time is after shift end (for break timer) - using cached data
  const isAfterShiftEnd = () => {
    if (userShifts.length === 0 || shiftsData.length === 0) return false

    try {
      const currentTime = getISTTimeInMinutes()

      for (const shiftId of userShifts) {
        const shift = shiftsData.find((s: any) => s.id === shiftId)
        if (!shift) continue

        const [endHour, endMin] = shift.end_time.split(':').map(Number)
        const endTime = endHour * 60 + endMin

        // If current time is after shift end, stop break timer
        if (currentTime > endTime) {
          return true
        }
      }
      return false
    } catch (error) {
      return false
    }
  }

  // Validate if current time is within shift hours
  const validateShiftTiming = async () => {
    if (userShifts.length === 0) {
      // If no shifts assigned, allow check-in (fallback)
      return { allowed: true, message: '' }
    }

    // Check if this is the first check-in of the day
    const isFirstCheckin = !attendanceStatus || (attendanceStatus.total_sessions || 0) === 0

    // For subsequent check-ins (after break), be more lenient
    if (!isFirstCheckin) {
      const currentHour = getISTHour()
      
      // Just check if within reasonable hours (6 AM to 11 PM) in IST
      if (currentHour >= 6 && currentHour <= 23) {
        return { allowed: true, message: '' }
      } else {
        return {
          allowed: false,
          message: 'Check-in not allowed during night hours (11 PM - 6 AM IST).'
        }
      }
    }

    try {
      // Use cached shift details or fetch once if not available
      let allShifts = shiftsData
      if (allShifts.length === 0) {
        const shiftsResponse = await api.get('/common/shifts/')
        allShifts = shiftsResponse.data || []
        setShiftsData(allShifts)
        console.log('Shifts data loaded once for validation in dashboard')
      }

      const currentTime = getISTTimeInMinutes() // Current time in minutes (IST)

      // Check if current time falls within any assigned shift
      for (const shiftId of userShifts) {
        const shift = allShifts.find((s: any) => s.id === shiftId)
        if (!shift) continue

        const [startHour, startMin] = shift.start_time.split(':').map(Number)
        const [endHour, endMin] = shift.end_time.split(':').map(Number)

        let startTime = startHour * 60 + startMin
        let endTime = endHour * 60 + endMin

        // Allow check-in from 9 AM or 15 minutes after shift start
        const graceStart = Math.min(9 * 60, startTime + 15) // 9 AM or shift start + 15 min

        // Handle overnight shifts (e.g., 22:00 - 07:00)
        if (endTime < startTime) {
          // This is an overnight shift - spans across midnight
          // Check if current time is after grace start (same day) OR before end (next day)
          if (currentTime >= graceStart || currentTime <= endTime) {
            return { allowed: true, message: '' }
          }
        } else {
          // For regular shifts, check if current time is between grace start and end
          if (currentTime >= graceStart && currentTime <= endTime) {
            return { allowed: true, message: '' }
          }
        }
      }

      // If we reach here, current time is not within any shift
      const shift = allShifts.find((s: any) => s.id === userShifts[0]) // Get first assigned shift
      if (shift) {
        return {
          allowed: false,
          message: `Check-in allowed from 9 AM or up to 15 minutes after shift start. Shift hours: ${shift.start_time} - ${shift.end_time}`
        }
      }

      return {
        allowed: false,
        message: 'Check-in allowed from 9 AM or up to 15 minutes after shift start'
      }
    } catch (error) {
      console.error('Error validating shift timing:', error)
      // On error, allow check-in (fallback)
      return { allowed: true, message: '' }
    }
  }

  // Validate if user has approved leave for current date
  const validateLeaveStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

      // Get all leave applications and filter for approved ones
      const allLeaveApplications = await getMyLeaveApplications()

      // Check if user has approved leave for today (only status = 2 means approved)
      const todayLeave = allLeaveApplications.find((leave: any) => {
        const startDate = new Date(leave.start_date).toISOString().split('T')[0]
        const endDate = new Date(leave.end_date).toISOString().split('T')[0]

        // Only consider approved leaves (status = 2) - rejected/pending should not block
        const isApproved = leave.status === 2
        const isToday = today >= startDate && today <= endDate

        return isApproved && isToday
      })

      if (todayLeave) {
        // For full-day leave, completely block check-in
        if (!todayLeave.half_day_type) {
          return {
            allowed: false,
            message: `You have approved full-day leave today. Check-in is not allowed.`
          }
        }

        // For half-day leave, check the timing
        const currentHour = getISTHour()

        if (todayLeave.half_day_type === 'morning') {
          // Morning half-day leave (typically 9 AM - 1 PM)
          if (currentHour >= 9 && currentHour < 13) {
            return {
              allowed: false,
              message: `You have approved morning half-day leave (9 AM - 1 PM). Check-in allowed after 1 PM.`
            }
          }
        } else if (todayLeave.half_day_type === 'afternoon') {
          // Afternoon half-day leave (typically 1 PM - 6 PM)
          if (currentHour >= 13 && currentHour < 18) {
            return {
              allowed: false,
              message: `You have approved afternoon half-day leave (1 PM - 6 PM). Check-in allowed before 1 PM.`
            }
          }
        }

        // If it's half-day leave but outside the leave period, allow check-in
        return { allowed: true, message: '' }
      }

      return { allowed: true, message: '' }
    } catch (error) {
      console.error('Error validating leave status:', error)
      // On error, allow check-in (fallback)
      return { allowed: true, message: '' }
    }
  }

  const handleClockIn = async () => {
    if (isAttendanceLoading) return
    setIsAttendanceLoading(true)

    try {
      // Validate leave status first
      const leaveValidation = await validateLeaveStatus()
      if (!leaveValidation.allowed) {
        toast({
          title: "Check-in Restricted",
          description: leaveValidation.message,
          variant: "destructive",
        })
        return
      }

      // Validate shift timing
      const shiftValidation = await validateShiftTiming()
      if (!shiftValidation.allowed) {
        toast({
          title: "Check-in Restricted",
          description: shiftValidation.message,
          variant: "destructive",
        })
        return
      }

      const locationData = location || { lat: 0, lng: 0 }
      const response = await checkIn({ location: locationData })

      // Clear break time
      setBreakStartTime(null)
      localStorage.removeItem('breakStartTime')

      toast({
        title: "Success",
        description: `Checked in successfully! Session ${response.session_count}`,
      })

      await loadAttendanceStatus()
      await loadDashboardData() // Refresh activity feed

      // Dispatch event for real-time updates
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.checkIn(userData.id, response.session_count)
      }

    } catch (error: any) {
      console.error('Check-out error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to check in",
        variant: "destructive",
      })
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const handleStartBreak = async () => {
    if (isAttendanceLoading) return
    setIsAttendanceLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await startBreak({ location: locationData })

      // Set break start time
      const now = new Date()
      setBreakStartTime(now)
      setUserSpecificStorage('breakStartTime', now.toISOString())

      toast({
        title: "Success",
        description: "Break started successfully!",
      })

      await loadAttendanceStatus()
      await loadDashboardData() // Refresh activity feed

      // Dispatch event for real-time updates
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.startBreak(userData.id, response.session_count)
      }

    } catch (error: any) {
      console.error('Start break error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to start break",
        variant: "destructive",
      })
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const handleEndBreak = async () => {
    if (isAttendanceLoading) return
    setIsAttendanceLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await endBreak({ location: locationData })

      // Clear break start time
      setBreakStartTime(null)
      removeUserSpecificStorage('breakStartTime')

      toast({
        title: "Success",
        description: "Break ended successfully! Work resumed.",
      })

      await loadAttendanceStatus()
      await loadDashboardData() // Refresh activity feed

      // Dispatch event for real-time updates
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.endBreak(userData.id, response.session_count)
      }

    } catch (error: any) {
      console.error('End break error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to end break",
        variant: "destructive",
      })
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const handleEndOfDay = async () => {
    if (isAttendanceLoading) return

    const result = await Swal.fire({
      title: 'End Working Day',
      html: `
        <div style="text-align: left;">
          <p><strong>⚠️ WARNING:</strong> After ending the day, you will not be able to check in again today. Your working day will be completed.</p>
          <br>
          <p>If you need to take a break, please use the 'Start Break' button instead.</p>
          <br>
          <p>Are you sure you want to end your working day?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'End Day',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    setIsAttendanceLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await endOfDay({ location: locationData })

      // Clear all states
      setBreakStartTime(null)
      removeUserSpecificStorage('breakStartTime')

      toast({
        title: "Day Ended Successfully",
        description: `Your working day has been completed. Status: ${response.day_status}. Total hours: ${response.total_hours}`,
      })

      await loadAttendanceStatus()
      await loadDashboardData() // Refresh activity feed

      // Dispatch event for real-time updates
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.endOfDay(userData.id, response.total_hours, response.day_status)
      }

    } catch (error: any) {
      console.error('End of day error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to end day",
        variant: "destructive",
      })
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  // Check if check-in should be disabled (sync version for UI)
  const isCheckInDisabled = () => {
    if (userShifts.length === 0) return false // Allow if no shifts assigned

    const currentTime = getISTTimeInMinutes()

    // This is a simplified check - we'll do full validation in the actual check-in
    // For UI purposes, we'll be more lenient to avoid fetching shifts every second
    return false // For now, let the backend validation handle it
  }

  // Initial setup effect - runs only once
  useEffect(() => {
    const u = authService.getUserData()
    if (u) {
      setUser(u)
      loadDashboardData()
      loadAttendanceStatus()
      loadUserProfile()

      // Get location
      getUserLocation().then(setLocation)

      // Restore break start time from user-specific storage if exists
      const storedBreakTime = getUserSpecificStorage('breakStartTime')
      if (storedBreakTime) {
        // Validate that the stored time is from today and for current user
        const storedDate = new Date(storedBreakTime).toDateString()
        const today = new Date().toDateString()
        if (storedDate === today) {
          setBreakStartTime(new Date(storedBreakTime))
        } else {
          // Clear stale data
          removeUserSpecificStorage('breakStartTime')
        }
      }
    }
  }, []) // Empty dependency array - runs only once

  // Separate timer effect for current time, working time, and break time
  useEffect(() => {
    setCurrentTime(getCurrentIST())
    const timer = setInterval(() => {
      const now = getCurrentIST() // Use IST instead of local time
      setCurrentTime(now)

      // Calculate live working time if checked in (original working logic)
      if (attendanceStatus?.is_checked_in && !attendanceStatus?.is_on_break) {
        // Find the current session start time
        let currentSessionStart = null
        if (attendanceStatus.last_check_in) {
          currentSessionStart = new Date(attendanceStatus.last_check_in)
        }

        if (currentSessionStart) {
          const currentSessionDuration = now.getTime() - currentSessionStart.getTime()
          
          // Parse total hours from backend (completed sessions)
          const totalHoursStr = attendanceStatus.total_hours || "0:00:00"
          const timeParts = totalHoursStr.split(":")
          const prevHours = parseInt(timeParts[0]) || 0
          const prevMinutes = parseInt(timeParts[1]) || 0
          const prevSeconds = parseFloat(timeParts[2]) || 0
          const prevTotalMs = (prevHours * 3600 + prevMinutes * 60 + prevSeconds) * 1000

          const totalMs = prevTotalMs + currentSessionDuration
          const hours = Math.floor(totalMs / (1000 * 60 * 60))
          const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

          setLiveWorkingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }
      } else {
        // On break or not checked in: Use backend's real-time total (which excludes break time)
        const totalHours = attendanceStatus?.total_hours || "0:00:00"
        const cleanTime = formatDuration(totalHours)
        setLiveWorkingTime(cleanTime)
      }

      // Calculate live break time if on break
      if (attendanceStatus?.is_on_break && breakStartTime) {
        const breakDuration = now.getTime() - breakStartTime.getTime()

        // Parse existing break time from backend
        const existingBreakStr = attendanceStatus?.total_break_time || "0:00:00"
        const breakParts = existingBreakStr.split(":")
        const existingHours = parseInt(breakParts[0]) || 0
        const existingMinutes = parseInt(breakParts[1]) || 0
        const existingSeconds = parseFloat(breakParts[2]) || 0
        const existingBreakMs = (existingHours * 3600 + existingMinutes * 60 + existingSeconds) * 1000

        const totalBreakMs = existingBreakMs + breakDuration
        const hours = Math.floor(totalBreakMs / (1000 * 60 * 60))
        const minutes = Math.floor((totalBreakMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((totalBreakMs % (1000 * 60)) / 1000)

        setLiveBreakTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        // Use static break time when not on break
        const breakTime = attendanceStatus?.total_break_time || "0:00:00"
        const cleanBreakTime = formatDuration(breakTime)
        setLiveBreakTime(cleanBreakTime)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [attendanceStatus?.is_checked_in, attendanceStatus?.total_hours, attendanceStatus?.last_check_in, breakStartTime, attendanceStatus?.total_break_time, attendanceStatus?.is_on_break])


  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-muted rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-muted-foreground">
                {user.email} • Employee ID: {user.id}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center space-x-4">
            <button
              onClick={() => {
                loadDashboardData()
                loadAttendanceStatus()
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-background hover:bg-muted rounded-md transition-colors"
              disabled={loading}
              title="Refresh dashboard data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div>
              <p className="text-muted-foreground text-sm">Today</p>
              <p className="text-xl font-semibold">
                {typeof window !== 'undefined' ? new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Today'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Attendance Widget */}
      <Card className={`border-l-4 relative overflow-hidden ${attendanceStatus?.day_ended
        ? 'border-l-gray-500 bg-gradient-to-br from-card to-muted/20'
        : attendanceStatus?.is_checked_in
          ? 'border-l-green-500 bg-gradient-to-br from-green-100/70 via-green-50/40 to-card shadow-green-100/20 shadow-lg'
          : attendanceStatus?.is_on_break
            ? 'border-l-yellow-500 bg-gradient-to-br from-yellow-100/70 via-yellow-50/40 to-card shadow-yellow-100/20 shadow-lg'
            : 'border-l-blue-500 bg-gradient-to-br from-card to-muted/20'
        }`}>

        {/* Color overlay for active states */}
        {attendanceStatus?.is_checked_in && !attendanceStatus?.day_ended && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-200/20 via-transparent to-transparent pointer-events-none" />
        )}
        {attendanceStatus?.is_on_break && !attendanceStatus?.day_ended && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-transparent pointer-events-none" />
        )}

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Quick Attendance
            </div>
            {attendanceStatus?.day_ended && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-2 w-2 bg-gray-500 rounded-full" />
                Day Completed
              </div>
            )}
            {attendanceStatus?.is_checked_in && !attendanceStatus?.day_ended && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                Active Session
              </div>
            )}
            {attendanceStatus?.is_on_break && !attendanceStatus?.day_ended && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                On Break
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Timer Display - Left Side */}
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-xl flex items-center justify-center shadow-sm ${attendanceStatus?.day_ended
                ? 'bg-gray-100'
                : attendanceStatus?.is_checked_in
                  ? 'bg-green-100'
                  : attendanceStatus?.is_on_break
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
                }`}>
                {attendanceStatus?.day_ended ? (
                  <Timer className="h-8 w-8 text-gray-600" />
                ) : attendanceStatus?.is_on_break ? (
                  <Coffee className="h-8 w-8 text-yellow-600" />
                ) : (
                  <Timer className={`h-8 w-8 ${attendanceStatus?.is_checked_in ? 'text-green-600' : 'text-blue-600'
                    }`} />
                )}
              </div>
              <div>
                {attendanceStatus?.day_ended ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Day Completed</p>
                    <p className="text-2xl font-bold font-mono tracking-wide text-gray-600">
                      {liveWorkingTime}
                    </p>
                    <p className="text-xs">
                      Status: <span className={getStatusColor(attendanceStatus?.attendance_status)}>{attendanceStatus?.attendance_status}</span>
                    </p>
                  </>
                ) : attendanceStatus?.is_on_break ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Break Time</p>
                    <p className="text-2xl font-bold font-mono tracking-wide text-yellow-600">
                      {liveBreakTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Currently on break
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Today's Working Time</p>
                    <p className={`text-2xl font-bold font-mono tracking-wide ${attendanceStatus?.is_checked_in ? 'text-green-600' : 'text-blue-600'
                      }`}>
                      {liveWorkingTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attendanceStatus?.is_checked_in ? "Live timer running" : "Total for today"}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex-shrink-0 flex gap-2">
              {attendanceStatus?.day_ended ? (
                <div className="text-sm text-gray-600 px-4 py-2 bg-gray-100 rounded-md">
                  Day Completed
                </div>
              ) : !attendanceStatus?.is_checked_in && !attendanceStatus?.is_on_break ? (
                /* Check In Button - Primary action when not working */
                <Button
                  onClick={handleClockIn}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-0 px-6"
                  disabled={isAttendanceLoading || attendanceStatus?.is_on_leave}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isAttendanceLoading ? "Checking In..." : "Check In"}
                </Button>
              ) : attendanceStatus?.is_on_break ? (
                /* End Break Button - When on break - Same color as Start Break */
                <Button
                  onClick={handleEndBreak}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 px-6"
                  disabled={isAttendanceLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isAttendanceLoading ? "Ending Break..." : "End Break"}
                </Button>
              ) : attendanceStatus?.is_checked_in ? (
                /* Start Break and End of Day buttons in same row when checked in */
                <>
                  <Button
                    onClick={handleStartBreak}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 px-6"
                    disabled={isAttendanceLoading}
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    {isAttendanceLoading ? "Starting Break..." : "Start Break"}
                  </Button>
                  <Button
                    onClick={handleEndOfDay}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white border-0 px-6"
                    disabled={isAttendanceLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isAttendanceLoading ? "Ending Day..." : "End of Day"}
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="mt-4 pt-4 border-t border-muted flex items-center justify-between text-sm text-muted-foreground relative z-10">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{typeof window !== 'undefined' && currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Sessions: {attendanceStatus?.total_sessions || 0}</span>
              <span>•</span>
              <span>Completed: {attendanceStatus?.completed_sessions || 0}</span>
            </div>
            {attendanceStatus?.last_check_in && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Last check-in: {typeof window !== 'undefined' ? new Date(attendanceStatus.last_check_in).toLocaleTimeString() : '--:--:--'}</span>
              </div>
            )}
          </div>

          {attendanceStatus?.is_on_leave && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>You are currently on approved leave. Check-in is disabled.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved Requests</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leaves Taken</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalLeaves}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Leaves</p>
                <p className="text-2xl font-bold text-purple-600">{stats.remainingLeaves}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Recent Activity */}
      <Card className="border-l-4 border-l-secondary bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activity.type === 'profile_update' ? 'bg-blue-100' :
                      activity.type === 'leave_request' ? 'bg-purple-100' :
                        activity.type === 'check_in' ? 'bg-green-100' :
                          activity.type === 'check_out' ? 'bg-orange-100' : 'bg-muted'
                      }`}>
                      {activity.type === 'profile_update' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : activity.type === 'leave_request' ? (
                        <Calendar className="h-4 w-4 text-purple-600" />
                      ) : activity.type === 'check_in' ? (
                        <LogIn className="h-4 w-4 text-green-600" />
                      ) : activity.type === 'check_out' ? (
                        <LogOut className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(activity.type === 'check_in' || activity.type === 'check_out') ? (
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                        {activity.status === 'completed' ? 'Completed' : activity.status}
                      </Badge>
                    ) : (
                      <Badge
                        variant={activity.status === 'approved' || activity.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          activity.status === 'approved' ?
                            'bg-green-100 text-green-800 border-green-200' :
                            activity.status === 'completed' ?
                              'bg-blue-100 text-blue-800 border-blue-200' :
                              activity.status === 'rejected' ?
                                'bg-red-100 text-red-800 border-red-200' :
                                activity.status === 'pending' ?
                                  'bg-orange-100 text-orange-800 border-orange-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                        }
                      >
                        {activity.status}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{activity.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
