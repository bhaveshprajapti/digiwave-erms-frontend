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
  displayFormat?: 'MM-DD-YYYY' | 'DD/MM/YYYY'
}

function formatDate(date: Date | undefined, fmt: 'MM-DD-YYYY' | 'DD/MM/YYYY' = 'MM-DD-YYYY') {
  if (!date) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return fmt === 'DD/MM/YYYY' ? `${dd}/${mm}/${yyyy}` : `${mm}-${dd}-${yyyy}`
}

function parseInputToDate(text: string, preferDMY = false): Date | undefined {
  const s = text.trim()
  if (!s) return undefined
  // Try ISO-like YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-\/]?(\d{1,2})[-\/]?(\d{1,2})$/)
  if (m) {
    const yyyy = parseInt(m[1], 10)
    const mm = parseInt(m[2], 10)
    const dd = parseInt(m[3], 10)
    const d = new Date(yyyy, mm - 1, dd)
    if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) return d
  }
  // Depending on preference, try DD/MM/YYYY before MM/DD/YYYY
  if (preferDMY) {
    m = s.match(/^(\d{1,2})[-\/]?(\d{1,2})[-\/]?(\d{4})$/)
    if (m) {
      const dd = parseInt(m[1], 10)
      const mm = parseInt(m[2], 10)
      const yyyy = parseInt(m[3], 10)
      const d = new Date(yyyy, mm - 1, dd)
      if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) return d
    }
  } else {
    // Try MM-DD-YYYY or MM/DD/YYYY
    m = s.match(/^(\d{1,2})[-\/]?(\d{1,2})[-\/]?(\d{4})$/)
    if (m) {
      const mm = parseInt(m[1], 10)
      const dd = parseInt(m[2], 10)
      const yyyy = parseInt(m[3], 10)
      const d = new Date(yyyy, mm - 1, dd)
      if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) return d
    }
  }
  return undefined
}

export function DatePicker({ value, onChange, placeholder, disabled, className, inputClassName, displayFormat = 'MM-DD-YYYY' }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState<string>(formatDate(value, displayFormat))
  const isDisabled = Boolean(disabled)

  React.useEffect(() => {
    setText(formatDate(value, displayFormat))
  }, [value, displayFormat])

  React.useEffect(() => {
    if (isDisabled) setOpen(false)
  }, [isDisabled])

  const commitText = () => {
    if (isDisabled) return
    const parsed = parseInputToDate(text, displayFormat === 'DD/MM/YYYY')
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
            placeholder={placeholder ?? (displayFormat === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : 'MM-DD-YYYY')}
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
