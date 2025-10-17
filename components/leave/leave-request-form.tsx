"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DatePicker } from "@/components/ui/date-picker"
import { getAvailableLeaveTypes } from "@/lib/api/leave-types"
import { createLeaveRequest } from "@/lib/api/leave-requests"
import { authService } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Calendar, Clock, Timer } from "lucide-react"
import { useLeaveRequestsContext } from "@/contexts/leave-requests-context"
import { FlexibleTimingForm } from "./flexible-timing-form"
import { formatUTCtoISTDate, getISTDateString } from "@/lib/timezone"
import { leaveEvents } from "@/hooks/use-leave-updates"

// Helper function to calculate duration (EXACTLY like backend Django model)
function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

function daysBetweenInclusive(a?: Date, b?: Date): number {
  if (!a || !b) return 0
  const startDate = `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, '0')}-${String(a.getDate()).padStart(2, '0')}`
  const endDate = `${b.getFullYear()}-${String(b.getMonth() + 1).padStart(2, '0')}-${String(b.getDate()).padStart(2, '0')}`
  return calculateDuration(startDate, endDate)
}

interface LeaveRequestFormProps {
  defaultRequestType?: 'full-day' | 'half-day' | 'hourly'
  onSuccess?: () => void
  showTabs?: boolean
}

export function LeaveRequestForm({ defaultRequestType = 'full-day', onSuccess, showTabs = true }: LeaveRequestFormProps = {}) {
  const { toast } = useToast()
  const [types, setTypes] = useState<{ value: number; label: string; color: string }[]>([])
  const [leaveType, setLeaveType] = useState("")
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()
  const [reason, setReason] = useState("")
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning')
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [totalHours, setTotalHours] = useState(0)
  const [requestType, setRequestType] = useState<'full-day' | 'half-day' | 'hourly'>(defaultRequestType)
  const [emergencyContact, setEmergencyContact] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [workHandover, setWorkHandover] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const { requests: existingRequests, balances, refreshAll, addRequest } = useLeaveRequestsContext()
  const user = authService.getUserData()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const typesData = await getAvailableLeaveTypes()
        setTypes(typesData.map((d: any) => ({
          value: d.id,
          label: `${d.name} (${d.code})`,
          color: d.color_code || '#007bff'
        })))
        await refreshAll()
      } catch (error) {
        console.error('Failed to load data', error)
      }
    }
    fetchData()
  }, [refreshAll])

  const getAvailableBalance = () => {
    if (!leaveType) return null
    const balance = balances.find(b => b.leave_type === Number(leaveType))
    return balance ? Number(balance.remaining_balance) || 0 : 0
  }

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    if (end <= start) return 0
    const diffMs = end.getTime() - start.getTime()
    return diffMs / (1000 * 60 * 60)
  }

  const calculateTotalDays = (): number => {
    if (requestType === 'half-day') return 0.5
    if (requestType === 'hourly') return totalHours / 8
    if (!start || !end) return 0
    return daysBetweenInclusive(start, end)
  }

  useEffect(() => {
    if (requestType === 'hourly' && startTime && endTime) {
      const hours = calculateHours(startTime, endTime)
      setTotalHours(hours)
    }
  }, [startTime, endTime, requestType])

  const hasDateConflict = () => {
    if (!start || !end) return false
    const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    return existingRequests.some((request: any) => {
      const status = request.status
      const isActive = status === 1 || status === 2 || status === 'pending' || status === 'approved' || status === 'draft' || !status
      if (!isActive) return false
      const requestStart = request.start_date
      const requestEnd = request.end_date
      return (startDate <= requestEnd && endDate >= requestStart)
    })
  }

  const getConflictingRequest = () => {
    if (!start || !end) return null
    const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    return existingRequests.find((request: any) => {
      const status = request.status
      const isActive = status === 1 || status === 2 || status === 'pending' || status === 'approved' || !status
      if (!isActive) return false
      const requestStart = request.start_date
      const requestEnd = request.end_date
      return (startDate <= requestEnd && endDate >= requestStart)
    })
  }

  const getValidationMessage = () => {
    if (!start || !end || !leaveType) return null
    const requestedDays = daysBetweenInclusive(start, end)
    const availableBalance = getAvailableBalance()
    if (availableBalance !== null && requestedDays > availableBalance) {
      return {
        type: 'error',
        message: `Insufficient balance! You have ${availableBalance} days available but requesting ${requestedDays} days.`
      }
    }
    if (hasDateConflict()) {
      const conflictingRequest = getConflictingRequest()
      const conflictStart = conflictingRequest ? formatUTCtoISTDate(conflictingRequest.start_date + 'T00:00:00Z') : ''
      const conflictEnd = conflictingRequest ? formatUTCtoISTDate(conflictingRequest.end_date + 'T00:00:00Z') : ''
      const getStatusName = (status: any) => {
        if (typeof status === 'string') return status.toLowerCase()
        return status === 1 ? 'pending' : status === 2 ? 'approved' : status === 3 ? 'rejected' : status === 4 ? 'cancelled' : 'pending'
      }
      const statusName = getStatusName(conflictingRequest?.status)
      return {
        type: 'error',
        message: `You already have a ${statusName} leave request from ${conflictStart} to ${conflictEnd} that overlaps with the selected dates. Please choose different dates.`
      }
    }
    return {
      type: 'success',
      message: `Valid request: ${requestedDays} days will be deducted from your ${availableBalance || 0} available days.`
    }
  }

  const submit = async () => {
    if (!user?.id) {
      toast({ title: 'Not logged in', variant: 'destructive' })
      return
    }
    if (!leaveType) {
      toast({ title: 'Please select a leave type', variant: 'destructive' })
      return
    }
    if (!start || !end) {
      toast({ title: 'Please select date range', variant: 'destructive' })
      return
    }
    if (requestType === 'half-day' && start && end && (start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth() || start.getDate() !== end.getDate())) {
      toast({ title: 'Half day leave must have same start and end date', variant: 'destructive' })
      return
    }
    const diff = daysBetweenInclusive(start, end)
    if (requestType === 'half-day') {
      if (diff < 0) {
        toast({ title: 'Invalid date range', variant: 'destructive' })
        return
      }
    } else {
      if (diff <= 0) {
        toast({ title: 'Invalid date range', variant: 'destructive' })
        return
      }
    }
    const availableBalance = getAvailableBalance()
    const requestedDays = requestType === 'half-day' ? 0.5 : diff
    if (availableBalance !== null && requestedDays > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You have ${availableBalance} days available but requesting ${requestedDays} days.`,
        variant: 'destructive'
      })
      return
    }
    if (hasDateConflict()) {
      toast({
        title: 'Date Conflict',
        description: 'You already have a pending request for this leave type during the selected dates.',
        variant: 'destructive'
      })
      return
    }
    if (!reason.trim()) {
      toast({ title: 'Please provide a reason', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const requestData: any = {
        leave_type: Number(leaveType),
        start_date: start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : '',
        end_date: end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}` : '',
        reason: reason.trim(),
        emergency_contact: emergencyContact.trim() || undefined,
        emergency_phone: emergencyPhone.trim() || undefined,
        work_handover: workHandover.trim() || undefined,
        attachment: attachment || undefined,
      }
      if (requestType === 'half-day') {
        requestData.is_half_day = true
        requestData.half_day_period = halfDayPeriod
        requestData.total_days = 0.5
      } else {
        requestData.is_half_day = false
        requestData.total_days = calculateTotalDays()
      }
      const newRequest = await createLeaveRequest(requestData)
      toast({
        title: 'Success',
        description: 'Your leave request has been submitted successfully.'
      })
      leaveEvents.requestCreated(newRequest?.id || Date.now(), user.id)
      setLeaveType("")
      setStart(undefined)
      setEnd(undefined)
      setReason("")
      setRequestType('full-day')
      setHalfDayPeriod('morning')
      setStartTime("")
      setEndTime("")
      setTotalHours(0)
      setEmergencyContact("")
      setEmergencyPhone("")
      setWorkHandover("")
      setAttachment(null)
      await refreshAll()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to submit leave request',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const validationMessage = getValidationMessage()
  const availableBalance = getAvailableBalance()
  const requestedDays = daysBetweenInclusive(start, end)

  return (
    <div className="space-y-6">
      <Tabs value={requestType} onValueChange={(value: any) => setRequestType(value)} className="w-full">
        {showTabs && (
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="full-day">Full Day</TabsTrigger>
            <TabsTrigger value="half-day">Half Day</TabsTrigger>
            <TabsTrigger value="hourly">Hourly</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="full-day" className="p-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t.value} value={t.value.toString()}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {leaveType && availableBalance !== null && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Available: {availableBalance} days
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range *</Label>
              <DateRangePicker
                start={start}
                end={end}
                onChangeStart={setStart}
                onChangeEnd={setEnd}
                useIST={true}
                minDate={new Date()}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Duration: {requestedDays} day{requestedDays !== 1 ? 's' : ''}
                {requestedDays > 0 && availableBalance !== null && (
                  <span className="ml-2">• Remaining: {Math.max(0, availableBalance - requestedDays)} days</span>
                )}
              </p>
            </div>
            {validationMessage && (
              <Badge
                variant={validationMessage.type === 'error' ? 'destructive' : 'default'}
                className="w-full justify-start p-3 text-sm"
              >
                {validationMessage.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                {validationMessage.message}
              </Badge>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter a reason for your leave request"
                rows={4}
                className="w-full resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={submit}
                disabled={saving || (validationMessage?.type === 'error')}
                className="px-6"
              >
                {saving ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="half-day" className="p-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t.value} value={t.value.toString()}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {leaveType && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Available: {getAvailableBalance()} days
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date *</Label>
              <DatePicker
                value={start}
                onChange={(date) => { setStart(date); setEnd(date); }}
                placeholder="Select date (DD/MM/YYYY)"
                displayFormat="DD/MM/YYYY"
                useIST={true}
                minDate={new Date()}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Half Day Period *</Label>
              <Select value={halfDayPeriod} onValueChange={setHalfDayPeriod as (value: string) => void}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (First Half)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (Second Half)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {halfDayPeriod === 'morning' ? 'Absent in morning, work in afternoon' : 'Work in morning, absent in afternoon'}
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-medium">Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason for your half-day leave request"
              rows={4}
              className="w-full resize-none"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={submit}
              disabled={saving || !start || !leaveType}
              className="px-6"
            >
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="hourly" className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t.value} value={t.value.toString()}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date *</Label>
              <DateRangePicker
                start={start}
                end={start}
                onChangeStart={(date) => { setStart(date); setEnd(date); }}
                onChangeEnd={(date) => { setStart(date); setEnd(date); }}
                useIST={true}
                minDate={new Date()}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10"
              />
            </div>
            {totalHours > 0 && (
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="h-10 flex items-center justify-center bg-secondary rounded-md px-3">
                  <Badge variant="secondary" className="border-0">
                    <Timer className="h-3 w-3 mr-2" />
                    {totalHours.toFixed(1)} hours ({(totalHours / 8).toFixed(2)} days)
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-medium">Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason for your hourly leave request"
              rows={4}
              className="w-full resize-none"
            />
          </div>
          <Button
            onClick={submit}
            disabled={saving || !start || !leaveType || !startTime || !endTime || totalHours <= 0}
            className="w-full h-11 mt-4"
            size="lg"
          >
            {saving ? 'Submitting...' : 'Submit Hourly Leave Request'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}