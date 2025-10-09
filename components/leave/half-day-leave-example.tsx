"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

export function HalfDayLeaveExample() {
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning')
  const [totalDays, setTotalDays] = useState(1)

  // Calculate total days based on half-day selection
  const calculateTotalDays = (startDate: string, endDate: string, isHalf: boolean) => {
    if (isHalf) {
      return 0.5 // Half day is always 0.5 days
    }
    // Calculate full days between start and end date
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Half-Day Leave Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Half-Day Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="half-day"
            checked={isHalfDay}
            onCheckedChange={(checked) => {
              setIsHalfDay(checked as boolean)
              setTotalDays(checked ? 0.5 : 1)
            }}
          />
          <Label htmlFor="half-day" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            This is a half-day leave
          </Label>
        </div>

        {/* Half-Day Period Selection */}
        {isHalfDay && (
          <div className="space-y-2">
            <Label>Half-Day Period *</Label>
            <Select value={halfDayPeriod} onValueChange={(value: 'morning' | 'afternoon') => setHalfDayPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (First Half)</SelectItem>
                <SelectItem value="afternoon">Afternoon (Second Half)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {halfDayPeriod === 'morning' 
                ? 'You will be absent in the morning and work in the afternoon'
                : 'You will work in the morning and be absent in the afternoon'
              }
            </p>
          </div>
        )}

        {/* Total Days Display */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Leave Days</span>
            <Badge variant={isHalfDay ? "secondary" : "default"}>
              {totalDays} {totalDays === 1 ? 'day' : 'days'}
            </Badge>
          </div>
          {isHalfDay && (
            <p className="text-xs text-muted-foreground mt-1">
              Half-day leave will deduct 0.5 days from your balance
            </p>
          )}
        </div>

        {/* Example Usage in Leave Request */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">How to integrate in your leave request form:</h4>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            <div>// In your leave request form data:</div>
            <div className="text-blue-600">is_half_day: {isHalfDay.toString()}</div>
            <div className="text-blue-600">half_day_period: "{halfDayPeriod}"</div>
            <div className="text-blue-600">total_days: {totalDays}</div>
            <div className="mt-2 text-gray-600">
              // Your backend will automatically handle the 0.5 day deduction
            </div>
          </div>
        </div>

        {/* Integration Notes */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Integration Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Add these fields to your existing leave request form</li>
            <li>• Your LeaveApplication model already supports half-day leaves</li>
            <li>• The backend automatically calculates 0.5 days for half-day requests</li>
            <li>• Leave balance is properly deducted (e.g., 10.5 days remaining)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
