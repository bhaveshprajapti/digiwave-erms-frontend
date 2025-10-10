"use client"

import type React from "react"
import { LeaveRequestsProvider } from "@/contexts/leave-requests-context"

export default function LeaveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LeaveRequestsProvider>
      {children}
    </LeaveRequestsProvider>
  )
}
