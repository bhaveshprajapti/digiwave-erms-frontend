"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { getLeaveRequests, deleteLeaveRequest } from "@/lib/api/leave-requests"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { authService } from "@/lib/auth"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ActionButtons } from "@/components/common/action-buttons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function LeaveRequestList() {
  const userId = useMemo(() => authService.getUserData()?.id, [])
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()
  const [typesMap, setTypesMap] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [data, types] = await Promise.all([
        getLeaveRequests({ user: userId }),
        getLeaveTypes().catch(() => [])
      ])
      const map: Record<number, string> = {}
      types.forEach(t => { map[t.id] = t.name })
      setTypesMap(map)
      const filtered = data.filter(r => {
        const d = new Date(r.start_date)
        if (start && d < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false
        if (end && d > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false
        return true
      })
      setRows(filtered)
    } catch (e: any) {
      console.error('Failed to load leave requests', e)
      toast({ title: 'Unable to load leave requests', description: e?.response?.data?.detail || e?.message || 'Please try again.', variant: 'destructive' })
      setRows([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [userId, start, end])

  return (
    <>
      <Card>
        <CardHeader className="flex items-start justify-between gap-3">
          <CardTitle>My Leave Requests</CardTitle>
          <div className="flex items-center gap-2">
            <DateRangePicker start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            columns={[
              { key: 'sr', header: 'Sr No.', cell: (_r, i) => <span className="font-medium">{i + 1}</span>, className: 'w-16' },
              { key: 'leave', header: 'Leave', cell: (r) => (
                <button className="text-primary hover:underline font-medium" onClick={() => { setSelected(r); setOpen(true) }}>
                  {typesMap[(r as any).leave_type] || `#${(r as any).leave_type}`}
                </button>
              )},
              { key: 'start_date', header: 'Start', sortable: true },
              { key: 'end_date', header: 'End', sortable: true },
              { key: 'duration_days', header: 'Days', sortable: true, className: 'w-24' },
              { key: 'status', header: 'Status', cell: (r) => (
                <Badge variant={(r as any).status === 'approved' ? 'default' : (r as any).status === 'rejected' ? 'secondary' : 'outline'}>
                  {(r as any).status ?? '-'}
                </Badge>
              )},
              { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (r) => (
                <div className="flex items-center justify-center">
                  <ActionButtons
                    extras={[{ title: 'View', onClick: () => { setSelected(r); setOpen(true) } }]}
                    onDelete={(r as any).status === 'pending' ? async () => {
                      try {
                        await deleteLeaveRequest((r as any).id)
                        toast({ title: 'Deleted', description: 'Leave request cancelled.' })
                        await load()
                      } catch (e: any) {
                        toast({ title: 'Error', description: e?.message ?? 'Failed to cancel', variant: 'destructive' })
                      }
                    } : undefined}
                  />
                </div>
              )},
            ]}
            data={rows}
            getRowKey={(r)=> (r as any).id}
            striped
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Details</DialogTitle>
            <DialogDescription>Details of the selected leave request</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Leave:</span> <span className="font-medium">{typesMap[selected.leave_type] || `#${selected.leave_type}`}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Start:</span> {selected.start_date}</div>
                <div><span className="text-muted-foreground">End:</span> {selected.end_date}</div>
                <div><span className="text-muted-foreground">Days:</span> {selected.duration_days}</div>
                <div><span className="text-muted-foreground">Status:</span> {selected.status ?? '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Reason:</span>
                <p className="mt-1 whitespace-pre-wrap">{selected.reason || 'N/A'}</p>
              </div>
              {selected.rejection_reason && (
                <div>
                  <span className="text-muted-foreground">Rejection Reason:</span>
                  <p className="mt-1 whitespace-pre-wrap">{selected.rejection_reason}</p>
                </div>
              )}
              {selected.created_at && (
                <div className="text-xs text-muted-foreground">Created at: {new Date(selected.created_at).toLocaleString()}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
