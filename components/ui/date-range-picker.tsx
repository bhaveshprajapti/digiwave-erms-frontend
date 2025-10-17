"use client"

import * as React from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  start?: Date
  end?: Date
  onChangeStart?: (date: Date | undefined) => void
  onChangeEnd?: (date: Date | undefined) => void
  className?: string
  useIST?: boolean // Use IST timezone (default: true)
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
}

export function DateRangePicker({
  start,
  end,
  onChangeStart,
  onChangeEnd,
  className,
  useIST = true,
  disabled = false,
  maxDate,
  minDate
}: DateRangePickerProps) {
  return (
    <div id="date-range-picker" className={cn("flex items-center", className)}>
      <div className="relative">
        <DatePicker
          value={start}
          onChange={onChangeStart}
          placeholder="Start Date (DD/MM/YYYY)"
          inputClassName="h-9 ps-10"
          className="min-w-[180px]"
          displayFormat="DD/MM/YYYY"
          useIST={useIST}
          disabled={disabled}
          maxDate={maxDate}
          minDate={minDate}
        />
      </div>
      <span className="mx-2 text-gray-500">to</span>
      <div className="relative">
        <DatePicker
          value={end}
          onChange={onChangeEnd}
          placeholder="End Date (DD/MM/YYYY)"
          inputClassName="h-9 ps-10"
          className="min-w-[180px]"
          displayFormat="DD/MM/YYYY"
          useIST={useIST}
          disabled={disabled}
          maxDate={maxDate}
          minDate={minDate}
        />
      </div>
    </div>
  )
}