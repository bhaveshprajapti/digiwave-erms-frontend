"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { createLeaveRequest } from "@/lib/api/leave-requests"
import { authService } from "@/lib/auth"

function daysBetweenInclusive(a?: Date, b?: Date): number {
  if (!a || !b) return 0
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (24*3600*1000)) + 1
}

export function LeaveRequestForm() {
  const { toast } = useToast()
  const [types, setTypes] = useState<{ value: number; label: string }[]>([])
  const [leaveType, setLeaveType] = useState("")
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  const user = authService.getUserData()
  const orgId = user?.organization?.id

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getLeaveTypes()
        setTypes(data.map(d => ({ value: d.id, label: `${d.name} (${d.code})` })))
      } catch {}
    })()
  }, [])

  const submit = async () => {
    if (!user?.id || !orgId) { toast({ title: 'Not logged in', variant: 'destructive' }); return }
    if (!leaveType) { toast({ title: 'Select leave type', variant: 'destructive' }); return }
    if (!start || !end) { toast({ title: 'Select date range', variant: 'destructive' }); return }
    const diff = daysBetweenInclusive(start, end)
    if (diff <= 0) { toast({ title: 'Invalid range', variant: 'destructive' }); return }
    setSaving(true)
    try {
      await createLeaveRequest({
        user: user.id,
        leave_type: Number(leaveType),
        start_date: start.toISOString().slice(0,10),
        end_date: end.toISOString().slice(0,10),
        duration_days: String(diff),
        reason: reason || 'N/A',
        organization: orgId,
      } as any)
      toast({ title: 'Submitted', description: 'Your leave request has been submitted.' })
      setLeaveType("")
      setStart(undefined)
      setEnd(undefined)
      setReason("")
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed to submit', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Request</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Leave Type</Label>
            <select className="h-9 w-full rounded-md border px-2" value={leaveType} onChange={(e)=>setLeaveType(e.target.value)}>
              <option value="">Select type</option>
              {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Date Range</Label>
            <DateRangePicker start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
            <p className="text-xs text-muted-foreground">Total days: {daysBetweenInclusive(start, end)}</p>
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Enter a reason" />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={submit} disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
