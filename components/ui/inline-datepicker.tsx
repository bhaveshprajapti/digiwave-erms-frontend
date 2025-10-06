"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface InlineDatepickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  defaultDate?: string
}

export function InlineDatepicker({ value, onChange, className, defaultDate }: InlineDatepickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value || (defaultDate ? new Date(defaultDate) : undefined)
  )

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    onChange?.(date)
  }

  return (
    <div className={cn("inline-datepicker", className)}>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        className="rounded-md border"
      />
    </div>
  )
}

// Utility function to format date for the data-date attribute
export function formatDateForAttribute(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}
