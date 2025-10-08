"use client"

import { useEffect, useMemo, useState } from "react"
import { listAttendances } from "@/lib/api/attendances"
import { authService } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DataTable } from "@/components/common/data-table"
import { calculateAttendanceStatus } from "@/lib/utils/attendance-status"

export function AttendanceHistory() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [count, setCount] = useState(0)
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()

  const userId = useMemo(() => authService.getUserData()?.id, [])

  const load = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const params: any = { user: userId, page, page_size: pageSize }
      if (start) params.start_date = start.toISOString().slice(0,10)
      if (end) params.end_date = end.toISOString().slice(0,10)
      const data = await listAttendances(params)
      setItems(data.results)
      setCount(data.count)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to load attendance", variant: "destructive" })
    } finally { setLoading(false) }
  }

  useEffect(() => { setPage(1) }, [start, end])
  useEffect(() => { load() }, [userId, page, pageSize, start, end])

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <CardTitle>Your Attendance</CardTitle>
        <div className="flex items-center gap-2">
          <DateRangePicker start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={[
            { 
              key: 'date', 
              header: 'Date', 
              sortable: true, 
              cell: (r: any) => (
                <div className="font-medium">
                  {new Date(r.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              )
            },
            {
              key: 'sessions',
              header: 'Sessions',
              cell: (r: any) => {
                const sessions = r.sessions || []
                const completed = sessions.filter((s: any) => s.check_out).length
                const active = sessions.length - completed
                return (
                  <div className="text-sm">
                    <span className="font-medium">{sessions.length} total</span>
                    {completed > 0 && <span className="text-green-600 ml-2">{completed} done</span>}
                    {active > 0 && <span className="text-blue-600 ml-2">{active} active</span>}
                  </div>
                )
              }
            },
            { 
              key: 'total_hours', 
              header: 'Total Hours',
              cell: (r: any) => (
                <div className="font-mono text-sm">
                  {r.total_hours || '0:00:00'}
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r: any) => {
                const sessions = r.sessions || []
                const hasActive = sessions.some((s: any) => !s.check_out)
                
                // Calculate proper status using the new utility
                const [statusDisplay, variant] = (() => {
                  if (hasActive) {
                    return ['Active', 'default'] as const
                  }
                  
                  // For completed sessions, we'll compute the status based on business rules
                  // This is a simplified sync version - in a real scenario we'd use async
                  if (sessions.length === 0) {
                    return ['Absent', 'destructive'] as const
                  }
                  
                  const totalHours = r.total_hours || '0:00:00'
                  const [hours, minutes] = totalHours.split(':')
                  const totalMinutes = parseInt(hours) * 60 + parseInt(minutes || '0')
                  
                  if (totalMinutes >= 240) { // 4+ hours
                    // TODO: Check if late based on shift timing
                    return ['Present', 'secondary'] as const
                  } else if (totalMinutes >= 210) { // 3.5+ hours
                    return ['Half Day', 'outline'] as const
                  } else {
                    return ['Absent', 'destructive'] as const
                  }
                })()
                
                return (
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      variant === 'default' ? 'bg-primary text-primary-foreground' :
                      variant === 'secondary' ? 'bg-green-100 text-green-800' :
                      variant === 'outline' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {statusDisplay}
                    </div>
                  </div>
                )
              }
            },
            { 
              key: 'notes', 
              header: 'Notes', 
              cell: (r: any) => (
                <span className="text-sm text-muted-foreground">
                  {r.notes || '-'}
                </span>
              )
            },
          ]}
          data={items as any}
          getRowKey={(i: any) => i.id}
          striped
        />
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-muted-foreground">
            {count > 0 ? (
              <span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, count)} of {count}</span>
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
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="h-8 px-3 rounded-md border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <span className="text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(count / pageSize))}</span>
              <button type="button" className="h-8 px-3 rounded-md border" onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(count / pageSize)), p + 1))} disabled={page >= Math.max(1, Math.ceil(count / pageSize))}>Next</button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
