"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { ApprovalDTO, deleteApproval, listApprovals, updateApproval } from "@/lib/api/approvals"
import { useEffect, useMemo, useState } from "react"
import { listStatusChoices, type StatusChoiceDTO } from "@/lib/api/status-choices"
import { useEmployees } from "@/hooks/use-employees"

export default function AdminApprovalsPage() {
  const [rows, setRows] = useState<ApprovalDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [statusChoices, setStatusChoices] = useState<StatusChoiceDTO[]>([])
  const { employees } = useEmployees()

  const statusOptions = useMemo(() => statusChoices.filter(s => s.category === 'approval_status').map(s => ({ value: s.id, label: s.name })), [statusChoices])
  const userMap = useMemo(() => {
    const m = new Map<number, string>()
    ;(employees || []).forEach((e: any) => m.set(Number(e.id), e.username || `${e.first_name} ${e.last_name}`))
    return m
  }, [employees])

  const load = async () => {
    setLoading(true)
    try { setRows(await listApprovals()) } finally { setLoading(false) }
  }

  useEffect(() => {
    ;(async () => {
      try { setStatusChoices(await listStatusChoices()) } catch {}
    })()
  }, [])

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<ApprovalDTO>
            columns={[
              { key: 'sr', header: 'Sr No.', className: 'w-16', cell: (_r, i) => <span className="font-medium">{i + 1}</span> },
              { key: 'object', header: 'Object', cell: (r) => <span>#{r.object_id} (ct:{r.content_type})</span> },
              { key: 'approver', header: 'Approver', cell: (r) => <span>{userMap.get(r.approver) ?? r.approver}</span> },
              { key: 'level', header: 'Level', cell: (r) => <span>{r.level}</span> },
              { key: 'status', header: 'Status', cell: (r) => (
                <select
                  className="h-9 rounded-md border px-2"
                  value={r.status ?? ''}
                  onChange={async (e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined
                    await updateApproval(r.id, { status: val })
                    await load()
                  }}
                >
                  <option value="">-</option>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) },
              { key: 'comments', header: 'Comments', cell: (r) => <span className="truncate inline-block max-w-[240px]">{r.comments ?? '-'}</span> },
              { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (r) => (
                <div className="flex items-center justify-center">
                  <ActionButtons
                    onEdit={async () => { /* optional: open edit dialog later */ }}
                    onDelete={async () => { await deleteApproval(r.id); await load() }}
                  />
                </div>
              )},
            ]}
            data={rows}
            getRowKey={(r) => r.id}
            striped
          />
        </CardContent>
      </Card>
    </div>
  )
}
