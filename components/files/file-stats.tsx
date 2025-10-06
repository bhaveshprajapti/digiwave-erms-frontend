"use client"

import { StatusCard } from "@/components/ui/status-card"
import { FileText, ImageIcon, FileArchive, HardDrive } from "lucide-react"

const stats = [
  {
    title: "Total Files",
    status: "248",
    icon: FileText,
    statusColor: "primary" as const,
  },
  {
    title: "Images",
    status: "86",
    icon: ImageIcon,
    statusColor: "info" as const,
  },
  {
    title: "Documents",
    status: "142",
    icon: FileArchive,
    statusColor: "success" as const,
  },
  {
    title: "Storage Used",
    status: "4.2 GB",
    icon: HardDrive,
    statusColor: "warning" as const,
  },
]

export function FileStats() {
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
