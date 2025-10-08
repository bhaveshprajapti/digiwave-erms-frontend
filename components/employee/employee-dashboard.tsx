"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  RefreshCw
} from "lucide-react"
import authService from "@/lib/auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function EmployeeDashboard() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalLeaves: 0,
    remainingLeaves: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    const userData = authService.getUserData()
    if (!userData?.id) return

    try {
      setLoading(true)
      
      // Fetch profile update requests
      const profileRequestsPromise = api.get('/accounts/profile-update-requests/my_requests/')
        .then(res => Array.isArray(res.data) ? res.data : [])
        .catch(() => [])

      // Fetch leave requests (if API exists)
      const leaveRequestsPromise = api.get(`/leave/leave-requests/?user=${userData.id}`)
        .then(res => Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [])
        .catch(() => [])

      // Fetch leave balances (if API exists) 
      const leaveBalancesPromise = api.get('/leave/leave-balances/')
        .then(res => {
          const data = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : []
          return data.filter((b: any) => Number(b.user) === Number(userData.id))
        })
        .catch(() => [])

      const [profileRequests, leaveRequests, leaveBalances] = await Promise.all([
        profileRequestsPromise,
        leaveRequestsPromise, 
        leaveBalancesPromise
      ])

      // Calculate stats from real data
      const pendingRequests = profileRequests.filter((r: any) => r.status === 'pending').length
      const approvedRequests = profileRequests.filter((r: any) => r.status === 'approved').length
      
      // Calculate leave stats
      const approvedLeaves = leaveRequests.filter((r: any) => r.status === 'approved').length
      const totalRemainingDays = leaveBalances.reduce((total: number, balance: any) => {
        const opening = Number(balance.opening_balance) || 0
        const carriedForward = Number(balance.carried_forward) || 0
        const used = Number(balance.used) || 0
        return total + Math.max(0, opening + carriedForward - used)
      }, 0)

      setStats({
        pendingRequests,
        approvedRequests,
        totalLeaves: approvedLeaves,
        remainingLeaves: totalRemainingDays
      })

      // Helper function to get relative time
      const getRelativeTime = (date: string) => {
        const now = new Date()
        const past = new Date(date)
        const diffMs = now.getTime() - past.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        
        if (diffDays > 7) {
          return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (diffDays > 0) {
          return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else if (diffHours > 0) {
          return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        } else if (diffMinutes > 0) {
          return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
        } else {
          return 'Just now'
        }
      }

      // Create recent activity from requests
      const activity = [...profileRequests.slice(0, 5).map((req: any) => ({
        id: req.id || Math.random(),
        type: 'profile_update',
        title: 'Profile Update Request',
        description: `Updated ${(req.field || req.field_name || 'field').replace('_', ' ')}`,
        status: req.status,
        date: getRelativeTime(req.requested_at),
        timestamp: new Date(req.requested_at).getTime()
      })), ...leaveRequests.slice(0, 3).map((req: any) => ({
        id: req.id || Math.random(),
        type: 'leave_request', 
        title: 'Leave Request',
        description: `${req.duration_days || 1} day(s) leave`,
        status: req.status,
        date: getRelativeTime(req.created_at || req.start_date),
        timestamp: new Date(req.created_at || req.start_date).getTime()
      }))].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)

      setRecentActivity(activity)
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      
      // Only show toast if it's not a network/API unavailability issue
      if (error?.response?.status !== 404) {
        toast({
          title: 'Notice',
          description: 'Some dashboard data may not be available',
          variant: 'default'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const u = authService.getUserData()
    if (u) {
      setUser(u)
      loadDashboardData()
    }
  }, [])


  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-muted rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-muted-foreground">
                {user.email} • Employee ID: {user.id}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center space-x-4">
            <button
              onClick={() => loadDashboardData()}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-background hover:bg-muted rounded-md transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div>
              <p className="text-muted-foreground text-sm">Today</p>
              <p className="text-xl font-semibold">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved Requests</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leaves Taken</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalLeaves}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Leaves</p>
                <p className="text-2xl font-bold text-purple-600">{stats.remainingLeaves}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Recent Activity */}
      <Card className="border-l-4 border-l-secondary bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      activity.type === 'profile_update' ? 'bg-blue-100' :
                      activity.type === 'leave_request' ? 'bg-green-100' : 'bg-muted'
                    }`}>
                      {activity.type === 'profile_update' ? (
                        <User className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Calendar className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={activity.status === 'approved' ? 'default' : 'secondary'}
                      className={activity.status === 'approved' ? 
                        'bg-green-100 text-green-800 border-green-200' : 
                        activity.status === 'rejected' ?
                        'bg-red-100 text-red-800 border-red-200' :
                        'bg-orange-100 text-orange-800 border-orange-200'}
                    >
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
