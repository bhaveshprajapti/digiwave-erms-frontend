import { AuditLogs } from "@/components/admin/audit-logs"

export default function AuditPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Audit Logs</h2>
        <p className="text-sm text-muted-foreground md:text-base">Track all system changes and user activities</p>
      </div>
      <AuditLogs />
    </div>
  )
}
