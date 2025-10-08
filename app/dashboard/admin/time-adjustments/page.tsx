"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ManagementTable } from "@/components/common/management-table"
import { TimeAdjustmentDTO, createTimeAdjustment, deleteTimeAdjustment, listTimeAdjustments, updateTimeAdjustment } from "@/lib/api/time-adjustments"
import { useEffect, useMemo, useState } from "react"
import { useEmployees } from "@/hooks/use-employees"
import { listStatusChoices, type StatusChoiceDTO } from "@/lib/api/status-choices"
import { listFlexTypes, type FlexTypeDTO } from "@/lib/api/flex-types"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminTimeAdjustmentsPage() {
  const [rows, setRows] = useState<TimeAdjustmentDTO[]>([])
  const [loading, setLoading] = useState(false)
  const { employees } = useEmployees()
  const [statusChoices, setStatusChoices] = useState<StatusChoiceDTO[]>([])
  const [flexTypes, setFlexTypes] = useState<FlexTypeDTO[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalCount, setTotalCount] = useState(0)

const [filterUser, setFilterUser] = useState<string>("")
  const [filterStart, setFilterStart] = useState<Date | undefined>()
  const [filterEnd, setFilterEnd] = useState<Date | undefined>()
  const [filterStatus, setFilterStatus] = useState<string>("")

  const userOptions = useMemo(() => (employees || []).map((e: any) => ({ value: e.id, label: e.username || `${e.first_name} ${e.last_name}` })), [employees])
  const statusOptions = useMemo(() => statusChoices.filter(s => s.category === 'adjustment_status').map(s => ({ value: s.id, label: s.name })), [statusChoices])
  const flexOptions = useMemo(() => flexTypes.map(f => ({ value: f.id, label: `${f.name} (${f.code})` })), [flexTypes])

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterUser) params.user = Number(filterUser)
      if (filterStart) params.start_date = filterStart.toISOString().slice(0,10)
      if (filterEnd) params.end_date = filterEnd.toISOString().slice(0,10)
      if (filterStatus) params.status = Number(filterStatus)
      params.page = page
      params.page_size = pageSize
      const data = await listTimeAdjustments(params)
      setRows(data.results)
      setTotalCount(data.count)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [sc, ft] = await Promise.all([listStatusChoices(), listFlexTypes()])
        setStatusChoices(sc)
        setFlexTypes(ft)
      } catch {}
    })()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filterUser, filterStart, filterEnd, filterStatus])

  useEffect(() => {
    load()
  }, [filterUser, filterStart, filterEnd, filterStatus, page, pageSize])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <ManagementTable<TimeAdjustmentDTO>
            title="Time Adjustments"
            description=""
            items={rows}
            isLoading={loading}
            headerExtras={(
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">User</span>
                  <select className="h-9 rounded-md border px-2" value={filterUser} onChange={(e)=>setFilterUser(e.target.value)}>
                    <option value="">All users</option>
                    {userOptions.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <select className="h-9 rounded-md border px-2" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
                    <option value="">All</option>
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <DateRangePicker start={filterStart} end={filterEnd} onChangeStart={setFilterStart} onChangeEnd={setFilterEnd} />
                <Button
                  variant="outline"
                  onClick={() => {
                    const headers = ['ID','User','Flex Type','Date','Duration (min)','Status','Description']
                    const mapUser = (uid: number) => userOptions.find(u => Number(u.value)===Number(uid))?.label || String(uid)
                    const mapFlex = (fid: number) => flexOptions.find(f => Number(f.value)===Number(fid))?.label || String(fid)
                    const mapStatus = (sid?: number|null) => statusOptions.find(s => Number(s.value)===Number(sid))?.label || (sid ?? '')
                    const lines = rows.map(r => [r.id, mapUser(r.user), mapFlex(r.flex_type), r.date, r.duration_minutes, mapStatus(r.status ?? undefined), (r.description ?? '').replaceAll('\n',' ')])
                    const csv = [headers.join(','), ...lines.map(arr => arr.map(x => `\"${String(x).replaceAll('\"','\"\"')}\"`).join(','))].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `time_adjustments_export_${new Date().toISOString().slice(0,10)}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >Export CSV</Button>
              </div>
            )}
            tableColumns={[
              { key: 'sr', header: 'Sr No.', className: 'w-16', cell: (_r, i) => <span className="font-medium">{i + 1}</span> },
              { key: 'user_name', header: 'User', sortable: true, sortAccessor: (r) => userOptions.find(u => Number(u.value)===Number((r as any).user))?.label || (r as any).user, cell: (r) => <span>{userOptions.find(u => Number(u.value)===Number(r.user))?.label || r.user}</span> },
              { key: 'flex_label', header: 'Flex Type', sortable: true, sortAccessor: (r) => flexOptions.find(f => Number(f.value)===Number((r as any).flex_type))?.label || (r as any).flex_type, cell: (r) => <span>{flexOptions.find(f => Number(f.value)===Number(r.flex_type))?.label || r.flex_type}</span> },
              { key: 'date', header: 'Date', sortable: true, cell: (r) => <span>{r.date}</span> },
              { key: 'duration', header: 'Duration (min)', sortable: true, sortAccessor: (r) => (r as any).duration_minutes, cell: (r) => <span>{r.duration_minutes}</span> },
              { key: 'status_label', header: 'Status', sortable: true, sortAccessor: (r) => statusOptions.find(s => Number(s.value)===Number((r as any).status))?.label || (r as any).status, cell: (r) => <span>{statusOptions.find(s => Number(s.value)===Number(r.status))?.label || (r.status ?? '-')}</span> },
              { key: 'desc', header: 'Description', cell: (r) => <span className="text-sm">{r.description ?? '-'}</span> },
            ]}
            fields={[
              { key: 'user', label: 'User', type: 'select', options: userOptions },
              { key: 'flex_type', label: 'Flex Type', type: 'select', options: flexOptions },
              { key: 'date', label: 'Date', type: 'date' },
              { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number' },
              { key: 'description', label: 'Description', type: 'text' },
              { key: 'status', label: 'Status', type: 'select', options: statusOptions },
            ]}
            onAdd={async (data) => {
              const payload = {
                user: Number(data.user),
                flex_type: Number(data.flex_type),
                date: String(data.date),
                duration_minutes: Number(data.duration_minutes),
                description: data.description ? String(data.description) : undefined,
              } as any
              await createTimeAdjustment(payload)
              await load()
            }}
            onEdit={async (id, data) => {
              const payload: any = {}
              if (data.user !== undefined) payload.user = Number(data.user)
              if (data.flex_type !== undefined) payload.flex_type = Number(data.flex_type)
              if (data.date !== undefined) payload.date = String(data.date)
              if (data.duration_minutes !== undefined) payload.duration_minutes = Number(data.duration_minutes)
              if (data.description !== undefined) payload.description = String(data.description)
              await updateTimeAdjustment(id as number, payload)
              await load()
            }}
            onDelete={async (id) => {
              await deleteTimeAdjustment(id as number)
              await load()
            }}
          />

          {/* Server-side pagination footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm">
            <div className="text-muted-foreground">
              {totalCount > 0 ? (
                <span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}</span>
              ) : (
                <span>No results</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rows per page</span>
                <select className="h-8 rounded-md border px-2 text-sm" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1) }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-8 px-3 rounded-md border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <span className="text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
                <button type="button" className="h-8 px-3 rounded-md border" onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(totalCount / pageSize)), p + 1))} disabled={page >= Math.max(1, Math.ceil(totalCount / pageSize))}>Next</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
