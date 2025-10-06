import type React from "react"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
