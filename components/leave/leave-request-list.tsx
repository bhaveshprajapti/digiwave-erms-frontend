"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { getLeaveRequests } from "@/lib/api/leave-requests"
import { authService } from "@/lib/auth"
import { DateRangePicker } from "@/components/ui/date-range-picker"

export function LeaveRequestList() {
  const userId = useMemo(() => authService.getUserData()?.id, [])
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()

  const load = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getLeaveRequests({ user: userId })
      const filtered = data.filter(r => {
        const d = new Date(r.start_date)
        if (start && d < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false
        if (end && d > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false
        return true
      })
      setRows(filtered)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [userId, start, end])

  return (
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
            { key: 'start_date', header: 'Start' },
            { key: 'end_date', header: 'End' },
            { key: 'duration_days', header: 'Days' },
            { key: 'leave_type', header: 'Type' },
            { key: 'status', header: 'Status', cell: (r) => <span>{(r as any).status ?? '-'}</span> },
          ]}
          data={rows}
          getRowKey={(r)=> (r as any).id}
          striped
        />
      </CardContent>
    </Card>
  )
}
