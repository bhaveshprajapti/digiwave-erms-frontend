import { LeaveRequestForm } from "@/components/leave/leave-request-form"
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card"
import { LeaveRequestList } from "@/components/leave/leave-request-list"
import { LeaveLayout } from "@/components/leave/leave-layout"

export default function EmployeeLeavePage() {
  return (
    <LeaveLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Leave Requests</h1>
          <p className="text-muted-foreground">Manage your leave requests and view balances</p>
        </div>

        {/* Leave Balances - count cards first */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Leave Balances</h2>
          <LeaveBalanceCard />
        </div>

        {/* Apply Leave - form second */}
        <div>
          <LeaveRequestForm />
        </div>

        {/* Applied Leave - table third */}
        <div>
          <LeaveRequestList />
        </div>
      </div>
    </LeaveLayout>
  )
}
