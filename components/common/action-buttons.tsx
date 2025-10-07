"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Edit2, Trash2, MoreHorizontal } from "lucide-react"

export type ExtraAction = {
  title: string
  onClick: () => void
  icon?: React.ReactNode
  className?: string
}

interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
  extras?: ExtraAction[]
  size?: "sm" | "md"
  compact?: boolean
  disabled?: boolean
}

export function ActionButtons({ onEdit, onDelete, extras = [], size = "sm", compact = true, disabled }: ActionButtonsProps) {
  const baseBtn = cn(
    "inline-flex items-center justify-center rounded-md transition-colors",
    size === "sm" ? "h-8 w-8 p-0" : "h-9 px-2",
    compact ? "bg-transparent hover:bg-muted" : "bg-accent hover:bg-accent/80"
  )

  return (
    <div className="flex items-center gap-2">
      {onEdit && (
        <Button type="button" variant="ghost" className={cn(baseBtn, "hover:bg-yellow-100")}
          onClick={onEdit} disabled={disabled} title="Edit">
          <Edit2 className="h-4 w-4 text-yellow-600" />
        </Button>
      )}
      {onDelete && (
        <Button type="button" variant="ghost" className={cn(baseBtn, "hover:bg-red-100")}
          onClick={onDelete} disabled={disabled} title="Delete">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      )}
      {extras.map((x, idx) => (
        <Button key={idx} type="button" variant="ghost" className={cn(baseBtn, x.className)}
          onClick={x.onClick} disabled={disabled} title={x.title} aria-label={x.title}>
          {x.icon ?? <MoreHorizontal className="h-4 w-4" />}
        </Button>
      ))}
    </div>
  )
}
