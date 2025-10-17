"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getMyLeaveBalances } from "@/lib/api/leave-balances"
import { Calendar, Clock, CheckCircle } from "lucide-react"

export function LeaveBalanceCard() {
  const [balances, setBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true)
        const data = await getMyLeaveBalances()
        setBalances(data)
      } catch (error) {
        console.error('Failed to load leave balances', error)
        setBalances([])
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-2 bg-muted rounded mb-1"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {balances.map((balance) => {
        const total = Number(balance.total_available) || 0
        const used = Number(balance.used_balance) || 0
        const remaining = Number(balance.remaining_balance) || 0
        const percent = total > 0 ? (remaining / total) * 100 : 0

        return (
          <Card
            key={`${balance.leave_type}-${balance.year}`}
            className="border-l-4 bg-gradient-to-br from-card to-muted/20"
            style={{ borderLeftColor: balance.leave_type_color || '#007bff' }}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" style={{ color: balance.leave_type_color || '#007bff' }} />
                  <p className="text-sm font-medium text-muted-foreground">
                    {balance.leave_type_name}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{remaining}</span>
                  <span className="text-sm text-muted-foreground">of {total}</span>
                </div>
                {balance.pending_balance < remaining && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-amber-600">
                      {balance.pending_balance} after pending
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {used}</span>
                  <span>{Math.round(percent)}% available</span>
                </div>
                <Progress value={percent} className="h-2" />
                {balance.accrued_balance > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>+{balance.accrued_balance} accrued this year</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
      {balances.length === 0 && !loading && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-medium mb-2">No Leave Balances Found</p>
          <p className="text-sm">Your leave balances will appear here once they are set up by HR.</p>
        </div>
      )}
    </div>
  )
}
