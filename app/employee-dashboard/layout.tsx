import type React from "react"
import { EmployeeNav } from "@/components/layout/employee-nav"
import { EmployeeHeader } from "@/components/layout/employee-header"

export default function EmployeeDashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Sidebar */}
      <EmployeeNav />

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Fixed Header */}
        <EmployeeHeader />

        {/* Scrollable Content */}
        <main className="min-h-[calc(100vh-4rem)] bg-white p-4 md:p-6 employee-dashboard-main" style={{ background: '#ffffff !important' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
