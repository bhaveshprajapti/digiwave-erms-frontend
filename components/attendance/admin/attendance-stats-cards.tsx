"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, CheckCircle, XCircle, Calendar, TrendingUp } from "lucide-react"
import { listAttendances } from "@/lib/api/attendances"
import { useEmployees } from "@/hooks/use-employees"
import { getISTDateString } from "@/lib/timezone"

interface AttendanceStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  totalHoursToday: string
  avgHoursThisWeek: string
  attendanceRate: number
}

export function AttendanceStatsCards() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    totalHoursToday: "0:00",
    avgHoursThisWeek: "0:00",
    attendanceRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const { employees } = useEmployees()

  const loadStats = async () => {
    try {
      setLoading(true)
      const today = getISTDateString()
      
      // Get today's attendance
      const todayAttendance = await listAttendances({
        start_date: today,
        end_date: today,
        page_size: 1000,
      })

      // Get this week's attendance
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
      const weekStartStr = weekStart.toISOString().slice(0, 10)
      
      const weekAttendance = await listAttendances({
        start_date: weekStartStr,
        end_date: today,
        page_size: 1000,
      })

      const totalEmployees = employees?.length || 0
      const presentToday = todayAttendance.results?.length || 0
      const absentToday = Math.max(0, totalEmployees - presentToday)

      // Calculate total hours today
      let totalMinutesToday = 0
      todayAttendance.results?.forEach((record: any) => {
        if (record.total_hours) {
          const match = record.total_hours.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
          if (match) {
            const hours = parseInt(match[1])
            const minutes = parseInt(match[2])
            totalMinutesToday += hours * 60 + minutes
          }
        }
      })

      // Calculate average hours this week
      let totalMinutesWeek = 0
      const uniqueDays = new Set()
      weekAttendance.results?.forEach((record: any) => {
        uniqueDays.add(record.date)
        if (record.total_hours) {
          const match = record.total_hours.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
          if (match) {
            const hours = parseInt(match[1])
            const minutes = parseInt(match[2])
            totalMinutesWeek += hours * 60 + minutes
          }
        }
      })

      const avgMinutesWeek = uniqueDays.size > 0 ? totalMinutesWeek / uniqueDays.size : 0

      // Calculate attendance rate (present days / total possible days this week)
      const daysThisWeek = new Date().getDay() + 1 // Including today
      const attendanceRate = totalEmployees > 0 && daysThisWeek > 0 
        ? (weekAttendance.count / (totalEmployees * daysThisWeek)) * 100 
        : 0

      setStats({
        totalEmployees,
        presentToday,
        absentToday,
        totalHoursToday: formatMinutesToHours(totalMinutesToday),
        avgHoursThisWeek: formatMinutesToHours(avgMinutesWeek),
        attendanceRate: Math.round(attendanceRate),
      })
    } catch (error) {
      console.error("Error loading attendance stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (employees) {
      loadStats()
    }
  }, [employees])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Active employees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Today</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEmployees > 0 
              ? `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}% present`
              : "No employees"
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEmployees > 0 
              ? `${Math.round((stats.absentToday / stats.totalEmployees) * 100)}% absent`
              : "No employees"
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours Today</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHoursToday}</div>
          <p className="text-xs text-muted-foreground">
            Combined work hours
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgHoursThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            This week average
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.attendanceRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            This week
          </p>
        </CardContent>
      </Card>
    </div>
  )
}