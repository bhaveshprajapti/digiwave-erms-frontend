import { AttendanceClockCard } from "@/components/attendance/attendance-clock-card"
import { EnhancedAttendanceCalendar } from "@/components/attendance/enhanced-attendance-calendar"
import { AttendanceHistory } from "@/components/attendance/attendance-history"

export default function EmployeeAttendancePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-0">
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
      </div>
      <AttendanceClockCard />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <EnhancedAttendanceCalendar />
        <AttendanceHistory />
      </div>
    </div>
  )
}
