"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, Heart, Plane, Clock } from "lucide-react"

const leaveBalances = [
  { type: "Casual Leave", total: 18, used: 5, remaining: 13, icon: Calendar, color: "primary" as const },
  { type: "Sick Leave", total: 12, used: 2, remaining: 10, icon: Heart, color: "success" as const },
  { type: "Annual Leave", total: 15, used: 8, remaining: 7, icon: Plane, color: "info" as const },
  { type: "Flex Allowance", total: 12, used: 3, remaining: 9, icon: Clock, color: "warning" as const },
]

export function LeaveBalanceCard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {leaveBalances.map((leave) => (
        <Card key={leave.type} className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{leave.type}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold">{leave.remaining}</span>
                  <span className="text-sm text-muted-foreground">of {leave.total}</span>
                </div>
              </div>
              <div className="rounded-full bg-gradient-to-br from-primary/10 to-secondary/5 p-3">
                <leave.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used: {leave.used}</span>
                <span>{Math.round((leave.remaining / leave.total) * 100)}%</span>
              </div>
              <Progress value={(leave.remaining / leave.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
