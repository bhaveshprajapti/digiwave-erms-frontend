"use client"

import type React from "react"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <DashboardNav />
      
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isOpen ? 'md:ml-64' : 'md:ml-0'}`}>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
