import { Home, User, FileText, Clock, Calendar, Settings, Bell, LogOut } from "lucide-react"

export const employeeNavigationSections = [
  {
    title: "DASHBOARD",
    items: [
      { href: "/employee-dashboard", label: "Overview", icon: Home },
    ]
  },
  {
    title: "MY WORK",
    items: [
      { href: "/employee-dashboard/attendance", label: "Attendance", icon: Clock },
      { href: "/employee-dashboard/leave", label: "Leave Requests", icon: Calendar },
      { href: "/employee-dashboard/requests", label: "Profile Requests", icon: FileText },
    ]
  },
  {
    title: "PROFILE",
    items: [
      { href: "/employee-dashboard/profile", label: "My Profile", icon: User },
      { href: "/employee-dashboard/settings", label: "Settings", icon: Settings },
    ]
  },
]
