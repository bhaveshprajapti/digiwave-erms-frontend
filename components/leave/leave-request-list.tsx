"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { getLeaveRequests, deleteLeaveRequest } from "@/lib/api/leave-requests"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { authService } from "@/lib/auth"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ActionButtons } from "@/components/common/action-buttons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { useLeaveRequestsContext } from "@/contexts/leave-requests-context"

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

// Format date function (DD/MM/YYYY)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// Status badge component with consistent styling
function getStatusBadge(status?: string | number | null) {
  let statusName = 'Unknown'
  let badgeVariant: any = 'outline'
  let badgeClass = ''
  let icon = null

  // Handle different status formats
  let statusValue = status
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'pending': statusValue = 1; break
      case 'approved': statusValue = 2; break
      case 'rejected': statusValue = 3; break
      case 'cancelled': statusValue = 4; break
      default: statusValue = 0
    }
  }

  switch (statusValue) {
    case 1:
    case 'pending':
      statusName = 'Pending'
      badgeVariant = 'outline'
      badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200'
      icon = <Clock className="w-3 h-3 mr-1" />
      break
    case 2:
    case 'approved':
      statusName = 'Approved'
      badgeVariant = 'default'
      badgeClass = 'bg-green-50 text-green-700 border-green-200'
      icon = <CheckCircle className="w-3 h-3 mr-1" />
      break
    case 3:
    case 'rejected':
      statusName = 'Rejected'
      badgeVariant = 'destructive'
      badgeClass = 'bg-red-50 text-red-700 border-red-200'
      icon = <XCircle className="w-3 h-3 mr-1" />
      break
    case 4:
    case 'cancelled':
      statusName = 'Cancelled'
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
  const { toast } = useToast()

  // Use centralized state management
  const { requests, loading, refreshAll, removeRequest, setFilters } = useLeaveRequestsContext()

  // Filter requests for current user and date range
  const filteredRows = useMemo(() => {
    return requests.filter(r => {
      // Filter by user
      if (r.user !== userId) return false
      
      // Filter by date range
      const d = new Date(r.start_date)
      if (start && d < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false
      if (end && d > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false
      return true
    })
  }, [requests, userId, start, end])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const types = await getLeaveTypes()
        const map: Record<number, string> = {}
        types.forEach((t: any) => { map[t.id] = t.name })
        setTypesMap(map)
        
        // Load requests into context
        await refreshAll()
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

  return (
    <>
      <Card>
        <CardHeader className="flex items-start justify-between gap-3">
          <CardTitle>My Leave Requests</CardTitle>
          <div className="flex items-center gap-2">
            <DateRangePicker start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            columns={[
              { key: 'sr', header: 'Sr No.', cell: (_r, i) => <span className="font-medium">{i + 1}</span>, className: 'w-16' },
              { key: 'leave', header: 'Leave Type', cell: (r) => (
                <button className="text-primary hover:underline font-medium" onClick={() => { setSelected(r); setOpen(true) }}>
                  {typesMap[(r as any).leave_type] || `#${(r as any).leave_type}`}
                </button>
              )},
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
                  // Always use our calculation to ensure consistency
                  const duration = calculateDuration((r as any).start_date, (r as any).end_date)
                  console.log(`Duration calculation for ${(r as any).start_date} to ${(r as any).end_date}: ${duration} days`)
                  return `${duration} day${duration !== 1 ? 's' : ''}`
                },
                className: 'w-24' 
              },
              { 
                key: 'status', 
                header: 'Status', 
                cell: (r) => getStatusBadge((r as any).status)
              },
              { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (r) => {
                const request = r as any
                const today = new Date()
                const startDate = new Date(request.start_date)
                
                // User can delete if it's pending and before start date
                const canUserDelete = (request.status === 'pending' || !request.status) && startDate > today
                
                return (
                  <div className="flex items-center justify-center">
                    <ActionButtons
                      extras={[{ title: 'View', onClick: () => { setSelected(r); setOpen(true) } }]}
                      onDelete={canUserDelete ? async () => {
                        try {
                          await deleteLeaveRequest(request.id)
                          toast({ title: 'Deleted', description: 'Leave request deleted successfully.' })
                          // Remove from context and refresh
                          removeRequest(request.id)
                          await refreshAll()
                        } catch (e: any) {
                          toast({ title: 'Error', description: e?.response?.data?.detail || e?.message || 'Failed to delete', variant: 'destructive' })
                        }
                      } : undefined}
                    />
                  </div>
                )
              }},
            ]}
            data={filteredRows}
            getRowKey={(r)=> (r as any).id}
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
                  <p className="mt-1">{typesMap[selected.leave_type] || `#${selected.leave_type}`}</p>
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
                    {selected.total_days || calculateDuration(selected.start_date, selected.end_date)} day(s)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Applied:</span>
                  <p className="mt-1">{selected.created_at ? formatDate(selected.created_at) : 'N/A'}</p>
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
    </>
  )
}
