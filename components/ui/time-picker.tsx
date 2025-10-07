"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  min?: string
  max?: string
  withSeconds?: boolean
}

export function TimePicker({ date, setDate, label, min, max, withSeconds = true }: TimePickerProps) {
  const [timeValue, setTimeValue] = React.useState('')

  // Update input value when date changes
  React.useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      setTimeValue(withSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`)
    } else {
      setTimeValue('')
    }
  }, [date])

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTimeValue(value)
    
    if (value) {
      const parts = value.split(':').map(Number)
      const [hours, minutes, seconds = 0] = parts
      const newDate = new Date()
      newDate.setHours(hours, minutes, seconds, 0)
      setDate(newDate)
    } else {
      setDate(undefined)
    }
  }

  return (
    <div className="grid gap-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <div className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
          <svg 
            className="w-4 h-4 text-gray-500 dark:text-gray-400" 
            aria-hidden="true" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              fillRule="evenodd" 
              d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" 
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input 
          type="time" 
          className={cn(
            "bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
            "h-10"
          )}
          value={timeValue}
          onChange={handleTimeChange}
          min={min}
          max={max}
          step={withSeconds ? 1 : 60}
          required
        />
      </div>
    </div>
  )
}