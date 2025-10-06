"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar } from "lucide-react"

const attendanceHistory = [
  {
    date: "2025-10-05",
    clockIn: "09:00 AM",
    clockOut: "06:00 PM",
    totalHours: "9h 0m",
    status: "present",
  },
  {
    date: "2025-10-04",
    clockIn: "09:05 AM",
    clockOut: "06:10 PM",
    totalHours: "9h 5m",
    status: "present",
  },
  {
    date: "2025-10-03",
    clockIn: "09:30 AM",
    clockOut: "06:00 PM",
    totalHours: "8h 30m",
    status: "late",
  },
  {
    date: "2025-10-02",
    clockIn: "08:55 AM",
    clockOut: "06:00 PM",
    totalHours: "9h 5m",
    status: "present",
  },
  {
    date: "2025-10-01",
    clockIn: "09:00 AM",
    clockOut: "06:00 PM",
    totalHours: "9h 0m",
    status: "present",
  },
]

export function AttendanceHistory() {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      present: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      late: { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200" },
      absent: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
      "half-day": { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    }
    const config = variants[status] || variants.present
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attendanceHistory.map((record, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                  {getStatusBadge(record.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>In: {record.clockIn}</span>
                  <span>Out: {record.clockOut}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {record.totalHours}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
