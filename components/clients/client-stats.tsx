"use client"

import { StatusCard } from "@/components/ui/status-card"
import { Users, TrendingUp, DollarSign, FileText } from "lucide-react"

const stats = [
  {
    title: "Total Clients",
    status: "48",
    icon: Users,
    statusColor: "primary" as const,
  },
  {
    title: "Active Projects",
    status: "24",
    icon: TrendingUp,
    statusColor: "success" as const,
  },
  {
    title: "Total Revenue",
    status: "$2.4M",
    icon: DollarSign,
    statusColor: "info" as const,
  },
  {
    title: "Pending Quotes",
    status: "12",
    icon: FileText,
    statusColor: "warning" as const,
  },
]

export function ClientStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatusCard
          key={stat.title}
          title={stat.title}
          status={stat.status}
          icon={stat.icon}
          statusColor={stat.statusColor}
        />
      ))}
    </div>
  )
}
