import { AttendanceClockCard } from "@/components/attendance/attendance-clock-card"
import { EnhancedAttendanceCalendar } from "@/components/attendance/enhanced-attendance-calendar"
import { AttendanceHistory } from "@/components/attendance/attendance-history"

export default function EmployeeAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance, work hours, holidays and leaves</p>
      </div>
      <AttendanceClockCard />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <EnhancedAttendanceCalendar />
        <AttendanceHistory />
      </div>
    </div>
  )
}
