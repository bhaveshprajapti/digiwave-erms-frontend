import { LeaveApplicationsManager } from "@/components/leave/admin/leave-applications-manager"
import { LeaveLayout } from "@/components/leave/leave-layout"

export default function AdminLeavesPage() {
  return (
    <LeaveLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Requests (Admin)</h2>
          <p className="text-sm text-muted-foreground md:text-base">Review and take action on employee leave requests</p>
        </div>

        <LeaveApplicationsManager />
      </div>
    </LeaveLayout>
  )
}
