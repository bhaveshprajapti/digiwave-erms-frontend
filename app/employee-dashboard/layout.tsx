import type React from "react"
import { EmployeeNav } from "@/components/layout/employee-nav"
import { EmployeeHeader } from "@/components/layout/employee-header"

export default function EmployeeDashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <EmployeeNav />

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Fixed Header */}
        <EmployeeHeader />

        {/* Scrollable Content */}
        <main className="min-h-[calc(100vh-4rem)] bg-muted/30 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
