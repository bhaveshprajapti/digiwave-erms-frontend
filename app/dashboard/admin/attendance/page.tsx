"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ManagementTable } from "@/components/common/management-table"
import { AttendanceDTO, createAttendance, deleteAttendance, listAttendances, updateAttendance } from "@/lib/api/attendances"
import { useEffect, useMemo, useState } from "react"
import { useEmployees } from "@/hooks/use-employees"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AttendanceStatsCards } from "@/components/attendance/admin/attendance-stats-cards"
import { AttendanceCharts } from "@/components/attendance/admin/attendance-charts"
import { EmployeeSessionModal } from "@/components/attendance/admin/employee-session-modal"
import { Eye, Calendar } from "lucide-react"

export default function AdminAttendancePage() {
  const [rows, setRows] = useState<AttendanceDTO[]>([])
  const [loading, setLoading] = useState(false)
  const { employees } = useEmployees()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalCount, setTotalCount] = useState(0)

  const [filterUser, setFilterUser] = useState<string>("")
  const [filterStart, setFilterStart] = useState<Date | undefined>()
  const [filterEnd, setFilterEnd] = useState<Date | undefined>()
  
  // Session modal state
  const [sessionModal, setSessionModal] = useState<{
    isOpen: boolean
    employeeName: string
    employeeId: number
    date: string
  }>({ isOpen: false, employeeName: "", employeeId: 0, date: "" })

  const userOptions = useMemo(() => (employees || []).map((e: any) => ({ value: e.id, label: e.username || `${e.first_name} ${e.last_name}` })), [employees])

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterUser) params.user = Number(filterUser)
      if (filterStart) params.start_date = filterStart.toISOString().slice(0,10)
      if (filterEnd) params.end_date = filterEnd.toISOString().slice(0,10)
      params.page = page
      params.page_size = pageSize
      const data = await listAttendances(params)
      setRows(data.results)
      setTotalCount(data.count)
    } finally { setLoading(false) }
  }

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filterUser, filterStart, filterEnd])

  useEffect(() => {
    load()
  }, [filterUser, filterStart, filterEnd, page, pageSize])

  const openSessionModal = (employeeId: number, employeeName: string, date: string) => {
    setSessionModal({ isOpen: true, employeeId, employeeName, date })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Management</h2>
        <p className="text-muted-foreground">Monitor and analyze employee attendance patterns</p>
      </div>
      
      {/* Analytics Section */}
      <AttendanceStatsCards />
      <AttendanceCharts />
      
      {/* Detailed Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <ManagementTable<AttendanceDTO>
            title="Attendance"
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
                <DateRangePicker start={filterStart} end={filterEnd} onChangeStart={setFilterStart} onChangeEnd={setFilterEnd} />
                <Button
                  variant="outline"
                  onClick={() => {
                    const headers = ['ID','User','Date','Total Hours','Notes']
                    const mapName = (uid: number) => userOptions.find(u => Number(u.value)===Number(uid))?.label || String(uid)
                    const lines = rows.map(r => [r.id, mapName(r.user), r.date, r.total_hours ?? '', (r.notes ?? '').replaceAll('\n',' ')])
                    const csv = [headers.join(','), ...lines.map(arr => arr.map(x => `\"${String(x).replaceAll('\"','\"\"')}\"`).join(','))].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `attendance_export_${new Date().toISOString().slice(0,10)}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >Export CSV</Button>
              </div>
            )}
            tableColumns={[
              { key: 'sr', header: 'Sr No.', className: 'w-16', cell: (_r, i) => <span className="font-medium">{i + 1}</span> },
              { key: 'user_name', header: 'Employee', sortable: true, sortAccessor: (r) => userOptions.find(u => Number(u.value)===Number((r as any).user))?.label || (r as any).user, cell: (r) => {
                const userName = userOptions.find(u => Number(u.value)===Number(r.user))?.label || `User ${r.user}`
                return (
                  <button 
                    className="text-left hover:text-primary hover:underline font-medium"
                    onClick={() => openSessionModal(r.user, userName, r.date)}
                  >
                    {userName}
                  </button>
                )
              }},
              { key: 'date', header: 'Date', sortable: true, cell: (r) => {
                const date = new Date(r.date)
                return (
                  <div className="space-y-1">
                    <div className="font-medium">{r.date}</div>
                    <div className="text-xs text-muted-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                )
              }},
              { key: 'total_hours', header: 'Work Hours', sortable: true, sortAccessor: (r) => {
                const s = (r as any).total_hours as string | null | undefined
                if (!s) return -1
                const m = s.match(/^(\d{2}):(\d{2}):(\d{2})$/)
                if (!m) return s
                return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
              }, cell: (r) => {
                const hours = r.total_hours
                return (
                  <div className="space-y-1">
                    <div className="font-medium">{hours ?? 'No record'}</div>
                    {hours && (
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const match = hours.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
                          if (match) {
                            const h = parseInt(match[1])
                            const m = parseInt(match[2])
                            return `${(h + m/60).toFixed(1)} hrs`
                          }
                          return hours
                        })()} 
                      </div>
                    )}
                  </div>
                )
              }},
              { key: 'actions', header: 'Actions', className: 'w-24', cell: (r) => {
                const userName = userOptions.find(u => Number(u.value)===Number(r.user))?.label || `User ${r.user}`
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSessionModal(r.user, userName, r.date)}
                    className="h-8 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                )
              }},
              { key: 'notes', header: 'Notes', cell: (r) => <span className="text-sm">{r.notes ?? '-'}</span> },
            ]}
            fields={[
              { key: 'user', label: 'User', type: 'select', options: userOptions },
              { key: 'date', label: 'Date', type: 'date' },
              { key: 'total_hours', label: 'Total Hours (HH:MM:SS)', type: 'time' },
              { key: 'notes', label: 'Notes', type: 'text' },
            ]}
            onAdd={async (data) => {
              const payload = {
                user: Number(data.user),
                date: String(data.date),
                total_hours: data.total_hours ? String(data.total_hours) : null,
                notes: data.notes ? String(data.notes) : null,
              } as any
              await createAttendance(payload)
              await load()
            }}
            onEdit={async (id, data) => {
              const payload: any = {}
              if (data.user !== undefined) payload.user = Number(data.user)
              if (data.date !== undefined) payload.date = String(data.date)
              if (data.total_hours !== undefined) payload.total_hours = String(data.total_hours)
              if (data.notes !== undefined) payload.notes = String(data.notes)
              await updateAttendance(id as number, payload)
              await load()
            }}
            onDelete={async (id) => {
              await deleteAttendance(id as number)
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
      
      {/* Session Details Modal */}
      <EmployeeSessionModal
        isOpen={sessionModal.isOpen}
        onClose={() => setSessionModal(prev => ({ ...prev, isOpen: false }))}
        employeeName={sessionModal.employeeName}
        employeeId={sessionModal.employeeId}
        date={sessionModal.date}
      />
    </div>
  )
}
