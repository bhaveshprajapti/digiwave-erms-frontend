"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

export function LeaveRequestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [duration, setDuration] = useState(0)

  const leaveBalances: Record<string, { remaining: number; total: number }> = {
    casual: { remaining: 13, total: 18 },
    sick: { remaining: 10, total: 12 },
    annual: { remaining: 7, total: 15 },
  }

  const calculateDuration = (start?: Date, end?: Date) => {
    if (start && end) {
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      setDuration(diff > 0 ? diff : 0)
    } else {
      setDuration(0)
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    calculateDuration(date, endDate)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    calculateDuration(startDate, date)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mock submission
    setTimeout(() => {
      router.push("/dashboard/leave")
    }, 1000)
  }

  const selectedBalance = leaveType ? leaveBalances[leaveType] : null

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType} required>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave (13 of 18 remaining)</SelectItem>
                  <SelectItem value="sick">Sick Leave (10 of 12 remaining)</SelectItem>
                  <SelectItem value="annual">Annual Leave (7 of 15 remaining)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedBalance && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You have {selectedBalance.remaining} of {selectedBalance.total} days remaining for this leave type.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker value={startDate} onChange={handleStartDateChange} placeholder="Select start date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  placeholder="Select end date"
                  disabled={!startDate}
                />
              </div>
            </div>

            {duration > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>Duration: {duration} day(s)</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" placeholder="Please provide a reason for your leave request" required rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Supporting Document (Optional)</Label>
              <Input id="document" type="file" accept=".pdf,.jpg,.jpeg,.png" />
              <p className="text-xs text-muted-foreground">Upload medical certificate or other supporting documents</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || duration === 0}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </div>
    </form>
  )
}
