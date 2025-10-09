"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { 
  getFlexibleTimingTypes, 
  createFlexibleTimingRequest, 
  getMyFlexibleTimingBalance,
  FlexibleTimingType,
  FlexibleTimingBalance,
  CreateFlexibleTimingRequest
} from "@/lib/api/flexible-timing"

interface FlexibleTimingFormProps {
  onSuccess?: () => void
}

export function FlexibleTimingForm({ onSuccess }: FlexibleTimingFormProps) {
  const { toast } = useToast()
  
  // Form state
  const [timingType, setTimingType] = useState("")
  const [requestedDate, setRequestedDate] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [reason, setReason] = useState("")
  const [isEmergency, setIsEmergency] = useState(false)
  const [saving, setSaving] = useState(false)

  // Data state
  const [timingTypes, setTimingTypes] = useState<FlexibleTimingType[]>([])
  const [balances, setBalances] = useState<FlexibleTimingBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  // Auto-set duration when timing type is selected
  useEffect(() => {
    if (timingType) {
      const selectedType = timingTypes.find(type => type.id.toString() === timingType)
      if (selectedType) {
        setDurationMinutes(selectedType.max_duration_minutes.toString())
      }
    }
  }, [timingType, timingTypes])

  const loadData = async () => {
    setLoading(true)
    try {
      const [typesData, balancesData] = await Promise.all([
        getFlexibleTimingTypes(),
        getMyFlexibleTimingBalance()
      ])
      setTimingTypes(typesData)
      setBalances(balancesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load flexible timing data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSelectedTimingType = () => {
    return timingTypes.find(t => t.id.toString() === timingType)
  }

  const getTimingTypeBalance = () => {
    if (!timingType) return null
    return balances.find(b => b.timing_type.toString() === timingType)
  }

  const validateForm = () => {
    if (!timingType) {
      return { valid: false, message: "Please select a timing type" }
    }
    
    if (!requestedDate) {
      return { valid: false, message: "Please select a date" }
    }
    
    if (!durationMinutes || parseInt(durationMinutes) <= 0) {
      return { valid: false, message: "Please enter a valid duration" }
    }
    
    const selectedType = getSelectedTimingType()
    if (selectedType && parseInt(durationMinutes) > selectedType.max_duration_minutes) {
      return { valid: false, message: `Duration cannot exceed ${selectedType.max_duration_minutes} minutes for this timing type` }
    }
    
    if (!reason.trim()) {
      return { valid: false, message: "Please provide a reason" }
    }
    
    // Check advance notice
    if (!isEmergency && selectedType && selectedType.advance_notice_hours > 0) {
      const requestDateTime = new Date(`${requestedDate}T00:00:00`)
      const now = new Date()
      const hoursUntilRequest = (requestDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (hoursUntilRequest < selectedType.advance_notice_hours) {
        return { 
          valid: false, 
          message: `This timing type requires ${selectedType.advance_notice_hours} hours advance notice. Mark as emergency if urgent.` 
        }
      }
    }
    
    return { valid: true, message: "Valid request" }
  }

  const getValidationMessage = () => {
    const validation = validateForm()
    return {
      type: validation.valid ? 'success' : 'error',
      message: validation.message
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateForm()
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.message,
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const requestData: CreateFlexibleTimingRequest = {
        timing_type: parseInt(timingType),
        requested_date: requestedDate,
        duration_minutes: parseInt(durationMinutes),
        reason: reason.trim(),
        is_emergency: isEmergency
      }

      await createFlexibleTimingRequest(requestData)
      
      toast({
        title: "Success",
        description: "Flexible timing request submitted successfully"
      })

      // Reset form
      setTimingType("")
      setRequestedDate("")
      setDurationMinutes("")
      setStartTime("")
      setEndTime("")
      setReason("")
      setIsEmergency(false)
      
      // Reload data to update balances
      await loadData()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error?.message || "Failed to submit request",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const validationMessage = getValidationMessage()
  const selectedType = getSelectedTimingType()
  const balance = getTimingTypeBalance()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Request Flexible Timing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Timing Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="timing-type">Timing Type *</Label>
            <Select value={timingType} onValueChange={setTimingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select timing type" />
              </SelectTrigger>
              <SelectContent>
                {timingTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.name}</span>
                      <Badge variant="outline" className="ml-2">
                        Max {type.max_duration_minutes}min
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground">
                {selectedType.description}
              </p>
            )}
          </div>

          {/* Balance Information */}
          {balance && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Usage</span>
                <div className="flex items-center gap-2">
                  <Badge variant={balance.can_request_more ? "default" : "destructive"}>
                    {balance.used_count + balance.pending_count} / {balance.total_allowed}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {balance.remaining_count} remaining
                  </span>
                </div>
              </div>
            </div>
          )}


          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="requested-date">Requested Date *</Label>
            <Input
              id="requested-date"
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g., 60"
              min="1"
              max={selectedType?.max_duration_minutes || 480}
            />
            {selectedType && (
              <p className="text-sm text-muted-foreground">
                Maximum: {selectedType.max_duration_minutes} minutes
              </p>
            )}
          </div>


          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for this flexible timing request..."
              rows={3}
            />
          </div>

          {/* Emergency Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emergency"
              checked={isEmergency}
              onCheckedChange={(checked) => setIsEmergency(checked as boolean)}
            />
            <Label htmlFor="emergency" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              This is an emergency request
            </Label>
          </div>
          {isEmergency && (
            <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
              Emergency requests may bypass advance notice requirements but still require approval.
            </p>
          )}

          {/* Validation Message */}
          {(timingType && requestedDate && durationMinutes) && (
            <div className={`p-3 rounded-lg ${
              validationMessage.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {validationMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{validationMessage.message}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={saving || !validateForm().valid}
            className="w-full"
          >
            {saving ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
