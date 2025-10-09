"use client"

import { ReactNode } from 'react'
import { LeaveRequestsProvider } from '@/contexts/leave-requests-context'

interface LeaveLayoutProps {
  children: ReactNode
}

export function LeaveLayout({ children }: LeaveLayoutProps) {
  return (
    <LeaveRequestsProvider>
      {children}
    </LeaveRequestsProvider>
  )
}
