"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getLeaveBalances } from "@/lib/api/leave-balances"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { authService } from "@/lib/auth"

export function LeaveBalanceCard() {
  const userId = useMemo(() => authService.getUserData()?.id, [])
  const [rows, setRows] = useState<any[]>([])
  const [typeMap, setTypeMap] = useState<Record<number, string>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const [balances, types] = await Promise.all([getLeaveBalances(), getLeaveTypes()])
        const tm: Record<number, string> = {}
        types.forEach(t => tm[t.id] = t.name)
        setTypeMap(tm)
        setRows((balances || []).filter(b => Number(b.user) === Number(userId)))
      } catch {}
    })()
  }, [userId])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {rows.map((b) => {
        const total = Number(b.opening_balance) + Number(b.carried_forward)
        const used = Number(b.used)
        const remaining = Math.max(0, total - used)
        const percent = total > 0 ? (remaining / total) * 100 : 0
        return (
          <Card key={b.id} className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/20">
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
        <div className="text-sm text-muted-foreground">No balances found.</div>
      )}
    </div>
  )
}
