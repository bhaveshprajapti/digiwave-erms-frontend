"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const attendanceData: Record<string, "present" | "absent" | "late" | "half-day" | "leave"> = {
  "2025-10-01": "present",
  "2025-10-02": "present",
  "2025-10-03": "late",
  "2025-10-04": "present",
  "2025-10-05": "present",
  "2025-10-08": "leave",
  "2025-10-09": "leave",
  "2025-10-10": "present",
  "2025-10-11": "half-day",
}

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)) // October 2025

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attendance Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const status = attendanceData[dateStr]
              return (
                <div
                  key={day}
                  className="relative flex h-10 items-center justify-center rounded-lg border text-sm font-medium hover:bg-muted"
                >
                  {day}
                  {status && <div className={`absolute bottom-1 h-1 w-1 rounded-full ${getStatusColor(status)}`} />}
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span>Half-day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Absent</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
