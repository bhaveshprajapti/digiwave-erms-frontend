"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  FolderKanban,
  UserCircle,
  FileText,
  DollarSign,
  Building2,
  Shield,
  FileBarChart,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/leave", label: "Leave Management", icon: Calendar },
  { href: "/dashboard/attendance", label: "Attendance", icon: Clock },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/clients", label: "Clients", icon: UserCircle },
  { href: "/dashboard/quotations", label: "Quotations", icon: FileText },
  { href: "/dashboard/files", label: "Files", icon: FileText },
  { href: "/dashboard/expenses", label: "Expenses", icon: DollarSign },
]

const adminItems = [
  { href: "/dashboard/settings/roles", label: "Roles", icon: Shield },
  { href: "/dashboard/settings/employee-types", label: "Employee Types", icon: Users },
  { href: "/dashboard/settings/designations", label: "Designations", icon: Users },
  { href: "/dashboard/settings/shifts", label: "Shifts", icon: Clock },
  { href: "/dashboard/settings/technologies", label: "Technologies", icon: Users },
  { href: "/dashboard/admin/policies", label: "Leave Policies", icon: Calendar },
  { href: "/dashboard/admin/settings", label: "Organization Settings", icon: Building2 },
  { href: "/dashboard/admin/audit", label: "Audit Logs", icon: FileBarChart },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="font-semibold">ERMS</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="pt-4">
          <div className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Admin</div>
          {adminItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
