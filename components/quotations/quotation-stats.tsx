"use client"

import { StatusCard } from "@/components/ui/status-card"
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react"

const stats = [
  {
    title: "Total Quotes",
    status: "36",
    icon: FileText,
    statusColor: "primary" as const,
  },
  {
    title: "Accepted",
    status: "18",
    icon: CheckCircle2,
    statusColor: "success" as const,
  },
  {
    title: "Pending",
    status: "12",
    icon: Clock,
    statusColor: "warning" as const,
  },
  {
    title: "Rejected",
    status: "6",
    icon: XCircle,
    statusColor: "error" as const,
  },
]

export function QuotationStats() {
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
