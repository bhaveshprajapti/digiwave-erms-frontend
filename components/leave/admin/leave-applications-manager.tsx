"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ActionButtons } from "@/components/common/action-buttons"
import { useToast } from "@/hooks/use-toast"
import { 
  getLeaveRequests, 
  approveLeaveRequest, 
  rejectLeaveRequest,
  getLeaveApplicationComments,
  addLeaveApplicationComment,
  deleteLeaveRequest
} from "@/lib/api/leave-requests"
import { 
  getFlexibleTimingRequests,
  approveFlexibleTimingRequest,
  rejectFlexibleTimingRequest,
  deleteFlexibleTimingRequest
} from "@/lib/api/flexible-timing"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { getUsers } from "@/lib/api/users"
import { LeaveRequest } from "@/lib/schemas"
import { CheckCircle, MessageSquare, Search, XCircle } from "lucide-react"
import Swal from 'sweetalert2'
import { useAdminLeaveRequests } from "@/contexts/leave-requests-context"

interface LeaveApplicationsManagerProps {
  className?: string
}

export function LeaveApplicationsManager({ className }: LeaveApplicationsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all") // New filter for request type
  const [selectedApplication, setSelectedApplication] = useState<any>(null) // Changed to any to handle both types
  const [viewMode, setViewMode] = useState<'view' | 'approve' | 'reject' | null>(null)
  const [actionComment, setActionComment] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  
  // Data
  const [flexibleTimingRequests, setFlexibleTimingRequests] = useState<any[]>([])
  
  // Reference data
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [statusChoices] = useState([
    { id: 1, name: "Pending", color: "yellow" },
    { id: 2, name: "Approved", color: "green" },
    { id: 3, name: "Rejected", color: "red" },
    { id: 4, name: "Cancelled", color: "gray" }
  ])

  const { toast } = useToast()
  
  // Use centralized state management
  const { requests: leaveApplications, loading, refreshAll, removeRequest, updateRequest } = useAdminLeaveRequests()

  // Fetch flexible timing requests
  useEffect(() => {
    const fetchFlexibleTimingRequests = async () => {
      try {
        const flexibleRequests = await getFlexibleTimingRequests()
        // Add type identifier to distinguish from leave requests
        const typedRequests = flexibleRequests.map((req: any) => ({
          ...req,
          request_type: 'flexible-timing',
          leave_type_name: req.flexible_timing_type?.name || 'Flexible Timing',
          employee_name: req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 
                        req.user_name || req.employee_name || 'Unknown',
          duration_display: `${req.duration_minutes} minutes`,
          // Map flexible timing fields to match leave request structure
          start_date: req.requested_date,
          end_date: req.requested_date,
          total_days: 0 // Flexible timing doesn't use leave days
        }))
        setFlexibleTimingRequests(typedRequests)
      } catch (error) {
        console.error('Failed to fetch flexible timing requests:', error)
      }
    }

    fetchFlexibleTimingRequests()
  }, [])

  // Combine all applications
  const allApplications = useMemo(() => {
    const typedLeaveApps = leaveApplications.map((app: any) => ({
      ...app,
      unique_key: `leave-${app.id}`, // Add unique key for React
      request_type: app.is_half_day ? 'half-day' : 'full-day',
      duration_display: app.is_half_day ? '0.5 days' : `${app.total_days} days`
    }))
    
    const typedFlexibleApps = flexibleTimingRequests.map((req: any) => ({
      ...req,
      unique_key: `flexible-${req.id}`, // Add unique key for React
    }))
    
    return [...typedLeaveApps, ...typedFlexibleApps]
  }, [leaveApplications, flexibleTimingRequests])

  // Create lookup maps
  const leaveTypeMap = useMemo(() => {
    const map: Record<number, string> = {}
    leaveTypes.forEach(type => { map[type.id] = type.name })
    return map
  }, [leaveTypes])

  const userMap = useMemo(() => {
    const map: Record<number, any> = {}
    users.forEach(user => { map[user.id] = user })
    return map
  }, [users])

  const statusMap = useMemo(() => {
    const map: Record<number, any> = {}
    statusChoices.forEach(status => { map[status.id] = status })
    return map
  }, [statusChoices])

  // Filter applications
  const filteredApplications = useMemo(() => {
    return allApplications.filter((app: any) => {
      // Handle both leave requests and flexible timing requests
      const user = app.request_type === 'flexible-timing' ? 
        { first_name: app.employee_name?.split(' ')[0] || '', last_name: app.employee_name?.split(' ')[1] || '' } :
        userMap[app.user]
      
      const userName = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : ""
      const leaveTypeName = app.request_type === 'flexible-timing' ? 
        app.leave_type_name?.toLowerCase() || '' :
        leaveTypeMap[app.leave_type]?.toLowerCase() || ""
      
      const matchesSearch = searchTerm === "" || 
        userName.includes(searchTerm.toLowerCase()) ||
        leaveTypeName.includes(searchTerm.toLowerCase()) ||
        (app.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filter by request type
      const matchesRequestType = requestTypeFilter === "all" || app.request_type === requestTypeFilter
      
      const status = app.status
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "pending" && (!status || status === 1 || status === 'pending')) ||
        (statusFilter === "approved" && (status === 2 || status === 'approved')) ||
        (statusFilter === "rejected" && (status === 3 || status === 'rejected')) ||
        (statusFilter === "cancelled" && (status === 4 || status === 'cancelled'))
      
      const matchesLeaveType = leaveTypeFilter === "all" || 
        app.leave_type.toString() === leaveTypeFilter
      
      return matchesSearch && matchesStatus && matchesLeaveType && matchesRequestType
    })
  }, [allApplications, searchTerm, statusFilter, leaveTypeFilter, requestTypeFilter, userMap, leaveTypeMap])

  const loadData = async () => {
    try {
      const [typesData, usersData] = await Promise.all([
        getLeaveTypes().catch(() => []),
        getUsers().catch(() => [])
      ])
      
      setLeaveTypes(typesData)
      setUsers(usersData)
      
      // Refresh applications through context
      await refreshAll()
    } catch (error: any) {
      console.error('Failed to load applications:', error)
      toast({
        title: "Error",
        description: "Failed to load leave applications",
        variant: "destructive"
      })
    }
  }

  // Admin can delete until the leave end date (inclusive). Block if already rejected/cancelled.
  const canAdminDelete = (app: LeaveRequest) => {
    const status = app.status as any
    let isTerminal = false
    
    if (typeof status === 'string') {
      const statusLower = status.toLowerCase()
      isTerminal = statusLower === 'rejected' || statusLower === 'cancelled'
    } else if (typeof status === 'number') {
      isTerminal = status === 3 || status === 4
    }
    
    if (isTerminal) return false

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endDate = new Date(app.end_date + 'T00:00:00')
    return endDate >= startOfToday
  }

  const handleAdminDelete = async (app: any) => {
    const isFlexibleTiming = app.request_type === 'flexible-timing'
    const result = await Swal.fire({
      title: `Delete ${isFlexibleTiming ? 'Flexible Timing' : 'Leave'} Request?`,
      text: 'This will permanently delete the request. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No',
      confirmButtonColor: '#d33'
    })

    if (!result.isConfirmed) return

    try {
      if (isFlexibleTiming) {
        await deleteFlexibleTimingRequest(app.id)
        toast({ title: 'Deleted', description: 'Flexible timing request deleted successfully.' })
        // Refresh flexible timing requests
        const flexibleRequests = await getFlexibleTimingRequests()
        const typedRequests = flexibleRequests.map((req: any) => ({
          ...req,
          request_type: 'flexible-timing',
          leave_type_name: req.flexible_timing_type?.name || 'Flexible Timing',
          employee_name: req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 
                        req.user_name || req.employee_name || 'Unknown',
          duration_display: `${req.duration_minutes} minutes`,
          start_date: req.requested_date,
          end_date: req.requested_date,
          total_days: 0
        }))
        setFlexibleTimingRequests(typedRequests)
      } else {
        await deleteLeaveRequest(app.id)
        toast({ title: 'Deleted', description: 'Leave request deleted successfully.' })
        // Remove from context and refresh
        removeRequest(app.id)
        await refreshAll()
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.detail || 'Failed to delete request', variant: 'destructive' })
    }
  }

  const loadComments = async (applicationId: number) => {
    try {
      const commentsData = await getLeaveApplicationComments(applicationId)
      setComments(commentsData)
    } catch (error) {
      console.error('Failed to load comments:', error)
      setComments([])
    }
  }

  const handleViewApplication = async (application: LeaveRequest) => {
    setSelectedApplication(application)
    setViewMode('view')
    await loadComments(application.id)
  }

  const handleApproveApplication = async (application: any) => {
    setProcessing(true)
    try {
      console.log('Approving application:', application.id)
      
      if (application.request_type === 'flexible-timing') {
        await approveFlexibleTimingRequest(application.id)
        toast({
          title: "Success",
          description: "Flexible timing request approved successfully"
        })
        // Refresh flexible timing requests
        const flexibleRequests = await getFlexibleTimingRequests()
        const typedRequests = flexibleRequests.map((req: any) => ({
          ...req,
          request_type: 'flexible-timing',
          leave_type_name: req.flexible_timing_type?.name || 'Flexible Timing',
          employee_name: req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 
                        req.user_name || req.employee_name || 'Unknown',
          duration_display: `${req.duration_minutes} minutes`,
          start_date: req.requested_date,
          end_date: req.requested_date,
          total_days: 0
        }))
        setFlexibleTimingRequests(typedRequests)
      } else {
        await approveLeaveRequest(application.id, "")
        toast({
          title: "Success",
          description: "Leave application approved successfully"
        })
        // Update the request status in context and refresh
        updateRequest(application.id, { status: 2 as any })
        await refreshAll()
      }
    } catch (error: any) {
      console.error('Approval error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to approve application",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectApplication = (application: any) => {
    setSelectedApplication(application)
    setViewMode('reject')
    setActionComment("")
    setRejectionReason("")
  }

  const processApproval = async () => {
    if (!selectedApplication) return

    setProcessing(true)
    try {
      console.log('Approving application:', selectedApplication.id)
      await approveLeaveRequest(selectedApplication.id, actionComment)
      toast({
        title: "Success",
        description: "Leave application approved successfully"
      })
      setViewMode(null)
      setSelectedApplication(null)
      setActionComment("")
      // Update the request status in context and refresh
      updateRequest(selectedApplication.id, { status: 2 as any })
      await refreshAll()
    } catch (error: any) {
      console.error('Approval error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to approve application",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const processRejection = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Rejection reason is required",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    try {
      console.log('Rejecting application:', selectedApplication.id, 'Reason:', rejectionReason)
      
      if (selectedApplication.request_type === 'flexible-timing') {
        await rejectFlexibleTimingRequest(selectedApplication.id, rejectionReason, actionComment)
        toast({
          title: "Success",
          description: "Flexible timing request rejected successfully"
        })
        // Refresh flexible timing requests
        const flexibleRequests = await getFlexibleTimingRequests()
        const typedRequests = flexibleRequests.map((req: any) => ({
          ...req,
          request_type: 'flexible-timing',
          leave_type_name: req.flexible_timing_type?.name || 'Flexible Timing',
          employee_name: req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 
                        req.user_name || req.employee_name || 'Unknown',
          duration_display: `${req.duration_minutes} minutes`,
          start_date: req.requested_date,
          end_date: req.requested_date,
          total_days: 0
        }))
        setFlexibleTimingRequests(typedRequests)
      } else {
        await rejectLeaveRequest(selectedApplication.id, rejectionReason, actionComment)
        toast({
          title: "Success",
          description: "Leave application rejected successfully"
        })
        // Update the request status in context and refresh
        updateRequest(selectedApplication.id, { status: 3 as any, rejection_reason: rejectionReason })
        await refreshAll()
      }
      
      setViewMode(null)
      setSelectedApplication(null)
      setActionComment("")
      setRejectionReason("")
    } catch (error: any) {
      console.error('Rejection error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to reject application",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const addComment = async () => {
    if (!selectedApplication || !newComment.trim()) return
    
    try {
      await addLeaveApplicationComment(selectedApplication.id, newComment, true)
      setNewComment("")
      await loadComments(selectedApplication.id)
      toast({
        title: "Success",
        description: "Comment added successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status?: number | null | string) => {
    // Handle different status formats (number, string, or null)
    let statusValue: number = 0
    let statusName = 'Unknown'
    let badgeVariant: any = 'outline'
    let badgeClass = ''

    // Convert input to number
    if (status !== null && status !== undefined) {
      if (typeof status === 'string') {
        const lowerStatus = status.toLowerCase()
        switch (lowerStatus) {
          case 'pending': statusValue = 1; break
          case 'approved': statusValue = 2; break
          case 'rejected': statusValue = 3; break
          case 'cancelled': statusValue = 4; break
          default: statusValue = 0
        }
      } else if (typeof status === 'number') {
        statusValue = status
      }
    }

    switch (statusValue) {
      case 1:
        statusName = 'Pending'
        badgeVariant = 'outline'
        badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200'
        break
      case 2:
        statusName = 'Approved'
        badgeVariant = 'default'
        badgeClass = 'bg-green-50 text-green-700 border-green-200'
        break
      case 3:
        statusName = 'Rejected'
        badgeVariant = 'destructive'
        badgeClass = 'bg-red-50 text-red-700 border-red-200'
        break
      case 4:
        statusName = 'Cancelled'
        badgeVariant = 'secondary'
        badgeClass = 'bg-gray-50 text-gray-700 border-gray-200'
        break
      default:
        statusName = 'Unknown'
        badgeVariant = 'outline'
        badgeClass = 'bg-gray-50 text-gray-700 border-gray-200'
    }

    return <Badge variant={badgeVariant} className={badgeClass}>{statusName}</Badge>
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    // Convert date strings to Date objects (same as Django)
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')

    // Calculate difference in days (same as Django: (end_date - start_date).days)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Add 1 to include both start and end dates (same as Django: + 1)
    return diffDays + 1
  }

  useEffect(() => {
    loadData()
  }, [])

  // Helper function to check if application is pending
  const isPendingApplication = (app: LeaveRequest) => {
    // Handle both string and number status formats
    if (typeof app.status === 'string') {
      return app.status.toLowerCase() === 'pending' || !app.status
    }
    return !app.status || app.status === 1
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const columns = [
    {
      key: 'sr_no',
      header: 'Sr No',
      cell: (app: any, index: number) => index + 1
    },
    {
      key: 'user',
      header: 'Employee',
      cell: (app: any) => {
        const userName = app.request_type === 'flexible-timing' ? 
          app.employee_name || 'Unknown' :
          (() => {
            const user = userMap[app.user]
            return user ? `${user.first_name} ${user.last_name}` : 'Unknown'
          })()
        
        return (
          <button 
            className="text-primary hover:underline font-medium text-left"
            onClick={() => handleViewApplication(app)}
          >
            {userName}
          </button>
        )
      }
    },
    {
      key: 'request_type',
      header: 'Request Type',
      cell: (app: any) => {
        const typeMap = {
          'full-day': 'Full Day Leave',
          'half-day': 'Half Day Leave', 
          'flexible-timing': 'Flexible Timing'
        }
        return (
          <Badge variant="outline" className="capitalize">
            {typeMap[app.request_type as keyof typeof typeMap] || app.request_type}
          </Badge>
        )
      }
    },
    {
      key: 'leave_type',
      header: 'Leave/Timing Type',
      cell: (app: any) => app.request_type === 'flexible-timing' ? 
        app.leave_type_name || 'Flexible Timing' :
        leaveTypeMap[app.leave_type] || 'Unknown'
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (app: any) => {
        if (app.request_type === 'flexible-timing') {
          return formatDate(app.requested_date)
        }
        return `${formatDate(app.start_date)} - ${formatDate(app.end_date)}`
      }
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (app: any) => {
        return app.duration_display || `${app.total_days || 0} day(s)`
      }
    },
    {
      key: 'status',
      header: 'Status',
      cell: (app: LeaveRequest) => getStatusBadge(app.status)
    },
    {
      key: 'actions',
      header: <span className="block text-center">Actions</span>,
      cell: (app: any) => {
        const isPending = app.request_type === 'flexible-timing' ? 
          (!app.status || app.status === 'pending' || app.status === 1) :
          isPendingApplication(app)
        
        const canDelete = app.request_type === 'flexible-timing' ? 
          (() => {
            // For flexible timing, allow delete until the requested time ends
            const requestedDate = new Date(app.requested_date || app.start_date)
            const now = new Date()
            const requestedDateTime = new Date(requestedDate)
            
            // Add duration to get end time (assuming flexible timing is within the same day)
            requestedDateTime.setMinutes(requestedDateTime.getMinutes() + (app.duration_minutes || 60))
            
            return requestedDateTime > now && (!app.status || app.status === 'pending' || app.status === 1)
          })() :
          canAdminDelete(app)
        
        return (
          <div className="flex items-center justify-center gap-2">
            {isPending && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApproveApplication(app)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectApplication(app)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {canDelete && (
              <ActionButtons
                onDelete={() => handleAdminDelete(app)}
              />
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Leave Applications Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee, leave type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-day">Full Day Leave</SelectItem>
                <SelectItem value="half-day">Half Day Leave</SelectItem>
                <SelectItem value="flexible-timing">Flexible Timing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredApplications}
            getRowKey={(app) => app.unique_key || `${app.request_type}-${app.id}`}
            striped
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* View/Action Dialog */}
      <Dialog open={viewMode !== null} onOpenChange={() => {
        setViewMode(null)
        setSelectedApplication(null)
        setActionComment("")
        setRejectionReason("")
        setNewComment("")
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'view' && 'Leave Application Details'}
              {viewMode === 'reject' && 'Reject Leave Application'}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && userMap[selectedApplication.user] && 
                `${userMap[selectedApplication.user].first_name} ${userMap[selectedApplication.user].last_name}`
              }
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {selectedApplication.request_type === 'flexible-timing' ? 'Timing Type' : 'Leave Type'}
                  </Label>
                  <p className="text-sm">
                    {selectedApplication.request_type === 'flexible-timing' 
                      ? selectedApplication.leave_type_name || 'Flexible Timing'
                      : leaveTypeMap[selectedApplication.leave_type] || 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {selectedApplication.request_type === 'flexible-timing' ? 'Requested Date' : 'Start Date'}
                  </Label>
                  <p className="text-sm">{formatDate(selectedApplication.start_date)}</p>
                </div>
                {selectedApplication.request_type !== 'flexible-timing' && (
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm">{formatDate(selectedApplication.end_date)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm">
                    {selectedApplication.request_type === 'flexible-timing' 
                      ? selectedApplication.duration_display || `${selectedApplication.duration_minutes} minutes`
                      : selectedApplication.duration_display || `${calculateDuration(selectedApplication.start_date, selectedApplication.end_date)} day(s)`
                    }
                  </p>
                </div>
                {selectedApplication.half_day_type && (
                  <div>
                    <Label className="text-sm font-medium">Half Day</Label>
                    <p className="text-sm">{selectedApplication.half_day_type}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedApplication.reason}</p>
              </div>

              {selectedApplication.rejection_reason && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Rejection Reason</Label>
                  <p className="text-sm mt-1 p-2 bg-red-50 rounded text-red-700">{selectedApplication.rejection_reason}</p>
                </div>
              )}

              {/* Action Forms */}

              {viewMode === 'reject' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reject-comment">Additional Comments (Optional)</Label>
                    <Textarea
                      id="reject-comment"
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder="Add any additional comments..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Comments Section for View Mode */}
              {viewMode === 'view' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Comments</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500">No comments yet</p>
                    ) : (
                      comments.map((comment, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                          <p>{comment.comment}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {comment.created_at && new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                      rows={2}
                    />
                    <Button onClick={addComment} disabled={!newComment.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewMode(null)
                setSelectedApplication(null)
              }}
            >
              {viewMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {viewMode === 'reject' && (
              <Button
                onClick={processRejection}
                disabled={processing || !rejectionReason.trim()}
                variant="destructive"
              >
                {processing ? 'Rejecting...' : 'Reject Application'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
