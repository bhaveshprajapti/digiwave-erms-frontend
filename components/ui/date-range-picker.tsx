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
    <div id="date-range-picker" className={cn("flex items-center flex-wrap gap-2", className)}>
      <div className="relative flex-1 min-w-[160px]">
        <DatePicker
          value={start}
          onChange={onChangeStart}
          placeholder="Start (DD/MM/YYYY)"
          inputClassName="h-10 ps-10"
          className="w-full"
          displayFormat="DD/MM/YYYY"
          useIST={useIST}
          disabled={disabled}
          maxDate={maxDate}
          minDate={minDate}
        />
      </div>
      <span className="text-gray-500 text-sm">to</span>
      <div className="relative flex-1 min-w-[160px]">
        <DatePicker
          value={end}
          onChange={onChangeEnd}
          placeholder="End (DD/MM/YYYY)"
          inputClassName="h-10 ps-10"
          className="w-full"
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