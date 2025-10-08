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
  MapPin
} from "lucide-react"
import authService from "@/lib/auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { checkIn, checkOut, getAttendanceStatus, AttendanceStatus } from "@/lib/api/attendances"
import { Button } from "@/components/ui/button"

export function EmployeeDashboard() {
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
      const leaveRequestsPromise = api.get(`/leave/leave-requests/?user=${userData.id}`)
        .then(res => Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [])
        .catch(() => [])

      // Fetch leave balances (if API exists) 
      const leaveBalancesPromise = api.get('/leave/leave-balances/')
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

  // Load user profile with shifts
  const loadUserProfile = async () => {
    const userData = authService.getUserData()
    if (!userData?.id) return
    
    try {
      const response = await api.get(`/accounts/users/${userData.id}/`)
      const fullUser = response.data
      setUserShifts(fullUser.shifts || [])
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

  // Validate if current time is within shift hours
  const validateShiftTiming = async () => {
    if (userShifts.length === 0) {
      // If no shifts assigned, allow check-in (fallback)
      return { allowed: true, message: '' }
    }

    try {
      // Fetch shift details
      const shiftsResponse = await api.get('/common/shifts/')
      const allShifts = shiftsResponse.data || []
      
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes
      
      // Check if current time falls within any assigned shift
      for (const shiftId of userShifts) {
        const shift = allShifts.find((s: any) => s.id === shiftId)
        if (!shift) continue
        
        const [startHour, startMin] = shift.start_time.split(':').map(Number)
        const [endHour, endMin] = shift.end_time.split(':').map(Number)
        
        let startTime = startHour * 60 + startMin
        let endTime = endHour * 60 + endMin
        
        // Handle overnight shifts
        if (shift.is_overnight && endTime < startTime) {
          // For overnight shifts, check if current time is after start OR before end
          if (currentTime >= startTime || currentTime <= endTime) {
            return { allowed: true, message: '' }
          }
        } else {
          // For regular shifts, check if current time is between start and end
          if (currentTime >= startTime && currentTime <= endTime) {
            return { allowed: true, message: '' }
          }
        }
      }
      
      // If we reach here, current time is not within any shift
      const shift = allShifts.find((s: any) => s.id === userShifts[0]) // Get first assigned shift
      if (shift) {
        return {
          allowed: false,
          message: `Check-in only allowed during shift hours: ${shift.start_time} - ${shift.end_time}`
        }
      }
      
      return {
        allowed: false,
        message: 'Check-in not allowed outside shift hours'
      }
    } catch (error) {
      console.error('Error validating shift timing:', error)
      // On error, allow check-in (fallback)
      return { allowed: true, message: '' }
    }
  }

  const handleClockIn = async () => {
    if (isAttendanceLoading) return
    setIsAttendanceLoading(true)
    
    try {
      // Validate shift timing first
      const validation = await validateShiftTiming()
      if (!validation.allowed) {
        toast({
          title: "Check-in Restricted",
          description: validation.message,
          variant: "destructive",
        })
        return
      }
      
      const locationData = location || { lat: 0, lng: 0 }
      const response = await checkIn({ location: locationData })
      
      toast({
        title: "Success", 
        description: `Checked in successfully! Session ${response.session_count}`,
      })
      
      await loadAttendanceStatus()
      await loadDashboardData() // Refresh activity feed
      
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

  const handleClockOut = async () => {
    if (isAttendanceLoading) return
    setIsAttendanceLoading(true)
    
    try {
      const locationData = location || { lat: 0, lng: 0 }
      const response = await checkOut({ location: locationData })
      
      toast({
        title: "Success",
        description: `Checked out successfully! Total time: ${response.total_hours}`,
      })
      
      await loadAttendanceStatus()
      await loadDashboardData() // Refresh activity feed
      
    } catch (error: any) {
      console.error('Check-out error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to check out",
        variant: "destructive",
      })
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  // Check if check-in should be disabled (sync version for UI)
  const isCheckInDisabled = () => {
    if (userShifts.length === 0) return false // Allow if no shifts assigned
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    // This is a simplified check - we'll do full validation in the actual check-in
    // For UI purposes, we'll be more lenient to avoid fetching shifts every second
    return false // For now, let the backend validation handle it
  }

  useEffect(() => {
    const u = authService.getUserData()
    if (u) {
      setUser(u)
      loadDashboardData()
      loadAttendanceStatus()
      loadUserProfile()
      
      // Get location
      getUserLocation().then(setLocation)
      
      // Setup timer for current time
      setCurrentTime(new Date())
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [])


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
              onClick={() => loadDashboardData()}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-background hover:bg-muted rounded-md transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div>
              <p className="text-muted-foreground text-sm">Today</p>
              <p className="text-xl font-semibold">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Attendance Widget */}
      <Card className={`border-l-4 bg-gradient-to-br from-card to-muted/20 transition-all duration-500 ${
        attendanceStatus?.is_checked_in 
          ? 'border-l-green-500 ring-1 ring-green-500/20 shadow-md'
          : 'border-l-blue-500'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Quick Attendance
            </div>
            {attendanceStatus?.is_checked_in && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Active Session
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {/* Timer Display - Left Side */}
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-xl flex items-center justify-center transition-all duration-300 ${
                attendanceStatus?.is_checked_in 
                  ? 'bg-green-100 shadow-md' 
                  : 'bg-blue-100 shadow-sm'
              }`}>
                <Timer className={`h-8 w-8 transition-colors duration-300 ${
                  attendanceStatus?.is_checked_in ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Working Time</p>
                <p className={`text-2xl font-bold font-mono tracking-wide transition-colors duration-300 ${
                  attendanceStatus?.is_checked_in ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {liveWorkingTime}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attendanceStatus?.is_checked_in ? "Live timer running" : "Total for today"}
                </p>
              </div>
            </div>
            
            {/* Check-in/out Button - Right Side */}
            <div className="flex-shrink-0">
              {!attendanceStatus?.is_checked_in ? (
                <Button 
                  onClick={handleClockIn} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white border-0 px-6"
                  disabled={isAttendanceLoading || attendanceStatus?.is_on_leave}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isAttendanceLoading ? "Checking In..." : "Check In"}
                </Button>
              ) : (
                <Button 
                  onClick={handleClockOut} 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white border-0 px-6"
                  disabled={isAttendanceLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isAttendanceLoading ? "Checking Out..." : "Check Out"}
                </Button>
              )}
            </div>
          </div>
          
          {/* Additional Info Row */}
          <div className="mt-4 pt-4 border-t border-muted flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{currentTime?.toLocaleTimeString() || "--:--:--"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Sessions: {attendanceStatus?.total_sessions || 0}</span>
              <span>•</span>
              <span>Completed: {attendanceStatus?.completed_sessions || 0}</span>
            </div>
            {attendanceStatus?.last_check_in && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Last check-in: {new Date(attendanceStatus.last_check_in).toLocaleTimeString()}</span>
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
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'profile_update' ? 'bg-blue-100' :
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
