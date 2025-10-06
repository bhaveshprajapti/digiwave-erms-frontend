"use client"

import { StatusCard } from "@/components/ui/status-card"
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react"

const stats = [
  {
    title: "Total Expenses",
    status: "$48,250",
    subtitle: "+12.5%",
    icon: DollarSign,
    statusColor: "primary" as const,
  },
  {
    title: "This Month",
    status: "$12,840",
    subtitle: "+8.2%",
    icon: Calendar,
    statusColor: "success" as const,
  },
  {
    title: "Pending",
    status: "$3,420",
    subtitle: "5 items",
    icon: CreditCard,
    statusColor: "warning" as const,
  },
  {
    title: "Avg per Month",
    status: "$16,083",
    subtitle: "+5.4%",
    icon: TrendingUp,
    statusColor: "info" as const,
  },
]

export function ExpenseStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatusCard
          key={stat.title}
          title={stat.title}
          status={stat.status}
          subtitle={stat.subtitle}
          icon={stat.icon}
          statusColor={stat.statusColor}
        />
      ))}
    </div>
  )
}
