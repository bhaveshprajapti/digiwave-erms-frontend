import { AttendanceClockCard } from "@/components/attendance/attendance-clock-card"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceHistory } from "@/components/attendance/attendance-history"

export default function EmployeeAttendancePage() {
  return (
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
  )
}