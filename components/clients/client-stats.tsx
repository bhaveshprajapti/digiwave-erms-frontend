"use client"

import { StatusCard } from "@/components/ui/status-card"
import { Users, UserCheck } from "lucide-react"

interface ClientStatsProps {
  totalClients: number
  activeClients: number
  inactiveClients: number
  loading?: boolean
}

export function ClientStats({ totalClients, activeClients, inactiveClients, loading }: ClientStatsProps) {
  const stats = [
    {
      title: "Total Clients",
      status: loading ? "..." : (totalClients || 0).toString(),
      icon: Users,
      statusColor: "primary" as const,
    },
    {
      title: "Active Clients",
      status: loading ? "..." : (activeClients || 0).toString(),
      icon: UserCheck,
      statusColor: "success" as const,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 mb-6">
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
