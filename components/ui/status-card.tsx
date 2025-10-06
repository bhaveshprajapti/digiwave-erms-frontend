import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusCardProps {
  title: string
  status: string
  subtitle?: string
  icon: LucideIcon
  statusColor?: "primary" | "success" | "warning" | "error" | "info"
  className?: string
}

const statusColorMap = {
  primary: {
    border: "border-l-[#0074D9]",
    iconBg: "bg-gradient-to-br from-[#0074D9]/10 to-[#06B6D4]/5",
    iconColor: "text-[#0074D9]",
  },
  success: {
    border: "border-l-[#10B981]",
    iconBg: "bg-gradient-to-br from-[#10B981]/10 to-[#06B6D4]/5",
    iconColor: "text-[#10B981]",
  },
  warning: {
    border: "border-l-[#F59E0B]",
    iconBg: "bg-gradient-to-br from-[#F59E0B]/10 to-[#06B6D4]/5",
    iconColor: "text-[#F59E0B]",
  },
  error: {
    border: "border-l-[#EF4444]",
    iconBg: "bg-gradient-to-br from-[#EF4444]/10 to-[#06B6D4]/5",
    iconColor: "text-[#EF4444]",
  },
  info: {
    border: "border-l-[#06B6D4]",
    iconBg: "bg-gradient-to-br from-[#06B6D4]/10 to-[#0074D9]/5",
    iconColor: "text-[#06B6D4]",
  },
}

export function StatusCard({
  title,
  status,
  subtitle,
  icon: Icon,
  statusColor = "primary",
  className,
}: StatusCardProps) {
  const colors = statusColorMap[statusColor]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-l-4 bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm transition-all hover:shadow-md",
        colors.border,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{status}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("rounded-full p-3", colors.iconBg)}>
          <Icon className={cn("h-5 w-5", colors.iconColor)} />
        </div>
      </div>
    </div>
  )
}
