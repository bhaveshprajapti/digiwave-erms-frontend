import type React from "react"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <DashboardNav />
      
      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Fixed Header */}
        <DashboardHeader />
        
        {/* Scrollable Content */}
        <main className="min-h-[calc(100vh-4rem)] bg-white p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
