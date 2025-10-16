"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { useToast } from "@/hooks/use-toast"
import { Clock, MapPin, LogIn, LogOut, Users, Timer, Coffee } from "lucide-react"
import { checkIn, startBreak, endBreak, endOfDay, getAttendanceStatus, AttendanceStatus } from "@/lib/api/attendances"
import { getMyLeaveApplications } from "@/lib/api/leave-requests"
import authService from "@/lib/auth"
import api from "@/lib/api"
import { attendanceEvents } from "@/hooks/use-attendance-updates"
import Swal from 'sweetalert2'

export function AttendanceClockCard() {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [liveWorkingTime, setLiveWorkingTime] = useState<string>("0:00:00")
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [userShifts, setUserShifts] = useState<any[]>([])
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [liveBreakTime, setLiveBreakTime] = useState<string>("0:00:00")
  const [shiftsData, setShiftsData] = useState<any[]>([]) // Cache shift data
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false)
  const [dayEnded, setDayEnded] = useState<boolean>(false)

  // Get user's location
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Could not get location:', error.message)
          // Use a default location if geolocation fails
          resolve({ lat: 0, lng: 0 })
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    })
  }

  // Load attendance status
  const loadAttendanceStatus = async () => {
    try {
      const status = await getAttendanceStatus()
      console.log('Loading attendance status:', status)
      
      setAttendanceStatus(status)
      setIsOnBreak(status.is_on_break || false)
      setDayEnded(status.day_ended || false)

      // Clear localStorage states first
      localStorage.removeItem('breakStartTime')

      // Set current session start time if checked in and not on break
      if (status.is_checked_in && status.last_check_in && !status.is_on_break) {
        setCurrentSessionStart(new Date(status.last_check_in))
        setBreakStartTime(null)
        console.log('User is checked in and working')
      } else if (status.is_on_break && status.break_start_time) {
        // User is on break
        const breakStart = new Date(status.break_start_time)
        setBreakStartTime(breakStart)
        setCurrentSessionStart(null) // Clear working session when on break
        localStorage.setItem('breakStartTime', breakStart.toISOString())
        console.log('User is on break')
      } else {
        // User is not checked in
        setCurrentSessionStart(null)
        setBreakStartTime(null)
        console.log('User is not checked in')
        
        // Set static working hours when not checked in
        const totalHours = status.total_hours || "0:00:00"
        const cleanTime = formatDuration(totalHours)
        setLiveWorkingTime(cleanTime)
      }
    } catch (error: any) {
      console.error('Error loading attendance status:', error)
      // Reset states on error
      setAttendanceStatus(null)
      setIsOnBreak(false)
      setDayEnded(false)
      setCurrentSessionStart(null)
      setBreakStartTime(null)
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
      console.log('User profile and shifts loaded once')
    } catch (error) {
      console.error('Error loading user profile:', error)
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
        const now = new Date()
        const currentHour = now.getHours()

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

  // Check if current time is after shift end (for break timer) - using IST
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
        console.log('Shifts data loaded once for validation')
      }

      const currentTime = getISTTimeInMinutes() // Current time in minutes (IST)

      let validShifts = []

      // Check if current time falls within any assigned shift
      for (const shiftId of userShifts) {
        const shift = allShifts.find((s: any) => s.id === shiftId)
        if (!shift) continue

        validShifts.push(shift)

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
      if (validShifts.length > 0) {
        const shiftTimes = validShifts.map(s => `${s.start_time} - ${s.end_time}`).join(', ')
        return {
          allowed: false,
          message: `Check-in allowed from 9 AM or up to 15 minutes after shift start. Shift hours: ${shiftTimes}`
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

  // Initial setup effect
  useEffect(() => {
    setIsClient(true)
    setIsMounted(true)
    setCurrentTime(getCurrentIST())

    // Clear any stale localStorage data first
    const storedBreakTime = localStorage.getItem('breakStartTime')
    if (storedBreakTime) {
      // Check if stored break time is from today
      const storedDate = new Date(storedBreakTime).toDateString()
      const today = new Date().toDateString()
      if (storedDate !== today) {
        localStorage.removeItem('breakStartTime')
        console.log('Cleared stale break time from localStorage')
      }
    }

    // Load initial attendance status
    loadAttendanceStatus()

    // Load user profile and shifts
    loadUserProfile()

    // Get user location
    getUserLocation().then(setLocation).catch(() => {
      console.warn('Using default location')
      setLocation({ lat: 0, lng: 0 })
    })
  }, [])

  // Timer effect for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      const now = getCurrentIST() // Use IST instead of local time
      setCurrentTime(now)

      // Calculate live working time if checked in and working (original working logic)
      if (currentSessionStart && attendanceStatus?.is_checked_in && !isOnBreak) {
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
      } else {
        // Use static total hours when not working or on break
        const totalHours = attendanceStatus?.total_hours || "0:00:00"
        const cleanTime = formatDuration(totalHours)
        setLiveWorkingTime(cleanTime)
      }

      // Calculate live break time if on break
      if (isOnBreak && breakStartTime) {
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
  }, [currentSessionStart, attendanceStatus?.is_checked_in, attendanceStatus?.total_hours, breakStartTime, attendanceStatus?.total_break_time, isOnBreak])

  // No automatic status refresh - only update on events

  // Initialize working time when attendance status changes
  useEffect(() => {
    if (attendanceStatus) {
      if (!attendanceStatus.is_checked_in) {
        const totalHours = attendanceStatus.total_hours || "0:00:00"
        const cleanTime = totalHours.split('.')[0]
        setLiveWorkingTime(cleanTime)
      }
    }
  }, [attendanceStatus])

  const handleClockIn = async () => {
    if (isLoading) return
    setIsLoading(true)

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

      // Set current session start time immediately and clear break time
      setCurrentSessionStart(new Date(response.check_in_time))
      setBreakStartTime(null)

      // Clear break start time from localStorage
      localStorage.removeItem('breakStartTime')

      toast({
        title: "Success",
        description: `Checked in successfully! Session ${response.session_count}`,
      })

      // Refresh status after successful check-in
      await loadAttendanceStatus()

      // Dispatch event for real-time updates
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.checkIn(userData.id, response.session_count)
      }

    } catch (error: any) {
      console.error('Check-in error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to check in",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartBreak = async () => {
    if (isLoading) return
    
    // Validate state before starting break
    if (!attendanceStatus?.is_checked_in) {
      toast({
        title: "Error",
        description: "You must be checked in to start a break",
        variant: "destructive"
      })
      return
    }

    if (isOnBreak || attendanceStatus?.is_on_break) {
      toast({
        title: "Error", 
        description: "You are already on break",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await startBreak({ location: locationData })

      // Clear current session start time and set break start time
      setCurrentSessionStart(null)
      const now = new Date()
      setBreakStartTime(now)
      setIsOnBreak(true)

      // Store break start time in localStorage for persistence
      localStorage.setItem('breakStartTime', now.toISOString())

      toast({
        title: "Success",
        description: "Break started successfully!",
      })

      // Refresh status after successful break start
      await loadAttendanceStatus()

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
      setIsLoading(false)
    }
  }

  const handleEndBreak = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await endBreak({ location: locationData })

      // Set current session start time and clear break time
      setCurrentSessionStart(new Date(response.check_in_time!))
      setBreakStartTime(null)
      setIsOnBreak(false)

      // Clear break start time from localStorage
      localStorage.removeItem('breakStartTime')

      toast({
        title: "Success",
        description: "Break ended successfully! Work resumed.",
      })

      // Refresh status after successful break end
      await loadAttendanceStatus()

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
      setIsLoading(false)
    }
  }

  const handleEndOfDay = async () => {
    if (isLoading) return

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

    setIsLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await endOfDay({ location: locationData })

      // Clear all active states
      setCurrentSessionStart(null)
      setBreakStartTime(null)
      setIsOnBreak(false)
      setDayEnded(true)

      // Clear localStorage
      localStorage.removeItem('breakStartTime')

      toast({
        title: "Day Ended Successfully",
        description: `Your working day has been completed. Status: ${response.day_status}. Total hours: ${response.total_hours}`,
      })

      // Refresh status after successful day end
      await loadAttendanceStatus()

      // Force refresh for admin views - dispatch multiple events
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.endOfDay(userData.id, response.total_hours, response.day_status)
        attendanceEvents.statusUpdate(userData.id, new Date().toISOString().split('T')[0])
        attendanceEvents.refreshNeeded()
      }

      // Small delay then force another refresh to ensure admin sees updated state
      setTimeout(async () => {
        await loadAttendanceStatus()
      }, 1000)

    } catch (error: any) {
      console.error('End of day error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to end day",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return "--:--:--"
    if (!isMounted) return "--:--:--"
    return new Date(timeString).toLocaleTimeString()
  }

  // Get dynamic border color based on status (constant, no blinking)
  const getBorderColor = () => {
    if (dayEnded) {
      return "border-l-gray-500"
    }
    if (attendanceStatus?.is_on_leave) {
      return "border-l-orange-500"
    }
    if (isOnBreak) {
      return "border-l-yellow-500"
    }
    return attendanceStatus?.is_checked_in
      ? "border-l-green-500"
      : "border-l-blue-500"
  }

  // Get text color for working hours
  const getTextColor = () => {
    if (dayEnded) {
      return "text-gray-600"
    }
    if (attendanceStatus?.is_on_leave) {
      return "text-orange-600"
    }
    if (isOnBreak) {
      return "text-yellow-600"
    }
    return attendanceStatus?.is_checked_in ? "text-green-600" : "text-blue-600"
  }

  // Get background color for icon
  const getIconBgColor = () => {
    if (dayEnded) {
      return "bg-gray-100"
    }
    if (attendanceStatus?.is_on_leave) {
      return "bg-orange-100"
    }
    if (isOnBreak) {
      return "bg-yellow-100"
    }
    return attendanceStatus?.is_checked_in ? "bg-green-100" : "bg-blue-100"
  }

  // Get icon color
  const getIconColor = () => {
    if (dayEnded) {
      return "text-gray-600"
    }
    if (attendanceStatus?.is_on_leave) {
      return "text-orange-600"
    }
    if (isOnBreak) {
      return "text-yellow-600"
    }
    return attendanceStatus?.is_checked_in ? "text-green-600" : "text-blue-600"
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Working Hours Card - Dynamic Colors */}
        <Card className={`border-l-4 ${getBorderColor()} hover:shadow-md ${
          dayEnded ? 'bg-gradient-to-br from-card to-muted/20' :
          attendanceStatus?.is_checked_in ? 'bg-gradient-to-br from-green-100/60 via-green-50/30 to-card shadow-green-100/20 shadow-lg' :
          isOnBreak ? 'bg-gradient-to-br from-yellow-100/60 via-yellow-50/30 to-card shadow-yellow-100/20 shadow-lg' :
          'bg-gradient-to-br from-card to-muted/20'
        }`}>
          {/* Color overlay for active states */}
          {attendanceStatus?.is_checked_in && !dayEnded && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-200/15 via-transparent to-transparent pointer-events-none" />
          )}
          {isOnBreak && !dayEnded && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/15 via-transparent to-transparent pointer-events-none" />
          )}
          
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Hours</p>
                <p className={`text-3xl font-bold ${getTextColor()} font-mono tracking-wide`}>
                  {isMounted ? liveWorkingTime : "00:00:00"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {dayEnded ? "Day completed" : 
                   attendanceStatus?.is_checked_in ? "Live working time" : 
                   isOnBreak ? "On break" : "Today's total working time"}
                </p>
              </div>
              <div className={`h-14 w-14 ${getIconBgColor()} rounded-xl flex items-center justify-center shadow-sm`}>
                <Timer className={`h-7 w-7 ${getIconColor()}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card className={`border-l-4 border-l-purple-500 ${
          (attendanceStatus?.total_sessions || 0) > 0 ? 
            'bg-gradient-to-br from-purple-100/60 via-purple-50/30 to-card shadow-purple-100/20 shadow-lg' :
            'bg-gradient-to-br from-card to-muted/20'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions Today</p>
                <p className="text-2xl font-bold text-purple-600">
                  {attendanceStatus?.total_sessions || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {attendanceStatus?.completed_sessions || 0} completed
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Break Time Card - Dynamic Colors */}
        <Card className={`border-l-4 border-l-yellow-500 hover:shadow-md ${
          isOnBreak ? 'bg-gradient-to-br from-yellow-100/60 via-yellow-50/30 to-card shadow-yellow-100/20 shadow-lg' :
          'bg-gradient-to-br from-card to-muted/20'
        }`}>
          {/* Color overlay for break state */}
          {isOnBreak && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/15 via-transparent to-transparent pointer-events-none" />
          )}
          
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Break Time</p>
                <p className="text-2xl font-bold font-mono tracking-wide text-yellow-600">
                  {isMounted ? liveBreakTime : "0:00:00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isOnBreak ? "Currently on break" : "Today's total break time"}
                </p>
              </div>
              <div className="h-14 w-14 bg-yellow-100 rounded-xl flex items-center justify-center shadow-sm">
                <Coffee className="h-7 w-7 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className={`border-l-4 ${
          attendanceStatus?.attendance_status === 'Present' ? 
            'border-l-green-500 bg-gradient-to-br from-green-100/60 via-green-50/30 to-card shadow-green-100/20 shadow-lg' :
          attendanceStatus?.attendance_status === 'Active' ? 
            'border-l-blue-500 bg-gradient-to-br from-blue-100/60 via-blue-50/30 to-card shadow-blue-100/20 shadow-lg' :
          attendanceStatus?.attendance_status === 'Half Day' ? 
            'border-l-yellow-500 bg-gradient-to-br from-yellow-100/60 via-yellow-50/30 to-card shadow-yellow-100/20 shadow-lg' :
          attendanceStatus?.attendance_status === 'On Leave' ? 
            'border-l-orange-500 bg-gradient-to-br from-orange-100/60 via-orange-50/30 to-card shadow-orange-100/20 shadow-lg' :
          'border-l-red-500 bg-gradient-to-br from-red-100/60 via-red-50/30 to-card shadow-red-100/20 shadow-lg'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Status</p>
                <p className={`text-lg font-bold ${
                  attendanceStatus?.attendance_status === 'Present' ? 'text-green-600' :
                  attendanceStatus?.attendance_status === 'Active' ? 'text-blue-600' :
                  attendanceStatus?.attendance_status === 'Half Day' ? 'text-yellow-600' :
                    attendanceStatus?.attendance_status === 'On Leave' ? 'text-orange-600' :
                      'text-red-600'
                  }`}>
                  {attendanceStatus?.attendance_status || 'Absent'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {attendanceStatus?.is_checked_in ? "Currently checked in" :
                    (attendanceStatus?.total_sessions || 0) > 0 ? "Session completed" :
                      "No check-in today"}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                attendanceStatus?.attendance_status === 'Present' ? 'bg-green-100' :
                attendanceStatus?.attendance_status === 'Active' ? 'bg-blue-100' :
                attendanceStatus?.attendance_status === 'Half Day' ? 'bg-yellow-100' :
                  attendanceStatus?.attendance_status === 'On Leave' ? 'bg-orange-100' :
                    'bg-red-100'
                }`}>
                <Clock className={`h-6 w-6 ${
                  attendanceStatus?.attendance_status === 'Present' ? 'text-green-600' :
                  attendanceStatus?.attendance_status === 'Active' ? 'text-blue-600' :
                  attendanceStatus?.attendance_status === 'Half Day' ? 'text-yellow-600' :
                    attendanceStatus?.attendance_status === 'On Leave' ? 'text-orange-600' :
                      'text-red-600'
                  }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Card */}
      <Card className={`border-l-4 relative overflow-hidden ${getBorderColor()} ${
        attendanceStatus?.is_checked_in && !dayEnded ? 'bg-gradient-to-br from-green-100/70 via-green-50/40 to-card shadow-green-100/20 shadow-lg' :
        isOnBreak && !dayEnded ? 'bg-gradient-to-br from-yellow-100/70 via-yellow-50/40 to-card shadow-yellow-100/20 shadow-lg' :
        'bg-gradient-to-br from-card to-muted/20'
      }`}>
        {/* Color overlay for active states */}
        {attendanceStatus?.is_checked_in && !dayEnded && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-200/20 via-transparent to-transparent pointer-events-none" />
        )}
        {isOnBreak && !dayEnded && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-transparent pointer-events-none" />
        )}
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Quick Actions
            {dayEnded && (
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                <div className="h-2 w-2 bg-gray-500 rounded-full" />
                Day Completed
              </div>
            )}
            {attendanceStatus?.is_checked_in && !dayEnded && (
              <div className="ml-auto flex items-center gap-2 text-sm text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                Active Session
              </div>
            )}
            {isOnBreak && !dayEnded && (
              <div className="ml-auto flex items-center gap-2 text-sm text-yellow-600">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                On Break
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Clock/Date Info - Left Side */}
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getIconBgColor()}`}>
                {dayEnded ? (
                  <Clock className="h-5 w-5 text-gray-600" />
                ) : isOnBreak ? (
                  <Coffee className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Clock className={`h-5 w-5 ${attendanceStatus?.is_checked_in ? 'text-green-600' : 'text-slate-600'}`} />
                )}
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {isMounted && currentTime ? currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  }) : "Loading..."}
                </p>
                <p className="text-muted-foreground">
                  {isMounted && currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
                </p>
                {dayEnded ? (
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    Day completed • Status: {attendanceStatus?.attendance_status}
                  </p>
                ) : isOnBreak && breakStartTime ? (
                  <p className="text-xs text-yellow-600 mt-1 font-medium">
                    Break started: {formatTime(breakStartTime.toISOString())}
                  </p>
                ) : attendanceStatus?.last_check_in ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last check-in: {formatTime(attendanceStatus.last_check_in)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {dayEnded ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Day has ended</p>
                    <p className="text-sm">Total hours: {attendanceStatus?.total_hours} • Status: {attendanceStatus?.attendance_status}</p>
                  </div>
                </div>
              </div>
            ) : dayEnded ? (
              /* Day Ended - No actions available */
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Working day completed</p>
              </div>
            ) : isOnBreak && attendanceStatus?.is_on_break ? (
              /* End Break Button - When on break */
              <Button
                onClick={handleEndBreak}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 px-6"
                disabled={isLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? "Ending Break..." : "End Break"}
              </Button>
            ) : attendanceStatus?.is_checked_in && !isOnBreak && !dayEnded ? (
              /* Start Break and End of Day buttons when checked in and working */
              <>
                <Button
                  onClick={handleStartBreak}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 px-6"
                  disabled={isLoading}
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  {isLoading ? "Starting Break..." : "Start Break"}
                </Button>
                <Button
                  onClick={handleEndOfDay}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white border-0 px-6"
                  disabled={isLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading ? "Ending Day..." : "End of Day"}
                </Button>
              </>
            ) : !attendanceStatus?.is_checked_in && !isOnBreak && !dayEnded ? (
              /* Check In Button - When not checked in */
              <Button
                onClick={handleClockIn}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white border-0 px-6"
                disabled={isLoading || attendanceStatus?.is_on_leave}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? "Checking In..." : "Check In"}
              </Button>
            ) : null}
          </div>

          {attendanceStatus?.is_on_leave && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Coffee className="h-5 w-5" />
                <div>
                  <p className="font-medium">You are currently on approved leave</p>
                  <p className="text-sm">Check-in is disabled during your leave period.</p>
                </div>
              </div>
            </div>
          )}

          {isOnBreak && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Coffee className="h-5 w-5" />
                <div>
                  <p className="font-medium">You are currently on break</p>
                  <p className="text-sm">End your break to continue working or end the day.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
