"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getLeaveAnalytics } from "@/lib/api/leave-analytics"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"

interface LeaveAnalyticsProps {
  className?: string
}

interface AnalyticsData {
  overview: {
    total_applications: number
    pending_applications: number
    approved_applications: number
    rejected_applications: number
    total_days_requested: number
    total_days_approved: number
  }
  by_leave_type: Array<{
    leave_type: number
    leave_type_name: string
    total_applications: number
    total_days: number
    avg_days_per_application: number
  }>
  by_month: Array<{
    month: string
    total_applications: number
    total_days: number
  }>
  by_department: Array<{
    department: string
    total_applications: number
    total_days: number
    avg_days_per_employee: number
  }>
  top_users: Array<{
    user_id: number
    user_name: string
    total_applications: number
    total_days: number
  }>
  approval_stats: {
    avg_approval_time_hours: number
    pending_over_24h: number
    pending_over_week: number
  }
}

export function LeaveAnalytics({ className }: LeaveAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])

  const { toast } = useToast()

  // Available years (current year ± 2)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const filters: any = { year: parseInt(yearFilter) }
      if (leaveTypeFilter !== "all") {
        filters.leave_type = parseInt(leaveTypeFilter)
      }

      const [analyticsData, typesData] = await Promise.all([
        getLeaveAnalytics(filters),
        getLeaveTypes().catch(() => [])
      ])

      setAnalytics(analyticsData)
      setLeaveTypes(typesData)
    } catch (error: any) {
      console.error('Failed to load analytics:', error)
      toast({
        title: "Error",
        description: "Failed to load leave analytics",
        variant: "destructive"
      })
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [yearFilter, leaveTypeFilter])

  const getApprovalRate = () => {
    if (!analytics?.overview) return 0
    const { total_applications, approved_applications } = analytics.overview
    return total_applications > 0 ? Math.round((approved_applications / total_applications) * 100) : 0
  }

  const getRejectionRate = () => {
    if (!analytics?.overview) return 0
    const { total_applications, rejected_applications } = analytics.overview
    return total_applications > 0 ? Math.round((rejected_applications / total_applications) * 100) : 0
  }

  const getPendingRate = () => {
    if (!analytics?.overview) return 0
    const { total_applications, pending_applications } = analytics.overview
    return total_applications > 0 ? Math.round((pending_applications / total_applications) * 100) : 0
  }

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading analytics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Leave Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-sm font-medium">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Leave Type</label>
                <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadAnalytics} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {analytics ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold">{analytics.overview.total_applications}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                      <p className="text-2xl font-bold text-yellow-600">{analytics.overview.pending_applications}</p>
                      <p className="text-xs text-gray-500">{getPendingRate()}% of total</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                      <p className="text-2xl font-bold text-green-600">{getApprovalRate()}%</p>
                      <p className="text-xs text-gray-500">{analytics.overview.approved_applications} approved</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Days Approved</p>
                      <p className="text-2xl font-bold">{analytics.overview.total_days_approved}</p>
                      <p className="text-xs text-gray-500">of {analytics.overview.total_days_requested} requested</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Approval Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Approval Time</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatHours(analytics.approval_stats.avg_approval_time_hours)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending {'>'}24 Hours</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {analytics.approval_stats.pending_over_24h}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending {'>'} 1 Week</p>
                    <p className="text-xl font-bold text-red-600">
                      {analytics.approval_stats.pending_over_week}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Type Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Type Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.by_leave_type.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.leave_type_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.total_applications} applications • {item.total_days} days
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {item.avg_days_per_application.toFixed(1)} avg days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.by_month.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.month}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{item.total_applications} applications</p>
                        <p className="text-sm font-medium">{item.total_days} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Analysis */}
            {analytics.by_department.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Department Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.by_department.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.department || 'Unknown Department'}</p>
                          <p className="text-sm text-gray-600">
                            {item.total_applications} applications • {item.total_days} days
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {item.avg_days_per_employee.toFixed(1)} avg per employee
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle>Top Leave Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.top_users.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{item.user_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{item.total_applications} applications</p>
                        <p className="text-sm font-medium">{item.total_days} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No analytics data available</p>
                <Button onClick={loadAnalytics} variant="outline" className="mt-2">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
