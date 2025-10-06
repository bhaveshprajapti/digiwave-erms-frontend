"use client"

import { StatusCard } from "@/components/ui/status-card"
import { FolderKanban, CheckCircle2, Clock, AlertCircle } from "lucide-react"

const stats = [
  {
    title: "Total Projects",
    status: "24",
    icon: FolderKanban,
    statusColor: "primary" as const,
  },
  {
    title: "Completed",
    status: "12",
    icon: CheckCircle2,
    statusColor: "success" as const,
  },
  {
    title: "In Progress",
    status: "8",
    icon: Clock,
    statusColor: "warning" as const,
  },
  {
    title: "Overdue",
    status: "4",
    icon: AlertCircle,
    statusColor: "error" as const,
  },
]

export function ProjectStats() {
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
