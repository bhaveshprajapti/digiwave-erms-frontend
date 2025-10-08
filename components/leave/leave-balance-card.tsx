"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getLeavePolicies } from "@/lib/api/leave-policies"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { getLeaveRequests } from "@/lib/api/leave-requests"
import { authService } from "@/lib/auth"

interface BalanceRow {
  leave_type: number
  total: number
  used: number
}

export function LeaveBalanceCard() {
  const userId = useMemo(() => authService.getUserData()?.id, [])
  const [rows, setRows] = useState<BalanceRow[]>([])
  const [typeMap, setTypeMap] = useState<Record<number, string>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const [policies, types, requests] = await Promise.all([
          getLeavePolicies(),
          getLeaveTypes(),
          userId ? getLeaveRequests({ user: userId }) : Promise.resolve([] as any[])
        ])
        // Build type map
        const tm: Record<number, string> = {}
        types.forEach(t => tm[t.id] = t.name)
        setTypeMap(tm)

        // Determine active/global policy (first is_active or first)
        const policy = (policies || []).find((p: any) => p.is_active) || (policies || [])[0]
        if (!policy) {
          setRows([])
          return
        }

        const currentYear = new Date().getFullYear()
        const reqs = Array.isArray(requests) ? requests : []
        const approvedReqs = reqs.filter((r: any) => {
          const d = new Date(r.start_date)
          const isSameYear = d.getFullYear() === currentYear
          const status = r.status
          return isSameYear && (status === 'approved' || status === 1 || status === 'APPROVED')
        })

        const totalsByType: Record<number, BalanceRow> = {}
        ;(policy.leave_types || []).forEach((lt: number) => {
          totalsByType[lt] = { leave_type: lt, total: Number(policy.annual_quota) || 0, used: 0 }
        })

        approvedReqs.forEach((req: any) => {
          const lt = req.leave_type
          if (lt in totalsByType) {
            const usedDays = Number(req.duration_days) || 0
            totalsByType[lt].used += usedDays
          }
        })

        setRows(Object.values(totalsByType))
      } catch (e) {
        console.error('Failed to load leave balances', e)
        setRows([])
      }
    })()
  }, [userId])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {rows.map((b) => {
        const total = b.total
        const used = Math.min(b.used, total)
        const remaining = Math.max(0, total - used)
        const percent = total > 0 ? (remaining / total) * 100 : 0
        return (
          <Card key={b.leave_type} className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground">{typeMap[b.leave_type] ?? `Type #${b.leave_type}`}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold">{remaining}</span>
                  <span className="text-sm text-muted-foreground">of {total}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {used}</span>
                  <span>{Math.round(percent)}%</span>
                </div>
                <Progress value={percent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )
      })}
      {rows.length === 0 && (
        <div className="text-sm text-muted-foreground">No leave policy or balances found.</div>
      )}
    </div>
  )
}
