"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon } from "lucide-react"

interface LeaveData {
  id: number
  leave_type: number
  start_date: string
  end_date: string
  status?: number
  reason: string
  rejection_reason?: string | null
  created_at?: string
  half_day_type?: string | null
}

interface LeaveDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leave: LeaveData | null
}

export function LeaveDetailsModal({ open, onOpenChange, leave }: LeaveDetailsModalProps) {
  if (!leave) return null

  const getStatusInfo = (status?: number) => {
    switch (status) {
      case 1:
        return { label: 'Approved', variant: 'success' as const, color: 'text-green-700' }
      case 2:
        return { label: 'Rejected', variant: 'destructive' as const, color: 'text-red-700' }
      case 0:
      default:
        return { label: 'Pending', variant: 'secondary' as const, color: 'text-orange-700' }
    }
  }

  const getLeaveTypeName = (leaveTypeId: number) => {
    // You can expand this based on your leave type mapping
    const leaveTypes = {
      1: 'Annual Leave',
      2: 'Sick Leave', 
      3: 'Emergency Leave',
      4: 'Maternity Leave',
      5: 'Paternity Leave'
    }
    return leaveTypes[leaveTypeId as keyof typeof leaveTypes] || `Leave Type ${leaveTypeId}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusInfo = getStatusInfo(leave.status)
  const isDateRange = leave.start_date !== leave.end_date

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Leave Application Details
          </DialogTitle>
          <DialogDescription>
            Information about your leave application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Leave Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{getLeaveTypeName(leave.leave_type)}</span>
            </div>
            <Badge variant={statusInfo.variant} className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Date Range */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span>
            </div>
            <div className="ml-6 space-y-1">
              {isDateRange ? (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">From:</span> {formatDate(leave.start_date)}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">To:</span> {formatDate(leave.end_date)}
                  </div>
                </>
              ) : (
                <div className="text-sm">
                  <span className="text-muted-foreground">Date:</span> {formatDate(leave.start_date)}
                  {leave.half_day_type && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {leave.half_day_type === 'morning' ? 'Morning Half Day' : 'Afternoon Half Day'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Reason:</span>
            </div>
            <div className="ml-6 p-3 bg-muted/50 rounded-md">
              <p className="text-sm">{leave.reason}</p>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {leave.status === 2 && leave.rejection_reason && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-700">Rejection Reason:</span>
              </div>
              <div className="ml-6 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{leave.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Application Date */}
          {leave.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <span>Applied on: {formatDateTime(leave.created_at)}</span>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Application ID: #{leave.id}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}