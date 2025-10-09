import { PolicyManagement } from "@/components/admin/policy-management"
import { LeaveLayout } from "@/components/leave/leave-layout"

export default function PoliciesPage() {
  return (
    <LeaveLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Management</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Configure leave types and policies for your organization
          </p>
        </div>
        <PolicyManagement />
      </div>
    </LeaveLayout>
  )
}
