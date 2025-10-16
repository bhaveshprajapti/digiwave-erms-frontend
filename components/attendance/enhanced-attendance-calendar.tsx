"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SessionDetailsModal } from "./session-details-modal"
import { LeaveDetailsModal } from "./leave-details-modal"
import { listAttendances } from "@/lib/api/attendances"
import { getMyLeaveApplications } from "@/lib/api/leave-requests"
import { authService } from "@/lib/auth"
import { useHolidays } from "@/hooks/use-holidays"
import { useAttendanceUpdates } from "@/hooks/use-attendance-updates"
import { LeaveRequest } from "@/lib/schemas"
import { getDateRange, parseDateFromBackend } from "@/lib/utils/date-utils"

interface AttendanceData {
  status: string
  sessions: any[]
  total_hours?: string
  notes?: string
}

interface LeaveData {
  id: number
  leave_type: number
  start_date: string
  end_date: string
  status?: number
  reason: string
  rejection_reason?: string | null
  created_at?: string
  half_day_type?: string | null
}

export function EnhancedAttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceData>>({})
  const [leaveData, setLeaveData] = useState<Record<string, LeaveData[]>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedLeave, setSelectedLeave] = useState<LeaveData | null>(null)
  const [userId, setUserId] = useState<number | undefined>()

  const { holidays } = useHolidays()

  useEffect(() => {
    const user = authService.getUserData()
    if (user?.id) {
      setUserId(user.id)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [currentDate, userId])

  // Listen for attendance updates and refresh calendar
  useAttendanceUpdates(() => {
    if (userId) {
      console.log('Enhanced Calendar: Attendance event received - refreshing data')
      loadData()
    }
  })

  const loadData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
      const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)

      // Load attendance data
      const attendanceResponse = await listAttendances({
        user: userId,
        start_date: startDate,
        end_date: endDate,
      })

      const attendanceMap: Record<string, AttendanceData> = {}

      // Process each attendance record using backend status
      for (const record of attendanceResponse.results) {
        const sessions = record.sessions || []

        // Use backend calculated status - prefer calendar_status if available, fallback to attendance_status
        let status = "absent"
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
              status = "leave"
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

        attendanceMap[record.date] = {
          status,
          sessions,
          total_hours: record.total_hours,
          notes: record.notes
        }
      }

      // Load leave data
      const leaveResponse = await getMyLeaveApplications({})
      const leaveMap: Record<string, LeaveData[]> = {}

      // Process leave requests to map them to dates using centralized date utilities
      for (const leave of leaveResponse) {
        // Use centralized utility to get inclusive date range
        const leaveDates = getDateRange(leave.start_date, leave.end_date)
        
        // Map each date in the leave period
        for (const dateStr of leaveDates) {
          if (!leaveMap[dateStr]) {
            leaveMap[dateStr] = []
          }
          
          leaveMap[dateStr].push({
            id: leave.id,
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            status: leave.status,
            reason: leave.reason,
            rejection_reason: leave.rejection_reason,
            created_at: leave.created_at,
            half_day_type: leave.half_day_type
          })
        }
      }

      setAttendanceData(attendanceMap)
      setLeaveData(leaveMap)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (dateStr: string) => {
    // Check if there are leaves on this date
    if (leaveData[dateStr] && leaveData[dateStr].length > 0) {
      setSelectedLeave(leaveData[dateStr][0]) // Show first leave if multiple
      setLeaveModalOpen(true)
      return
    }
    
    // Otherwise show attendance data
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
      present: "bg-emerald-500",
      absent: "bg-red-500",
      late: "bg-orange-500",
      "half-day": "bg-yellow-500",
      leave: "bg-blue-500",
    }
    return colors[status] || "bg-muted"
  }

  // Check if date is a holiday
  const isHoliday = (dateStr: string) => {
    return holidays.some(holiday => holiday.date === dateStr)
  }

  const getHoliday = (dateStr: string) => {
    return holidays.find(holiday => holiday.date === dateStr)
  }

  // Check if date has leave
  const hasLeave = (dateStr: string) => {
    return leaveData[dateStr] && leaveData[dateStr].length > 0
  }

  const getLeaveStatus = (leaves: LeaveData[]) => {
    // Return status based on first leave (if multiple leaves on same date)
    const leave = leaves[0]
    switch (leave.status) {
      case 1: return 'approved'
      case 2: return 'rejected' 
      case 0:
      default: return 'pending'
    }
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Attendance & Holidays Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth} disabled={loading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth} disabled={loading}>
                <ChevronRight className="h-4 w-4" />
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
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const attendanceInfo = attendanceData[dateStr]
                const holiday = getHoliday(dateStr)
                const leaves = leaveData[dateStr] || []
                const hasData = !!attendanceInfo || holiday || leaves.length > 0
                const today = new Date().toISOString().slice(0, 10) === dateStr

                return (
                  <div
                    key={day}
                    className={`
                      relative flex flex-col h-10 items-center justify-center rounded text-xs font-medium transition-colors
                      ${hasData
                        ? "cursor-pointer hover:bg-muted border hover:border-primary/50"
                        : "text-muted-foreground"
                      }
                      ${today
                        ? "ring-1 ring-primary ring-offset-1"
                        : ""
                      }
                      ${holiday ? "bg-gray-100 border-gray-300" : "bg-muted/20"}
                    `}
                    onClick={() => hasData && handleDateClick(dateStr)}
                    title={
                      holiday 
                        ? `Public Holiday: ${holiday.title}${leaves.length > 0 ? ' | Click to view leave details' : ''}`
                        : leaves.length > 0 
                          ? `Leave: ${getLeaveStatus(leaves)} | Click to view details`
                          : attendanceInfo 
                            ? `Click to view sessions for ${dateStr}` 
                            : undefined
                    }
                  >
                    <span className="text-center">{day}</span>
                    
                    {/* Holiday indicator */}
                    {holiday && (
                      <div className="absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full bg-gray-700" 
                           title={`Holiday: ${holiday.title}`} />
                    )}
                    
                    {/* Leave indicator */}
                    {leaves.length > 0 && (
                      <div className={`absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${
                        getLeaveStatus(leaves) === 'approved' ? 'bg-cyan-600' :
                        getLeaveStatus(leaves) === 'rejected' ? 'bg-pink-600' :
                        'bg-amber-600'
                      }`} title={`Leave: ${getLeaveStatus(leaves)}`} />
                    )}
                    
                    {/* Attendance status indicator */}
                    {attendanceInfo && !leaves.length && (
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
            <div className="space-y-2 pt-2 text-xs border-t">
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
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
                  <span>Leave</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Absent</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-gray-700" />
                  <span>Public Holiday</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-cyan-600" />
                  <span>Approved Leave</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-600" />
                  <span>Pending Leave</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-pink-600" />
                  <span>Rejected Leave</span>
                </div>
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

      {/* Leave Details Modal */}
      <LeaveDetailsModal
        open={leaveModalOpen}
        onOpenChange={setLeaveModalOpen}
        leave={selectedLeave}
      />
    </>
  )
}