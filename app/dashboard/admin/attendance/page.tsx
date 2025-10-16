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
import { EmployeeSessionModal } from "@/components/attendance/admin/employee-session-modal"
import { Clock, Users, CheckCircle, AlertTriangle } from "lucide-react"

export default function AdminAttendancePage() {
  const [rows, setRows] = useState<AttendanceDTO[]>([])
  const [loading, setLoading] = useState(false)
  const { employees } = useEmployees()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalHours: 0,
    avgHours: 0
  })

  const [filterUser, setFilterUser] = useState<string>("")
  const [filterStart, setFilterStart] = useState<Date | undefined>()
  const [filterEnd, setFilterEnd] = useState<Date | undefined>()
  
  // Session modal state
  const [sessionModal, setSessionModal] = useState<{
    isOpen: boolean
    employeeName: string
    employeeId: number
    selectedDate: string
  }>({ isOpen: false, employeeName: "", employeeId: 0, selectedDate: new Date().toISOString().split('T')[0] })

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
      
      // Fetch ALL records for stats calculation (without pagination)
      const statsParams: any = {}
      if (filterUser) statsParams.user = Number(filterUser)
      if (filterStart) statsParams.start_date = filterStart.toISOString().slice(0,10)
      if (filterEnd) statsParams.end_date = filterEnd.toISOString().slice(0,10)
      statsParams.page_size = 10000 // Get all records for stats
      const allData = await listAttendances(statsParams)
      
      // Calculate stats from all records
      const uniqueEmployees = new Set(allData.results.map((r: any) => r.user)).size
      const today = new Date().toISOString().split('T')[0]
      const todayRecords = allData.results.filter((r: any) => r.date === today)
      
      // Calculate total seconds instead of hours
      const totalSeconds = allData.results.reduce((sum: number, r: any) => {
        if (r.total_hours) {
          // Match HH:MM:SS or HH:MM:SS.microseconds format
          const match = r.total_hours.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/)
          if (match) {
            return sum + (parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]))
          }
        }
        return sum
      }, 0)
      
      // Convert seconds to HH:MM:SS format
      const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      }
      
      const avgSeconds = uniqueEmployees > 0 ? Math.floor(totalSeconds / uniqueEmployees) : 0
      
      setStats({
        totalEmployees: uniqueEmployees,
        presentToday: todayRecords.length,
        totalHours: totalSeconds,
        avgHours: avgSeconds
      })
    } finally { setLoading(false) }
  }

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filterUser, filterStart, filterEnd])

  useEffect(() => {
    load()
  }, [filterUser, filterStart, filterEnd, page, pageSize])

  const openSessionModal = (employeeId: number, employeeName: string, date?: string) => {
    // Default to today's date if no date is provided
    const selectedDate = date || new Date().toISOString().split('T')[0]
    setSessionModal({ 
      isOpen: true, 
      employeeId, 
      employeeName, 
      selectedDate 
    })
  }

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Management</h2>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-purple-600 font-mono">{formatTime(stats.totalHours)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Hours/Employee</p>
                <p className="text-2xl font-bold text-orange-600 font-mono">{formatTime(stats.avgHours)}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Attendance Table */}
      <Card>
        <CardContent>
          <ManagementTable<AttendanceDTO>
            title=""
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
                    const headers = ['ID','User','Date','Total Hours']
                    const mapName = (uid: number) => userOptions.find(u => Number(u.value)===Number(uid))?.label || String(uid)
                    const lines = rows.map(r => [r.id, mapName(r.user), r.date, r.total_hours ?? ''])
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
                    className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer transition-colors"
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
                    <div className="font-medium font-mono text-lg">{hours ?? 'No record'}</div>
                    {hours && (
                      <div className="text-xs text-muted-foreground">
                        Total work duration
                      </div>
                    )}
                  </div>
                )
              }},
            ]}
            fields={[
              { key: 'user', label: 'User', type: 'select', options: userOptions },
              { key: 'date', label: 'Date', type: 'date' },
              { key: 'total_hours', label: 'Total Hours (HH:MM:SS)', type: 'time' },
            ]}
            onAdd={async (data) => {
              const payload = {
                user: Number(data.user),
                date: String(data.date),
                total_hours: data.total_hours ? String(data.total_hours) : null,
              } as any
              await createAttendance(payload)
              await load()
            }}
            onEdit={async (id, data) => {
              const payload: any = {}
              if (data.user !== undefined) payload.user = Number(data.user)
              if (data.date !== undefined) payload.date = String(data.date)
              if (data.total_hours !== undefined) payload.total_hours = String(data.total_hours)
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
        selectedDate={sessionModal.selectedDate}
        onDateChange={(date: string) => setSessionModal(prev => ({ ...prev, selectedDate: date }))}
      />
    </div>
  )
}
