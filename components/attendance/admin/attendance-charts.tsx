"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listAttendances } from "@/lib/api/attendances"
import { useEmployees } from "@/hooks/use-employees"
import { BarChart3, TrendingUp, PieChart, Calendar } from "lucide-react"

interface ChartData {
  dailyAttendance: { date: string; present: number; absent: number }[]
  weeklyHours: { week: string; hours: number }[]
  employeeHours: { employee: string; hours: number }[]
  attendanceRate: { month: string; rate: number }[]
}

export function AttendanceCharts() {
  const [chartData, setChartData] = useState<ChartData>({
    dailyAttendance: [],
    weeklyHours: [],
    employeeHours: [],
    attendanceRate: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const { employees } = useEmployees()

  const loadChartData = async () => {
    setLoading(true)
    try {
      // Get date range based on selected period
      const endDate = new Date()
      const startDate = new Date()
      
      if (selectedPeriod === "week") {
        startDate.setDate(startDate.getDate() - 7)
      } else if (selectedPeriod === "month") {
        startDate.setDate(startDate.getDate() - 30)
      } else if (selectedPeriod === "quarter") {
        startDate.setDate(startDate.getDate() - 90)
      }

      const attendanceData = await listAttendances({
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
        page_size: 1000,
      })

      // Process daily attendance data
      const dailyMap = new Map<string, { present: Set<number>, total: number }>()
      const employeeHoursMap = new Map<number, number>()
      const totalEmployees = employees?.length || 0

      // Initialize daily map with all dates in range
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10)
        dailyMap.set(dateStr, { present: new Set(), total: totalEmployees })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Process attendance records
      attendanceData.results?.forEach((record: any) => {
        const date = record.date
        if (dailyMap.has(date)) {
          dailyMap.get(date)?.present.add(record.user)
        }

        // Calculate employee hours
        if (record.total_hours) {
          const match = record.total_hours.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
          if (match) {
            const hours = parseInt(match[1]) + parseInt(match[2]) / 60
            employeeHoursMap.set(record.user, (employeeHoursMap.get(record.user) || 0) + hours)
          }
        }
      })

      // Convert to chart format
      const dailyAttendance = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          present: data.present.size,
          absent: Math.max(0, data.total - data.present.size),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Generate weekly hours (group by week)
      const weeklyHoursMap = new Map<string, number>()
      attendanceData.results?.forEach((record: any) => {
        if (record.total_hours) {
          const recordDate = new Date(record.date)
          const weekStart = new Date(recordDate)
          weekStart.setDate(recordDate.getDate() - recordDate.getDay())
          const weekKey = weekStart.toISOString().slice(0, 10)
          
          const match = record.total_hours.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
          if (match) {
            const hours = parseInt(match[1]) + parseInt(match[2]) / 60
            weeklyHoursMap.set(weekKey, (weeklyHoursMap.get(weekKey) || 0) + hours)
          }
        }
      })

      const weeklyHours = Array.from(weeklyHoursMap.entries())
        .map(([weekStart, hours]) => ({
          week: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: Math.round(hours * 10) / 10,
        }))
        .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())

      // Get top employees by hours
      const employeeHours = Array.from(employeeHoursMap.entries())
        .map(([userId, hours]) => {
          const employee = employees?.find(e => e.id === Number(userId))
          return {
            employee: employee ? `${employee.first_name} ${employee.last_name}` : `User ${userId}`,
            hours: Math.round(hours * 10) / 10,
          }
        })
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10)

      // Calculate monthly attendance rates (mock data for now)
      const attendanceRate = [
        { month: 'Jan', rate: 85 },
        { month: 'Feb', rate: 88 },
        { month: 'Mar', rate: 92 },
        { month: 'Apr', rate: 89 },
        { month: 'May', rate: 91 },
        { month: 'Jun', rate: 87 },
      ]

      setChartData({
        dailyAttendance,
        weeklyHours,
        employeeHours,
        attendanceRate,
      })
    } catch (error) {
      console.error("Error loading chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (employees) {
      loadChartData()
    }
  }, [employees, selectedPeriod])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attendance Analytics</h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.dailyAttendance.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {chartData.dailyAttendance.map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-sm font-medium w-16">{day.date}</div>
                      <div className="flex-1">
                        <div className="flex rounded-full overflow-hidden h-6 bg-muted">
                          <div
                            className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${(day.present / (day.present + day.absent)) * 100}%` }}
                          >
                            {day.present > 0 && day.present}
                          </div>
                          <div
                            className="bg-red-400 flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${(day.absent / (day.present + day.absent)) * 100}%` }}
                          >
                            {day.absent > 0 && day.absent}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-12">
                        {Math.round((day.present / (day.present + day.absent)) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Work Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.weeklyHours.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {chartData.weeklyHours.map((week, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-sm font-medium w-16">{week.week}</div>
                      <div className="flex-1">
                        <div className="bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${Math.min((week.hours / 200) * 100, 100)}%` }}
                          >
                            {week.hours}h
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-12">
                        {week.hours}h
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Employees by Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Performers (Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.employeeHours.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {chartData.employeeHours.map((emp, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-sm font-medium w-4">{index + 1}</div>
                      <div className="text-sm flex-1 truncate">{emp.employee}</div>
                      <div className="flex-1">
                        <div className="bg-muted rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-full"
                            style={{ 
                              width: `${Math.min((emp.hours / Math.max(...chartData.employeeHours.map(e => e.hours))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-12">
                        {emp.hours}h
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                {chartData.attendanceRate.map((month, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-sm font-medium w-12">{month.month}</div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full flex items-center justify-center text-xs text-white font-medium ${
                            month.rate >= 90 ? 'bg-green-500' :
                            month.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${month.rate}%` }}
                        >
                          {month.rate}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground w-12">
                      {month.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}