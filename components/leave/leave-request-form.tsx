"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { getAvailableLeaveTypes } from "@/lib/api/leave-types"
import { createLeaveRequest } from "@/lib/api/leave-requests"
import { authService } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, Clock } from "lucide-react"
import { useLeaveRequestsContext } from "@/contexts/leave-requests-context"

// Helper function to calculate duration (EXACTLY like backend Django model)
function calculateDuration(startDate: string, endDate: string): number {
  // Convert date strings to Date objects (same as Django)
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  // Calculate difference in days (same as Django: (end_date - start_date).days)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Add 1 to include both start and end dates (same as Django: + 1)
  return diffDays
}

function daysBetweenInclusive(a?: Date, b?: Date): number {
  if (!a || !b) return 0

  // Format dates as YYYY-MM-DD strings (same as backend format)
  const startDate = `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, '0')}-${String(a.getDate()).padStart(2, '0')}`
  const endDate = `${b.getFullYear()}-${String(b.getMonth() + 1).padStart(2, '0')}-${String(b.getDate()).padStart(2, '0')}`

  // Use the same calculation as backend Django model
  return calculateDuration(startDate, endDate)
}
export function LeaveRequestForm() {
  const { toast } = useToast()
  const [types, setTypes] = useState<{ value: number; label: string; color: string }[]>([])
  const [leaveType, setLeaveType] = useState("")
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()
  const [reason, setReason] = useState("")
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning')
  const [emergencyContact, setEmergencyContact] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [workHandover, setWorkHandover] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Use centralized state management
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

        // Load initial data into context
        await refreshAll()
      } catch (error) {
        console.error('Failed to load data', error)
      }
    }

    fetchData()
  }, [refreshAll])

  // Get available balance for selected leave type
  const getAvailableBalance = () => {
    if (!leaveType) return null
    const balance = balances.find(b => b.leave_type === Number(leaveType))
    return balance ? Number(balance.remaining_balance) || 0 : 0
  }

  // Check for date conflicts with existing requests (any overlapping dates regardless of leave type)
  const hasDateConflict = () => {
    if (!start || !end) return false
    
    const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    
    return existingRequests.some((request: any) => {
      // Only check active requests (pending or approved)
      const status = request.status
      const isActive = status === 1 || status === 2 || status === 'pending' || status === 'approved' || !status
      
      if (!isActive) return false
      
      const requestStart = request.start_date
      const requestEnd = request.end_date
      
      // Check for date overlap (any overlapping dates regardless of leave type)
      return (startDate <= requestEnd && endDate >= requestStart)
    })
  }

  // Get details of conflicting request for better error message
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

  // Validation messages
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
      const conflictStart = conflictingRequest ? new Date(conflictingRequest.start_date).toLocaleDateString() : ''
      const conflictEnd = conflictingRequest ? new Date(conflictingRequest.end_date).toLocaleDateString() : ''
      return {
        type: 'error',
        message: `You already have a leave request from ${conflictStart} to ${conflictEnd} that overlaps with the selected dates. Please choose different dates.`
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
    
    if (isHalfDay && (start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth() || start.getDate() !== end.getDate())) {
      toast({ title: 'Half day leave must have same start and end date', variant: 'destructive' })
      return
    }
    
    const diff = daysBetweenInclusive(start, end)
    if (diff <= 0) { 
      toast({ title: 'Invalid date range', variant: 'destructive' })
      return 
    }
    
    // Check balance
    const availableBalance = getAvailableBalance()
    if (availableBalance !== null && diff > availableBalance) {
      toast({ 
        title: 'Insufficient Balance', 
        description: `You have ${availableBalance} days available but requesting ${diff} days.`,
        variant: 'destructive' 
      })
      return
    }
    
    // Check date conflicts
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
      await createLeaveRequest({
        leave_type: Number(leaveType),
        start_date: start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : '',
        end_date: end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}` : '',
        is_half_day: isHalfDay,
        half_day_period: isHalfDay ? halfDayPeriod : undefined,
        reason: reason.trim(),
        emergency_contact: emergencyContact.trim() || undefined,
        emergency_phone: emergencyPhone.trim() || undefined,
        work_handover: workHandover.trim() || undefined,
        attachment: attachment || undefined,
      })
      
      toast({ 
        title: 'Success', 
        description: 'Your leave request has been submitted successfully.' 
      })
      
      // Reset form
      setLeaveType("")
      setStart(undefined)
      setEnd(undefined)
      setReason("")
      setIsHalfDay(false)
      setHalfDayPeriod('morning')
      setEmergencyContact("")
      setEmergencyPhone("")
      setWorkHandover("")
      setAttachment(null)
      
      // Refresh shared data (this will update both form and table)
      await refreshAll()
      
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
    <Card>
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="h-9">
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
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">
                  Available: {availableBalance} days
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <Label>Date Range</Label>
            <DateRangePicker 
              start={start} 
              end={end} 
              onChangeStart={setStart} 
              onChangeEnd={setEnd} 
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Duration: {requestedDays} day{requestedDays !== 1 ? 's' : ''}
              </p>
              {requestedDays > 0 && availableBalance !== null && (
                <p className="text-xs text-muted-foreground">
                  Remaining after: {Math.max(0, availableBalance - requestedDays)} days
                </p>
              )}
            </div>
          </div>
          
          {/* Validation Message */}
          {validationMessage && (
            <div className="sm:col-span-2">
              <Badge 
                variant={validationMessage.type === 'error' ? 'destructive' : 'default'}
                className="w-full justify-start p-2"
              >
                {validationMessage.type === 'error' ? (
                  <AlertTriangle className="h-3 w-3 mr-2" />
                ) : (
                  <Clock className="h-3 w-3 mr-2" />
                )}
                {validationMessage.message}
              </Badge>
            </div>
          )}
          
          <div className="sm:col-span-2 space-y-1">
            <Label>Reason</Label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="Enter a reason for your leave request" 
            />
          </div>
          
          <div className="sm:col-span-2">
            <Button 
              onClick={submit} 
              disabled={saving || (validationMessage?.type === 'error')}
            >
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
