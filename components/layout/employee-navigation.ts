import { Home, User, FileText, Clock } from "lucide-react"

export const employeeNavigationSections = [
  {
    title: "PORTAL",
    items: [
      { href: "/employee-dashboard", label: "Dashboard", icon: Home },
      { href: "/employee-dashboard/profile", label: "My Profile", icon: User },
      { href: "/employee-dashboard/requests", label: "My Requests", icon: FileText },
      { href: "/employee-dashboard/time", label: "Time Tracking", icon: Clock },
    ]
  },
]
