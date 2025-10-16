"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { useToast } from "@/hooks/use-toast"
import { Clock, MapPin, LogIn, LogOut, Users, Timer, Coffee } from "lucide-react"
import { checkIn, checkOut, getAttendanceStatus, AttendanceStatus } from "@/lib/api/attendances"
import { getMyLeaveApplications } from "@/lib/api/leave-requests"
import authService from "@/lib/auth"
import api from "@/lib/api"
import { attendanceEvents } from "@/hooks/use-attendance-updates"

export function AttendanceClockCard() {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [liveWorkingTime, setLiveWorkingTime] = useState<string>("0:00:00")
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [userShifts, setUserShifts] = useState<any[]>([])
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [liveBreakTime, setLiveBreakTime] = useState<string>("0:00:00")
  const [shiftsData, setShiftsData] = useState<any[]>([]) // Cache shift data

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
      setAttendanceStatus(status)

      // Set current session start time if checked in
      if (status.is_checked_in && status.last_check_in) {
        setCurrentSessionStart(new Date(status.last_check_in))
        setBreakStartTime(null) // Clear break time when checked in
      } else {
        setCurrentSessionStart(null)
        // Set static working hours when not checked in
        const totalHours = status.total_hours || "0:00:00"
        const cleanTime = totalHours.split('.')[0]
        setLiveWorkingTime(cleanTime)

        // Check if user has sessions today and is on break
        if ((status.total_sessions || 0) > 0 && (status.completed_sessions || 0) > 0 && status.last_check_out) {
          // User is on break - set break start time from last check out
          const lastCheckOut = new Date(status.last_check_out)
          setBreakStartTime(lastCheckOut)

          // Store break start time in localStorage for persistence
          localStorage.setItem('breakStartTime', lastCheckOut.toISOString())
        } else {
          setBreakStartTime(null)
          localStorage.removeItem('breakStartTime')
        }
      }
    } catch (error: any) {
      console.error('Error loading attendance status:', error)
      // Don't show error toast for status loading failures
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

  // Check if current time is after shift end (for break timer) - using cached data
  const isAfterShiftEnd = () => {
    if (userShifts.length === 0 || shiftsData.length === 0) return false

    try {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()

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

    try {
      // Use cached shift details or fetch once if not available
      let allShifts = shiftsData
      if (allShifts.length === 0) {
        const shiftsResponse = await api.get('/common/shifts/')
        allShifts = shiftsResponse.data || []
        setShiftsData(allShifts)
        console.log('Shifts data loaded once for validation')
      }

      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes

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
    setCurrentTime(new Date())

    // Load initial attendance status
    loadAttendanceStatus()

    // Load user profile and shifts
    loadUserProfile()

    // Get user location
    getUserLocation().then(setLocation).catch(() => {
      console.warn('Using default location')
      setLocation({ lat: 0, lng: 0 })
    })

    // Restore break start time from localStorage if exists
    const storedBreakTime = localStorage.getItem('breakStartTime')
    if (storedBreakTime) {
      setBreakStartTime(new Date(storedBreakTime))
    }
  }, [])

  // Timer effect for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // Calculate live working time if checked in
      if (currentSessionStart && attendanceStatus?.is_checked_in) {
        const currentSessionDuration = now.getTime() - currentSessionStart.getTime()

        // Parse total hours more safely
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
        // Use static total hours when not checked in
        const totalHours = attendanceStatus?.total_hours || "0:00:00"
        // Remove microseconds if present
        const cleanTime = totalHours.split('.')[0]
        setLiveWorkingTime(cleanTime)
      }

      // Calculate live break time if on break and within shift hours
      if (breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0) {
        // Check if we're still within shift hours using cached data
        const afterShift = isAfterShiftEnd()
        if (afterShift) {
          // Stop break timer after shift end
          setBreakStartTime(null)
          localStorage.removeItem('breakStartTime')
          return
        }

        const breakDuration = now.getTime() - breakStartTime.getTime()

        // Parse existing break time from backend
        const existingBreakStr = attendanceStatus?.break_time || "0:00:00"
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
        const breakTime = attendanceStatus?.break_time || "0:00:00"
        const cleanBreakTime = breakTime.split('.')[0]
        setLiveBreakTime(cleanBreakTime)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [currentSessionStart, attendanceStatus?.is_checked_in, attendanceStatus?.total_hours, breakStartTime, attendanceStatus?.break_time, attendanceStatus?.total_sessions])

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

  const handleClockOut = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await checkOut({ location: locationData })

      // Clear current session start time and set break start time
      setCurrentSessionStart(null)
      const now = new Date()
      setBreakStartTime(now)

      // Store break start time in localStorage for persistence
      localStorage.setItem('breakStartTime', now.toISOString())

      toast({
        title: "Success",
        description: `Checked out successfully! Break time started. Total time: ${response.total_hours}`,
      })

      // Refresh status after successful check-out
      await loadAttendanceStatus()

      // Dispatch event for real-time updates
      const userData = authService.getUserData()
      if (userData?.id) {
        attendanceEvents.checkOut(userData.id, response.session_count, response.total_hours)
      }

    } catch (error: any) {
      console.error('Check-out error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to check out",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return "--:--:--"
    return new Date(timeString).toLocaleTimeString()
  }

  // Get dynamic border color based on status with animation
  const getBorderColor = () => {
    if (attendanceStatus?.is_on_leave) {
      return "border-l-orange-500"
    }
    return attendanceStatus?.is_checked_in
      ? "border-l-green-500"
      : "border-l-blue-500"
  }

  // Get text color for working hours
  const getTextColor = () => {
    if (attendanceStatus?.is_on_leave) {
      return "text-orange-600"
    }
    return attendanceStatus?.is_checked_in ? "text-green-600" : "text-blue-600"
  }

  // Get background color for icon
  const getIconBgColor = () => {
    if (attendanceStatus?.is_on_leave) {
      return "bg-orange-100"
    }
    return attendanceStatus?.is_checked_in ? "bg-green-100" : "bg-blue-100"
  }

  // Get icon color
  const getIconColor = () => {
    if (attendanceStatus?.is_on_leave) {
      return "text-orange-600"
    }
    return attendanceStatus?.is_checked_in ? "text-green-600" : "text-blue-600"
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Working Hours Card - Dynamic Colors */}
        <Card className={`border-l-4 ${getBorderColor()} relative overflow-hidden transition-all duration-500 ${attendanceStatus?.is_checked_in
          ? 'ring-1 ring-green-500/10 shadow-md hover:shadow-lg'
          : 'hover:shadow-md'
          }`}>
          {/* Subtle progressive fill animation when checked in */}
          {attendanceStatus?.is_checked_in && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-50/20 via-transparent to-transparent animate-progressive-fill" />
          )}
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Hours</p>
                <p className={`text-3xl font-bold ${getTextColor()} font-mono tracking-wide transition-colors duration-300`}>
                  {isClient ? liveWorkingTime : "00:00:00"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {attendanceStatus?.is_checked_in ? "Live working time" : "Today's total working time"}
                </p>
              </div>
              <div className={`h-14 w-14 ${getIconBgColor()} rounded-xl flex items-center justify-center transition-all duration-300 ${attendanceStatus?.is_checked_in
                ? 'shadow-md shadow-green-500/10'
                : 'shadow-sm'
                }`}>
                <Timer className={`h-7 w-7 ${getIconColor()} transition-colors duration-300`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
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
        <Card className={`border-l-4 relative overflow-hidden transition-all duration-500 ${breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
          ? 'border-l-yellow-500 ring-1 ring-yellow-500/10 shadow-md hover:shadow-lg'
          : 'border-l-yellow-500 hover:shadow-md'
          } bg-gradient-to-br from-card to-muted/20`}>
          {/* Subtle progressive fill animation when on break */}
          {breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0 && (
            <div className="absolute inset-0 animate-progressive-fill-yellow" />
          )}
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Break Time</p>
                <p className={`text-2xl font-bold font-mono tracking-wide transition-colors duration-300 ${breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
                  ? 'text-yellow-600'
                  : 'text-yellow-600'
                  }`}>
                  {isClient ? liveBreakTime : "0:00:00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
                    ? "Live break timer running"
                    : "Today's total break time"}
                </p>
              </div>
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 ${breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
                ? 'bg-yellow-100 shadow-md shadow-yellow-500/10'
                : 'bg-yellow-100 shadow-sm'
                }`}>
                <Coffee className={`h-7 w-7 text-yellow-600 transition-colors duration-300 ${breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
                  ? 'animate-pulse'
                  : ''
                  }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className={`border-l-4 bg-gradient-to-br from-card to-muted/20 ${attendanceStatus?.attendance_status === 'Present' ? 'border-l-green-500' :
          attendanceStatus?.attendance_status === 'Half Day' ? 'border-l-yellow-500' :
            attendanceStatus?.attendance_status === 'On Leave' ? 'border-l-orange-500' :
              'border-l-red-500'
          }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Status</p>
                <p className={`text-lg font-bold ${attendanceStatus?.attendance_status === 'Present' ? 'text-green-600' :
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
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${attendanceStatus?.attendance_status === 'Present' ? 'bg-green-100' :
                attendanceStatus?.attendance_status === 'Half Day' ? 'bg-yellow-100' :
                  attendanceStatus?.attendance_status === 'On Leave' ? 'bg-orange-100' :
                    'bg-red-100'
                }`}>
                <Clock className={`h-6 w-6 ${attendanceStatus?.attendance_status === 'Present' ? 'text-green-600' :
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
      <Card className={`border-l-4 bg-gradient-to-br from-card to-muted/20 transition-all duration-500 relative overflow-hidden ${attendanceStatus?.is_checked_in
        ? 'border-l-green-500 ring-1 ring-green-500/20 shadow-md'
        : breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
          ? 'border-l-yellow-500 ring-1 ring-yellow-500/20 shadow-md'
          : 'border-l-primary'
        }`}>
        {/* Background effect for checked in state */}
        {attendanceStatus?.is_checked_in && (
          <div className="absolute inset-0 animate-progressive-fill" />
        )}
        {/* Background effect for break state */}
        {breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0 && (
          <div className="absolute inset-0 animate-progressive-fill-yellow" />
        )}
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Quick Actions
            {attendanceStatus?.is_checked_in && (
              <div className="ml-auto flex items-center gap-2 text-sm text-green-800">
                <div className="h-2 w-2 bg-green-700 rounded-full animate-pulse" />
                Active Session
              </div>
            )}
            {breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0 && (
              <div className="ml-auto flex items-center gap-2 text-sm text-yellow-600">
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                Break Time Started
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Clock/Date Info - Left Side */}
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${attendanceStatus?.is_checked_in
                ? 'bg-green-100'
                : breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0
                  ? 'bg-yellow-100'
                  : 'bg-slate-100'
                }`}>
                {breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0 ? (
                  <Coffee className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Clock className={`h-5 w-5 ${attendanceStatus?.is_checked_in ? 'text-green-600' : 'text-slate-600'
                    }`} />
                )}
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {isClient && currentTime ? currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  }) : "Loading..."}
                </p>
                <p className="text-muted-foreground">
                  {isClient && currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
                </p>
                {breakStartTime && !attendanceStatus?.is_checked_in && (attendanceStatus?.total_sessions || 0) > 0 ? (
                  <p className="text-xs text-yellow-600 mt-1 font-medium">
                    Break started: {formatTime(breakStartTime.toISOString())} • {liveBreakTime}
                  </p>
                ) : attendanceStatus?.last_check_in ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last check-in: {formatTime(attendanceStatus.last_check_in)}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Check-in/out Button - Right Side */}
            <div className="flex-shrink-0">
              {!attendanceStatus?.is_checked_in ? (
                <Button
                  onClick={handleClockIn}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-0 px-6"
                  disabled={isLoading || attendanceStatus?.is_on_leave}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? "Checking In..." : "Check In"}
                </Button>
              ) : (
                <Button
                  onClick={handleClockOut}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white border-0 px-6"
                  disabled={isLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading ? "Checking Out..." : "Check Out"}
                </Button>
              )}
            </div>
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
        </CardContent>
      </Card>
    </div>
  )
}
