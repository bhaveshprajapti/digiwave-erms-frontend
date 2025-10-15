"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface MobileInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  countryCode?: string
}

export function MobileInput({ 
  value = "", 
  onChange, 
  placeholder = "1234567890", 
  disabled, 
  className, 
  inputClassName,
  countryCode = "+91"
}: MobileInputProps) {
  const [mobileNumber, setMobileNumber] = React.useState(value)

  React.useEffect(() => {
    setMobileNumber(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '') // Remove non-digits
    
    // Limit to 10 digits
    if (inputValue.length > 10) {
      inputValue = inputValue.slice(0, 10)
    }

    setMobileNumber(inputValue)
    onChange?.(inputValue)
  }

  const formatDisplayValue = (number: string) => {
    if (!number) return ""
    
    // Format as: 12345 67890
    if (number.length <= 5) {
      return number
    } else {
      return `${number.slice(0, 5)} ${number.slice(5)}`
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country Code Display */}
        <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
          {countryCode}
        </div>
        
        {/* Mobile Number Input */}
        <Input
          type="tel"
          value={formatDisplayValue(mobileNumber)}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "rounded-l-none",
            inputClassName
          )}
          maxLength={11} // 5 + space + 5 digits
        />
      </div>
      
      {/* Validation hint */}
      {mobileNumber && mobileNumber.length !== 10 && (
        <p className="text-xs text-red-500 mt-1">
          Mobile number must be exactly 10 digits
        </p>
      )}
    </div>
  )
}