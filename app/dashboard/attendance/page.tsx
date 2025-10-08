"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { AttendanceClockCard } from "@/components/attendance/attendance-clock-card"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceHistory } from "@/components/attendance/attendance-history"
import { AttendanceStatsCards } from "@/components/attendance/admin/attendance-stats-cards"
import { AttendanceCharts } from "@/components/attendance/admin/attendance-charts"
import { Card, CardContent } from "@/components/ui/card"

export default function AttendancePage() {
  const [userRole, setUserRole] = useState<'admin' | 'employee' | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = () => {
      const user = authService.getUserData()
      if (!user) {
        router.push('/login')
        return
      }

      // Determine user role
      if (user.is_staff || user.is_superuser || user.role?.name?.toLowerCase().includes('admin')) {
        setUserRole('admin')
        // Redirect admins to admin attendance page
        router.push('/dashboard/admin/attendance')
      } else {
        setUserRole('employee')
        // Redirect employees to employee attendance page
        router.push('/dashboard/employee/attendance')
      }
      setLoading(false)
    }

    checkUserRole()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // This fallback should rarely be shown due to redirects
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance & Time Tracking</h2>
        <p className="text-muted-foreground">Redirecting to appropriate attendance page...</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading your attendance dashboard...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
