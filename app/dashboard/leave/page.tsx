import { LeaveRequestList } from "@/components/leave/leave-request-list"
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function LeavePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Manage leave requests and balances</p>
        </div>
        <Link href="/dashboard/leave/request">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </Link>
      </div>
      <LeaveBalanceCard />
      <LeaveRequestList />
    </div>
  )
}
