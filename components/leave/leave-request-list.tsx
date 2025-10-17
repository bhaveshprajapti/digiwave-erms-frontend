"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { getLeaveRequests, deleteLeaveRequest } from "@/lib/api/leave-requests"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { getMyFlexibleTimingRequests, deleteFlexibleTimingRequest } from "@/lib/api/flexible-timing"
import { authService } from "@/lib/auth"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ActionButtons } from "@/components/common/action-buttons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Clock, AlertTriangle, Plus } from "lucide-react"
import { formatUTCtoISTDate, getISTDateString } from "@/lib/timezone"
import { useLeaveRequestsContext } from "@/contexts/leave-requests-context"
import { leaveEvents } from "@/hooks/use-leave-updates"
import { LeaveRequestModal } from "./leave-request-modal"

// Duration calculation function (EXACTLY like backend Django model)
function calculateDuration(startDate: string, endDate: string): number {
  // Convert date strings to Date objects (same as Django)
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  // Calculate difference in days (same as Django: (end_date - start_date).days)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Add 1 to include both start and end dates (same as Django: + 1)
  return diffDays + 1
}

// Format date function using IST utilities (DD/MM/YYYY)
function formatDate(dateStr: string): string {
  return formatUTCtoISTDate(dateStr + 'T00:00:00Z')
}

// Status badge component with consistent styling
function getStatusBadge(status?: string | number | null) {
  let statusName = 'Unknown'
  let badgeVariant: any = 'outline'
  let badgeClass = ''
  let icon = null

  // Handle different status formats - prioritize string values from backend
  let normalizedStatus = status
  if (typeof status === 'string') {
    normalizedStatus = status.toLowerCase()
  } else if (typeof status === 'number') {
    // Convert legacy numeric status to string
    switch (status) {
      case 1: normalizedStatus = 'pending'; break
      case 2: normalizedStatus = 'approved'; break
      case 3: normalizedStatus = 'rejected'; break
      case 4: normalizedStatus = 'cancelled'; break
      default: normalizedStatus = 'unknown'
    }
  }

  switch (normalizedStatus) {
    case 'pending':
    case 'draft':
      statusName = 'Pending'
      badgeVariant = 'outline'
      badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200'
      icon = <Clock className="w-3 h-3 mr-1" />
      break
    case 'approved':
      statusName = 'Approved'
      badgeVariant = 'default'
      badgeClass = 'bg-green-50 text-green-700 border-green-200'
      icon = <CheckCircle className="w-3 h-3 mr-1" />
      break
    case 'rejected':
      statusName = 'Rejected'
      badgeVariant = 'destructive'
      badgeClass = 'bg-red-50 text-red-700 border-red-200'
      icon = <XCircle className="w-3 h-3 mr-1" />
      break
    case 'cancelled':
      statusName = 'Cancelled'
      badgeVariant = 'secondary'
      badgeClass = 'bg-gray-50 text-gray-700 border-gray-200'
      icon = <AlertTriangle className="w-3 h-3 mr-1" />
      break
    case 'expired':
      statusName = 'Expired'
      badgeVariant = 'secondary'
      badgeClass = 'bg-gray-50 text-gray-700 border-gray-200'
      icon = <AlertTriangle className="w-3 h-3 mr-1" />
      break
    default:
      statusName = 'Unknown'
      badgeVariant = 'outline'
      badgeClass = 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <Badge variant={badgeVariant} className={badgeClass}>
      {icon}
      {statusName}
    </Badge>
  )
}

export function LeaveRequestList() {
  const userId = useMemo(() => authService.getUserData()?.id, [])
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd] = useState<Date | undefined>()
  const [typesMap, setTypesMap] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [flexibleTimingRequests, setFlexibleTimingRequests] = useState<any[]>([])
  const { toast } = useToast()

  // Use centralized state management
  const { requests, loading, refreshAll, removeRequest, setFilters } = useLeaveRequestsContext()

  // Combine all requests (leave + flexible timing)
  const allRequests = useMemo(() => {
    const typedLeaveRequests = requests.map((req: any) => ({
      ...req,
      unique_key: `leave-${req.id}`, // Add unique key for React
      request_type: req.is_half_day ? 'half-day' : 'full-day',
      duration_display: req.is_half_day ? '0.5 days' : `${req.total_days} days`,
      leave_type_name: typesMap[req.leave_type] || 'Unknown'
    }))

    const typedFlexibleRequests = flexibleTimingRequests.map((req: any) => ({
      ...req,
      unique_key: `flexible-${req.id}`, // Add unique key for React
      request_type: 'flexible-timing',
      duration_display: `${req.duration_minutes} minutes`,
      leave_type_name: req.flexible_timing_type?.name || 'Flexible Timing',
      // Map flexible timing fields to match leave request structure for display
      start_date: req.requested_date,
      end_date: req.requested_date,
      user: userId // Since these are user's own requests
    }))

    return [...typedLeaveRequests, ...typedFlexibleRequests]
  }, [requests, flexibleTimingRequests, typesMap, userId])

  // Filter requests for current user and date range
  const filteredRows = useMemo(() => {
    return allRequests.filter(r => {
      // Filter by user (leave requests) or current user (flexible timing)
      if (r.request_type !== 'flexible-timing' && r.user !== userId) return false

      // Filter by date range using IST dates
      const requestDate = r.start_date
      if (start && requestDate < getISTDateString(start)) return false
      if (end && requestDate > getISTDateString(end)) return false
      return true
    })
  }, [allRequests, userId, start, end])

  // Fetch flexible timing requests
  const fetchFlexibleTimingRequests = async () => {
    try {
      const flexibleRequests = await getMyFlexibleTimingRequests()
      setFlexibleTimingRequests(flexibleRequests)
    } catch (error) {
      console.error('Failed to fetch flexible timing requests:', error)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const types = await getLeaveTypes()
        const map: Record<number, string> = {}
        types.forEach((t: any) => { map[t.id] = t.name })
        setTypesMap(map)

        // Load requests into context - force refresh to get latest status
        await refreshAll()

        // Load flexible timing requests
        await fetchFlexibleTimingRequests()
      } catch (e: any) {
        console.error('Failed to load leave requests', e)
        toast({ title: 'Unable to load leave requests', description: e?.response?.data?.detail || e?.message || 'Please try again.', variant: 'destructive' })
      }
    }

    loadInitialData()
  }, [refreshAll, toast])

  // Update context filters when date range changes
  useEffect(() => {
    setFilters({
      userId,
      startDate: start,
      endDate: end
    })
  }, [userId, start, end, setFilters])

  // Auto-refresh every 10 seconds to catch status updates (reduced from 30s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshAll()
        await fetchFlexibleTimingRequests()
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, 10000) // 10 seconds - much more responsive

    return () => clearInterval(interval)
  }, [refreshAll])

  return (
    <>
      <Card>
        <CardHeader className="flex items-start justify-between gap-3">
          <CardTitle>My Leave Requests & Flexible Timing</CardTitle>
          <div className="flex items-center gap-2">
            <DateRangePicker
              start={start}
              end={end}
              onChangeStart={setStart}
              onChangeEnd={setEnd}
              useIST={true}
            />
            <Button onClick={() => setModalOpen(true)} size="default" className="gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            columns={[
              { key: 'sr', header: 'Sr No.', cell: (_r, i) => <span className="font-medium">{i + 1}</span>, className: 'w-16' },
              {
                key: 'request_type',
                header: 'Request Type',
                cell: (r) => {
                  const typeMap = {
                    'full-day': 'Full Day Leave',
                    'half-day': 'Half Day Leave',
                    'flexible-timing': 'Flexible Timing'
                  }
                  return (
                    <Badge variant="outline" className="capitalize">
                      {typeMap[(r as any).request_type as keyof typeof typeMap] || (r as any).request_type}
                    </Badge>
                  )
                }
              },
              {
                key: 'leave', header: 'Type/Category', cell: (r) => (
                  <button className="text-primary hover:underline font-medium" onClick={() => { setSelected(r); setOpen(true) }}>
                    {(r as any).leave_type_name || typesMap[(r as any).leave_type] || 'Unknown'}
                  </button>
                )
              },
              {
                key: 'start_date',
                header: 'Start Date',
                cell: (r) => formatDate((r as any).start_date),
                sortable: true
              },
              {
                key: 'end_date',
                header: 'End Date',
                cell: (r) => formatDate((r as any).end_date),
              },
              {
                key: 'duration',
                header: 'Duration',
                cell: (r) => {
                  return (r as any).duration_display || `${(r as any).total_days || 0} days`
                },
                className: 'w-24'
              },
              {
                key: 'status',
                header: 'Status',
                cell: (r) => getStatusBadge((r as any).status)
              },
              {
                key: 'actions', header: <span className="block text-center">Actions</span>, cell: (r) => {
                  const request = r as any
                  const today = getISTDateString()
                  const startDate = request.start_date

                  // User can delete if it's pending and before start date
                  const canUserDelete = (request.status === 'pending' || request.status === 'draft' || request.status === 1 || !request.status) && startDate > today

                  return (
                    <div className="flex items-center justify-center">
                      <ActionButtons
                        extras={[{ title: 'View', onClick: () => { setSelected(r); setOpen(true) } }]}
                        onDelete={canUserDelete ? async () => {
                          try {
                            if (request.request_type === 'flexible-timing') {
                              await deleteFlexibleTimingRequest(request.id)
                              toast({ title: 'Deleted', description: 'Flexible timing request deleted successfully.' })
                              // Refresh flexible timing requests
                              await fetchFlexibleTimingRequests()
                              // Dispatch event for real-time updates
                              leaveEvents.requestDeleted(request.id, userId || 0)
                            } else {
                              await deleteLeaveRequest(request.id)
                              toast({ title: 'Deleted', description: 'Leave request deleted successfully.' })
                              // Remove from context and refresh
                              removeRequest(request.id)
                              // Dispatch event for real-time updates
                              leaveEvents.requestDeleted(request.id, userId || 0)
                              await refreshAll()
                            }
                          } catch (e: any) {
                            toast({ title: 'Error', description: e?.response?.data?.detail || e?.message || 'Failed to delete', variant: 'destructive' })
                          }
                        } : undefined}
                      />
                    </div>
                  )
                }
              },
            ]}
            data={filteredRows}
            getRowKey={(r) => (r as any).unique_key || `${(r as any).request_type}-${(r as any).id}`}
            striped
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>Details of the selected leave request</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground font-medium">Leave Type:</span>
                  <p className="mt-1">{selected.leave_type_name || typesMap[selected.leave_type] || `#${selected.leave_type}`}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Status:</span>
                  <div className="mt-1">{getStatusBadge(selected.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Start Date:</span>
                  <p className="mt-1">{formatDate(selected.start_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">End Date:</span>
                  <p className="mt-1">{formatDate(selected.end_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Duration:</span>
                  <p className="mt-1">
                    {selected.duration_text || selected.total_days || calculateDuration(selected.start_date, selected.end_date)} day(s)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Applied:</span>
                  <p className="mt-1">{selected.applied_at ? formatDate(selected.applied_at) : selected.created_at ? formatDate(selected.created_at) : 'N/A'}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-medium">Reason:</span>
                <p className="mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap">{selected.reason || 'N/A'}</p>
              </div>

              {selected.rejection_reason && (
                <div>
                  <span className="text-muted-foreground font-medium text-red-600">Rejection Reason:</span>
                  <p className="mt-1 p-2 bg-red-50 rounded text-red-700 whitespace-pre-wrap">{selected.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LeaveRequestModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
