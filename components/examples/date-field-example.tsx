"use client"

import React, { useState } from 'react'
import { InlineDatepicker } from '@/components/ui/inline-datepicker'
import { Label } from '@/components/ui/label'

interface DateFieldExampleProps {
  label: string
  value?: string
  onChange: (date: string) => void
  useInline?: boolean
}

export function DateFieldExample({ label, value, onChange, useInline = false }: DateFieldExampleProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onChange(date.toISOString().split('T')[0])
    } else {
      onChange('')
    }
    setShowCalendar(false)
  }

  const selectedDate = value ? new Date(value) : undefined

  if (useInline) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div 
          id="datepicker-inline" 
          inline-datepicker 
          data-date={selectedDate ? selectedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}
        >
          <InlineDatepicker
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={value ? new Date(value).toLocaleDateString() : ''}
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full px-3 py-2 border rounded-md cursor-pointer"
          placeholder={`Select ${label.toLowerCase()}`}
        />
        {showCalendar && (
          <div className="absolute z-10 mt-1">
            <InlineDatepicker
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
