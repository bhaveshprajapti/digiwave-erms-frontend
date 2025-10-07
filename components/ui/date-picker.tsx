"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
}

function formatDateMMDDYYYY(date: Date | undefined) {
  if (!date) return ''
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}-${dd}-${yyyy}`
}

function parseInputToDate(text: string): Date | undefined {
  const s = text.trim()
  if (!s) return undefined
  // Try YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-\/]?(\d{1,2})[-\/]?(\d{1,2})$/)
  if (m) {
    const yyyy = parseInt(m[1], 10)
    const mm = parseInt(m[2], 10)
    const dd = parseInt(m[3], 10)
    const d = new Date(yyyy, mm - 1, dd)
    if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) return d
  }
  // Try MM-DD-YYYY or MM/DD/YYYY
  m = s.match(/^(\d{1,2})[-\/]?(\d{1,2})[-\/]?(\d{4})$/)
  if (m) {
    const mm = parseInt(m[1], 10)
    const dd = parseInt(m[2], 10)
    const yyyy = parseInt(m[3], 10)
    const d = new Date(yyyy, mm - 1, dd)
    if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) return d
  }
  return undefined
}

export function DatePicker({ value, onChange, placeholder = "MM-DD-YYYY", disabled, className, inputClassName }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState<string>(formatDateMMDDYYYY(value))
  const isDisabled = Boolean(disabled)

  React.useEffect(() => {
    setText(formatDateMMDDYYYY(value))
  }, [value])

  React.useEffect(() => {
    if (isDisabled) setOpen(false)
  }, [isDisabled])

  const commitText = () => {
    if (isDisabled) return
    const parsed = parseInputToDate(text)
    onChange?.(parsed)
  }

  return (
    <Popover open={!isDisabled && open} onOpenChange={(o)=>{ if (!isDisabled) setOpen(o) }}>
      <PopoverTrigger asChild>
        <div className={cn('relative max-w-full', className, isDisabled && 'pointer-events-none opacity-80')}
             aria-disabled={isDisabled}>
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            id="datepicker-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitText()
                setOpen(false)
              }
            }}
            placeholder={placeholder}
            disabled={isDisabled}
            className={cn("ps-10", inputClassName)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          fromYear={1950}
          toYear={2100}
          selected={value}
          onSelect={(date) => {
            if (isDisabled) return
            onChange?.(date)
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
