import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCircle,
  DollarSign,
  Shield,
  FileBarChart,
  Server,
  FolderOpen,
  Plus,
  Megaphone,
  Settings,
  DollarSign as PaymentIcon,
} from "lucide-react"

export const navigationSections = [
  {
    title: "DASHBOARD",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "DATA",
    items: [
      {
        label: "Projects",
        icon: FolderKanban,
        children: [
          { href: "/dashboard/projects", label: "All Projects" },
          { href: "/dashboard/quotations", label: "Quotations" },
          { href: "/dashboard/projects/profit-loss", label: "Project P & L" },
        ]
      },
      {
        label: "Server & Domain",
        icon: Server,
        children: [
          { href: "/dashboard/servers", label: "Server Details" },
          { href: "/dashboard/domains", label: "Domain Details" },
        ]
      },
      { href: "/dashboard/files", label: "Files & Docs", icon: FolderOpen },
      {
        label: "Add Data",
        icon: Plus,
        children: [
          { href: "/dashboard/settings/roles", label: "Roles & Permission" },
          { href: "/dashboard/settings/employee-types", label: "Employee Type" },
          { href: "/dashboard/settings/designations", label: "Designations" },
          { href: "/dashboard/settings/shifts", label: "Shifts" },
          { href: "/dashboard/settings/technologies", label: "Technologies" },
          { href: "/dashboard/settings/apps-services", label: "Apps & Service" },
          { href: "/dashboard/settings/holidays", label: "Public Holidays" },
        ]
      },
    ]
  },
  {
    title: "USERS",
    items: [
      {
        label: "Employees",
        icon: Users,
        children: [
          { href: "/dashboard/employees", label: "All Employees" },
          { href: "/dashboard/profile-requests", label: "Profile Update Requests" },
          { href: "/dashboard/leave", label: "Leave Management" },
          { href: "/dashboard/leave/request", label: "Request Leave" },
          { href: "/dashboard/attendance", label: "Attendance" },
          { href: "/dashboard/admin/attendance", label: "Admin Attendance" },
          { href: "/dashboard/admin/time-adjustments", label: "Time Adjustments" },
          { href: "/dashboard/admin/approvals", label: "Approvals" },
          { href: "/dashboard/admin/policies", label: "Leave Policies" },
        ]
      },
      { href: "/dashboard/clients", label: "Client", icon: UserCircle },
      { href: "/dashboard/announcements", label: "Announcement & Notice", icon: Megaphone },
    ]
  },
  {
    title: "FINANCE",
    items: [
      {
        label: "Payments",
        icon: PaymentIcon,
        children: [
          { href: "/dashboard/payments/from-client", label: "From Client" },
        ]
      },
      {
        label: "Expenses",
        icon: DollarSign,
        children: [
          { href: "/dashboard/expenses", label: "View Expenses" },
        ]
      },
    ]
  },
  {
    title: "ADMINISTRATION",
    items: [
      { href: "/dashboard/admin/settings", label: "Organization Settings", icon: Settings },
      { href: "/dashboard/admin/roles", label: "Admin Roles", icon: Shield },
      { href: "/dashboard/admin/audit", label: "Audit Logs", icon: FileBarChart },
    ]
  },
]
