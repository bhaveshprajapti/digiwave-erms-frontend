"use client"

import { useEffect, useState } from "react"
import { AttendanceClockCard } from "@/components/attendance/attendance-clock-card"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceHistory } from "@/components/attendance/attendance-history"
import { getAttendanceStatus, AttendanceStatus } from "@/lib/api/attendances"
import { useAttendanceUpdates } from "@/hooks/use-attendance-updates"

export default function EmployeeAttendancePage() {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAttendanceStatus = async () => {
    try {
      const status = await getAttendanceStatus()
      setAttendanceStatus(status)
    } catch (error) {
      console.error('Error loading attendance status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Listen for attendance updates
  useAttendanceUpdates(() => {
    loadAttendanceStatus()
  })

  useEffect(() => {
    loadAttendanceStatus()
  }, [])

  // Get background class based on attendance status
  const getBackgroundClass = () => {
    if (loading || !attendanceStatus) return ""
    
    if (attendanceStatus.day_ended) {
      return "bg-gradient-to-br from-gray-50/30 via-background to-background"
    } else if (attendanceStatus.is_on_break) {
      return "bg-gradient-to-br from-yellow-50/40 via-yellow-50/20 to-background"
    } else if (attendanceStatus.is_checked_in) {
      return "bg-gradient-to-br from-green-50/40 via-green-50/20 to-background"
    }
    
    return "bg-gradient-to-br from-blue-50/30 via-background to-background"
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${getBackgroundClass()}`}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Attendance</h2>
          <p className="text-muted-foreground">Track your daily attendance and work hours</p>
        </div>
        <AttendanceClockCard />
        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceCalendar />
          <AttendanceHistory />
        </div>
      </div>
    </div>
  )
}