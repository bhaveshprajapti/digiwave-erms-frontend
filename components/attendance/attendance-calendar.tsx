"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { SessionDetailsModal } from "./session-details-modal"
import { listAttendances } from "@/lib/api/attendances"
import { getMyLeaveApplications } from "@/lib/api/leave-requests"
// Removed context import - always fetch fresh data for calendar
import { authService } from "@/lib/auth"
import { calculateAttendanceStatus, clearAttendanceStatusCache } from "@/lib/utils/attendance-status"
import { useAttendanceUpdates } from "@/hooks/use-attendance-updates"
import { useLeaveUpdates } from "@/hooks/use-leave-updates"
import { 
  getISTDateString, 
  getCurrentIST, 
  formatUTCtoISTDate,
  getUTCRangeForISTDate 
} from "@/lib/timezone"

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({})
  const [leaveData, setLeaveData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const user = authService.getUserData()
    if (user?.id) {
      setUserId(user.id)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadAttendanceData()
    }
  }, [currentDate, userId])

  // Listen for attendance updates and refresh calendar
  useAttendanceUpdates(() => {
    if (userId) {
      console.log('Calendar: Attendance event received - refreshing data')
      loadAttendanceData()
    }
  })

  // Listen for leave updates and refresh calendar
  useLeaveUpdates(() => {
    if (userId) {
      console.log('Calendar: Leave event received - refreshing data')
      setRefreshKey(prev => prev + 1) // Force re-render
      // Add a small delay to ensure backend has processed the change
      setTimeout(() => {
        loadAttendanceData()
      }, 1000) // 1 second delay
    }
  })

  const loadAttendanceData = async () => {
    if (!userId) return

    setLoading(true)
    // Clear existing data to ensure fresh load
    setAttendanceData({})
    setLeaveData({})
    
    try {
      // Use IST dates for calendar display
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = getISTDateString(new Date(year, month, 1))
      const endDate = getISTDateString(new Date(year, month + 1, 0))

      // Load attendance data and use context leave data for consistency
      const attendanceResponse = await listAttendances({
        user: userId,
        start_date: startDate,
        end_date: endDate,
      })
      
      // Always fetch fresh leave data to ensure we have the latest status
      const leaveApplications = await getMyLeaveApplications()
      
      console.log('Calendar: Fetched fresh leave applications:', leaveApplications)
      console.log('Calendar: Leave applications count:', leaveApplications.length)
      
      // Debug: Check each leave application status
      leaveApplications.forEach((leave, index) => {
        console.log(`Calendar: Leave ${index + 1} - ID: ${leave.id}, Status: "${leave.status}" (type: ${typeof leave.status}), Dates: ${leave.start_date} to ${leave.end_date}`)
      })

      const attendanceMap: Record<string, any> = {}
      const leaveMap: Record<string, any> = {}

      // Process leave applications first
      for (const leave of leaveApplications) {
        const leaveStartDate = new Date(leave.start_date)
        const leaveEndDate = new Date(leave.end_date)
        
        // Generate all dates in the leave range
        for (let d = new Date(leaveStartDate); d <= leaveEndDate; d.setDate(d.getDate() + 1)) {
          const dateStr = getISTDateString(d)
          
          // Only include leaves for the current month
          if (dateStr >= startDate && dateStr <= endDate) {
            leaveMap[dateStr] = {
              ...leave,
              status: leave.status,
              leave_type: leave.leave_type,
              leave_type_name: leave.leave_type_name,
              reason: leave.reason,
              half_day_type: leave.half_day_type,
              rejection_reason: leave.rejection_reason
            }
            console.log(`Calendar: Added leave to map for ${dateStr}, status:`, leave.status)
          }
        }
      }

      // Process attendance records
      for (const record of attendanceResponse.results) {
        const sessions = record.sessions || []
        const dateStr = record.date

        // Check if there's a leave application for this date
        const leaveInfo = leaveMap[dateStr]
        let status = "absent"

        if (leaveInfo) {
          // Determine leave status based on leave application status
          const leaveStatus = typeof leaveInfo.status === 'string' ? leaveInfo.status.toLowerCase() : leaveInfo.status
          console.log(`Calendar: Processing leave for ${dateStr}, status:`, leaveStatus, 'original:', leaveInfo.status)
          switch (leaveStatus) {
            case 2:
            case 'approved':
              status = "leave-approved"
              break
            case 3:
            case 'rejected':
              status = "leave-rejected"
              break
            case 4:
            case 'cancelled':
              status = "leave-rejected" // Show cancelled as rejected for calendar purposes
              break
            case 1:
            case 'pending':
            case 'draft':
            default:
              status = "leave-pending"
              break
          }
          console.log(`Calendar: Final status for ${dateStr}:`, status)
        } else {
          // Use backend calculated status for attendance
          const backendStatus = record.calendar_status || record.attendance_status

          if (backendStatus) {
            // Map backend status to calendar status
            switch (backendStatus.toLowerCase()) {
              case 'present':
              case 'active':
                status = "present"
                break
              case 'half day':
              case 'half-day':
                status = "half-day"
                break
              case 'on leave':
                status = "leave-approved"
                break
              case 'absent':
              default:
                status = "absent"
                break
            }
          } else if (sessions.length > 0) {
            // Fallback: if has sessions, show as present
            status = "present"
          }
        }

        attendanceMap[dateStr] = {
          status,
          sessions,
          total_hours: record.total_hours,
          notes: record.notes,
          leave_info: leaveInfo
        }
      }

      // Add leave-only dates (dates with leave but no attendance record)
      for (const [dateStr, leaveInfo] of Object.entries(leaveMap)) {
        if (!attendanceMap[dateStr]) {
          let status = "absent"
          const leaveStatus = typeof leaveInfo.status === 'string' ? leaveInfo.status.toLowerCase() : leaveInfo.status
          console.log(`Calendar: Processing leave-only date ${dateStr}, status:`, leaveStatus, 'original:', leaveInfo.status)
          switch (leaveStatus) {
            case 2:
            case 'approved':
              status = "leave-approved"
              break
            case 3:
            case 'rejected':
              status = "leave-rejected"
              break
            case 4:
            case 'cancelled':
              status = "leave-rejected"
              break
            case 1:
            case 'pending':
            case 'draft':
            default:
              status = "leave-pending"
              break
          }
          console.log(`Calendar: Final status for leave-only date ${dateStr}:`, status)

          attendanceMap[dateStr] = {
            status,
            sessions: [],
            total_hours: null,
            notes: null,
            leave_info: leaveInfo
          }
        }
      }

      console.log('Calendar: Final attendance map:', attendanceMap)
      console.log('Calendar: Final leave map:', leaveMap)
      
      setAttendanceData(attendanceMap)
      setLeaveData(leaveMap)
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (dateStr: string) => {
    if (attendanceData[dateStr]) {
      setSelectedDate(dateStr)
      setModalOpen(true)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: "bg-green-500",
      absent: "bg-red-500",
      late: "bg-orange-500",
      "half-day": "bg-yellow-500",
      "leave-approved": "bg-blue-500",
      "leave-pending": "bg-amber-500",
      "leave-rejected": "bg-rose-500",
      leave: "bg-blue-500", // fallback
    }
    return colors[status] || "bg-muted"
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Attendance Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth} disabled={loading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {currentDate.toLocaleDateString("en-IN", { 
                  month: "long", 
                  year: "numeric",
                  timeZone: "Asia/Kolkata"
                })}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth} disabled={loading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setRefreshKey(prev => prev + 1)
                  loadAttendanceData()
                }} 
                disabled={loading}
                title="Refresh calendar data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-1">{day}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div key={refreshKey} className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const attendanceInfo = attendanceData[dateStr]
                const hasData = !!attendanceInfo
                const today = getISTDateString() === dateStr

                return (
                  <div
                    key={day}
                    className={`
                      relative flex h-8 items-center justify-center rounded text-xs font-medium transition-colors
                      ${hasData
                        ? "cursor-pointer hover:bg-muted border hover:border-primary/50 bg-muted/20"
                        : "text-muted-foreground"
                      }
                      ${today
                        ? "ring-1 ring-primary ring-offset-1"
                        : ""
                      }
                    `}
                    onClick={() => hasData && handleDateClick(dateStr)}
                    title={hasData ? (() => {
                      const status = attendanceInfo.status
                      let statusText = ""
                      switch (status) {
                        case "present": statusText = "Present"; break
                        case "absent": statusText = "Absent"; break
                        case "late": statusText = "Late"; break
                        case "half-day": statusText = "Half-day"; break
                        case "leave-approved": statusText = "Leave Approved"; break
                        case "leave-pending": statusText = "Leave Pending"; break
                        case "leave-rejected": statusText = "Leave Rejected"; break
                        default: statusText = "Unknown"
                      }
                      return `${statusText} | Click to view details`
                    })() : undefined}
                  >
                    {day}
                    {attendanceInfo && (
                      <div className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${getStatusColor(attendanceInfo.status)}`} />
                    )}
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <div className="h-2 w-2 animate-pulse bg-muted-foreground rounded-full" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 pt-2 text-xs border-t">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span>Late</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>Half-day</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Leave Approved</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Leave Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Leave Rejected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Absent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      <SessionDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        attendance={selectedDate ? {
          date: selectedDate,
          ...attendanceData[selectedDate]
        } : null}
      />
    </>
  )
}
