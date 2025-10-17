"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SessionDetailsModal } from "./session-details-modal"
import { listAttendances } from "@/lib/api/attendances"
import { authService } from "@/lib/auth"
import { calculateAttendanceStatus, clearAttendanceStatusCache } from "@/lib/utils/attendance-status"
import { useAttendanceUpdates } from "@/hooks/use-attendance-updates"
import { 
  getISTDateString, 
  getCurrentIST, 
  formatUTCtoISTDate,
  getUTCRangeForISTDate 
} from "@/lib/timezone"

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | undefined>()

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

  const loadAttendanceData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      // Use IST dates for calendar display
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = getISTDateString(new Date(year, month, 1))
      const endDate = getISTDateString(new Date(year, month + 1, 0))

      const data = await listAttendances({
        user: userId,
        start_date: startDate,
        end_date: endDate,
      })

      const attendanceMap: Record<string, any> = {}

      // Process each attendance record using backend status
      for (const record of data.results) {
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

      setAttendanceData(attendanceMap)
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
      leave: "bg-blue-500",
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
                    title={hasData ? `Click to view sessions for ${dateStr}` : undefined}
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
                <span>Leave</span>
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
