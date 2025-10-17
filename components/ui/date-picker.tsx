"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { 
  getCurrentIST, 
  getISTDateString, 
  formatUTCtoISTDate, 
  parseISTDateForAPI 
} from "@/lib/timezone"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  displayFormat?: 'MM-DD-YYYY' | 'DD/MM/YYYY'
  maxDate?: Date // Maximum selectable date
  minDate?: Date // Minimum selectable date
  disableFuture?: boolean // Disable future dates
  id?: string // Optional unique ID for the input element
  useIST?: boolean // Use IST timezone for date operations (default: true)
}

function formatDate(date: Date | undefined, fmt: 'MM-DD-YYYY' | 'DD/MM/YYYY' = 'DD/MM/YYYY', useIST: boolean = true) {
  if (!date) return ''
  
  // Always use local date parts to avoid timezone conversion issues
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return fmt === 'DD/MM/YYYY' ? `${dd}/${mm}/${yyyy}` : `${mm}-${dd}-${yyyy}`
}

function parseInputToDate(text: string, preferDMY = true, useIST = true): Date | undefined {
  const s = text.trim()
  if (!s) return undefined
  
  // Try DD/MM/YYYY format (preferred)
  let m = s.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/)
  if (m) {
    const dd = parseInt(m[1], 10)
    const mm = parseInt(m[2], 10)
    const yyyy = parseInt(m[3], 10)
    
    // Validate ranges
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2100) {
      // Always create date using local constructor to avoid timezone shifts
      const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0)
      
      // Verify the date is valid (e.g., Feb 30th would be invalid)
      if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) {
        return d
      }
    }
  }
  
  return undefined
}

// Format input as DD/MM/YYYY while typing
function formatInputValue(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Format based on length
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}

// Validate date parts as user types
function validateDateInput(value: string): boolean {
  const parts = value.split('/')
  
  // Check day (01-31)
  if (parts[0]) {
    const day = parseInt(parts[0], 10)
    if (parts[0].length === 2 && (day < 1 || day > 31)) return false
  }
  
  // Check month (01-12)
  if (parts[1]) {
    const month = parseInt(parts[1], 10)
    if (parts[1].length === 2 && (month < 1 || month > 12)) return false
  }
  
  // Check year (1900-2100)
  if (parts[2]) {
    const year = parseInt(parts[2], 10)
    if (parts[2].length === 4 && (year < 1900 || year > 2100)) return false
  }
  
  return true
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className, 
  inputClassName, 
  displayFormat = 'DD/MM/YYYY',
  maxDate,
  minDate,
  disableFuture = false,
  id,
  useIST = true
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState<string>(formatDate(value, displayFormat, useIST))
  const isDisabled = Boolean(disabled)
  const uniqueId = React.useId()
  const inputId = id || `datepicker-${uniqueId}`
  
  // Calculate effective max date using IST if enabled
  const effectiveMaxDate = React.useMemo(() => {
    const today = useIST ? getCurrentIST() : new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    if (disableFuture && maxDate) {
      return today < maxDate ? today : maxDate
    }
    if (disableFuture) {
      return today
    }
    return maxDate
  }, [maxDate, disableFuture])

  React.useEffect(() => {
    setText(formatDate(value, displayFormat, useIST))
  }, [value, displayFormat, useIST])

  React.useEffect(() => {
    if (isDisabled) setOpen(false)
  }, [isDisabled])

  const commitText = () => {
    if (isDisabled) return
    const parsed = parseInputToDate(text, displayFormat === 'DD/MM/YYYY', useIST)
    
    // Validate against min/max dates
    if (parsed) {
      if (minDate && parsed < minDate) {
        setText(formatDate(value, displayFormat, useIST))
        return
      }
      if (effectiveMaxDate && parsed > effectiveMaxDate) {
        setText(formatDate(value, displayFormat, useIST))
        return
      }
    }
    
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
            id={inputId}
            value={text}
            onChange={(e) => {
              const input = e.target.value
              // Only allow digits and slashes
              const cleaned = input.replace(/[^\d\/]/g, '')
              // Format the input
              const formatted = formatInputValue(cleaned)
              // Validate before setting
              if (validateDateInput(formatted)) {
                setText(formatted)
              }
            }}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitText()
                setOpen(false)
              }
            }}
            placeholder={placeholder ?? 'DD/MM/YYYY'}
            disabled={isDisabled}
            className={cn("ps-10", inputClassName)}
            maxLength={10}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          fromYear={minDate ? minDate.getFullYear() : 1950}
          toYear={effectiveMaxDate ? effectiveMaxDate.getFullYear() : 2100}
          selected={value}
          onSelect={(date) => {
            if (isDisabled) return
            // Always create date using local constructor to avoid timezone shifts
            if (date) {
              const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
              onChange?.(adjustedDate)
            } else {
              onChange?.(date)
            }
            setOpen(false)
          }}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (effectiveMaxDate && date > effectiveMaxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
