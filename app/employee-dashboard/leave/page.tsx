"use client"

import { LeaveBalanceCard } from "@/components/leave/leave-balance-card"
import { LeaveRequestList } from "@/components/leave/leave-request-list"
import { LeaveLayout } from "@/components/leave/leave-layout"

export default function EmployeeLeavePage() {
  return (
    <LeaveLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Leave Requests</h1>
        </div>

        {/* Leave Balances */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Leave Balances</h2>
          <LeaveBalanceCard />
        </div>

        {/* Applied Leave */}
        <div>
          <LeaveRequestList />
        </div>
      </div>
    </LeaveLayout>
  )
}
