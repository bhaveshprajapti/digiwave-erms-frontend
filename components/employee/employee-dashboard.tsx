"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Eye,
  TrendingUp
} from "lucide-react"
import authService from "@/lib/auth"

export function EmployeeDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    pendingRequests: 2,
    approvedRequests: 15,
    totalLeaves: 8,
    remainingLeaves: 12
  })

  useEffect(() => {
    const u = authService.getUserData()
    if (u) {
      setUser(u)
    }
  }, [])

  const quickActions = [
    {
      title: "Update Profile",
      description: "Update your personal information",
      icon: Edit,
      href: "/employee-dashboard/profile",
      color: "blue"
    },
    {
      title: "View Profile",
      description: "View your complete profile",
      icon: Eye,
      href: "/employee-dashboard/profile",
      color: "green"
    },
    {
      title: "Request Leave",
      description: "Submit a new leave request",
      icon: Calendar,
      href: "/employee-dashboard/leave",
      color: "purple"
    },
    {
      title: "Time Tracking",
      description: "View your time logs",
      icon: Clock,
      href: "/employee-dashboard/time",
      color: "orange"
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: "profile_update",
      title: "Profile Update Request",
      description: "Updated phone number and address",
      status: "pending",
      date: "2 hours ago"
    },
    {
      id: 2,
      type: "leave_request",
      title: "Leave Request",
      description: "Annual leave for 3 days",
      status: "approved",
      date: "1 day ago"
    },
    {
      id: 3,
      type: "profile_update",
      title: "Emergency Contact Update",
      description: "Updated emergency contact details",
      status: "approved",
      date: "3 days ago"
    }
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white/20">
              <AvatarFallback className="bg-white/20 text-white text-lg">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-blue-100">
                {user.email} • Employee ID: {user.id}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Today</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Requests</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leaves Taken</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalLeaves}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining Leaves</p>
                <p className="text-2xl font-bold text-purple-600">{stats.remainingLeaves}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    action.color === 'green' ? 'bg-green-100 text-green-600' :
                    action.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    activity.type === 'profile_update' ? 'bg-blue-100' :
                    activity.type === 'leave_request' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {activity.type === 'profile_update' ? (
                      <User className={`h-5 w-5 ${activity.status === 'pending' ? 'text-blue-600' : 'text-blue-600'}`} />
                    ) : (
                      <Calendar className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={activity.status === 'approved' ? 'default' : 'secondary'}
                    className={activity.status === 'approved' ? 
                      'bg-green-100 text-green-800 border-green-200' : 
                      'bg-orange-100 text-orange-800 border-orange-200'}
                  >
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-gray-500">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
