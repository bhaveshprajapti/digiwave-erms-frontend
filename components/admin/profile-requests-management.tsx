"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/common/data-table"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Search,
  Filter,
  Eye
} from "lucide-react"
import api from "@/lib/api"

interface ProfileUpdateRequest {
  id: number
  user_name: string
  user_email: string
  field_name?: string // For backward compatibility with old requests
  old_value?: string
  new_value?: string
  changes?: Array<{ field: string; old_value: string; new_value: string }> // For new consolidated requests
  details?: string // Human-readable summary of changes
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  admin_comment: string
  requested_at: string
  processed_at?: string
  approved_by_name?: string
}

export function ProfileRequestsManagement() {
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRequest, setSelectedRequest] = useState<ProfileUpdateRequest | null>(null)
  const [selectedUser, setSelectedUser] = useState<{ user_id: number; user_name: string; user_email: string } | null>(null)
  const [adminComment, setAdminComment] = useState("")
  const [processing, setProcessing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await api.get('/accounts/profile-update-requests/')
      setRequests(response.data)
    } catch (error) {
      console.error("Error loading requests:", error)
      toast({
        title: "Error",
        description: "Failed to load profile update requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    setProcessing(true)
    try {
      await api.post(`/accounts/profile-update-requests/${requestId}/approve/`, {
        admin_comment: adminComment
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (requestId: number) => {
    setProcessing(true)
    try {
      await api.post(`/accounts/profile-update-requests/${requestId}/reject/`, {
        admin_comment: adminComment && adminComment.trim().length > 0 ? adminComment : 'Request rejected'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleBulk = async (userId: number, action: 'approve' | 'reject') => {
    const pending = filteredRequests.filter(r => r.user === userId && r.status === 'pending')
    if (pending.length === 0) return
    setProcessing(true)
    try {
      for (const req of pending) {
        if (action === 'approve') {
          await api.post(`/accounts/profile-update-requests/${req.id}/approve/`, { admin_comment: adminComment })
        } else {
          await api.post(`/accounts/profile-update-requests/${req.id}/reject/`, { admin_comment: adminComment || 'Request rejected' })
        }
      }
      toast({
        title: action === 'approve' ? 'Approved' : 'Rejected',
        description: `${pending.length} change(s) ${action}d for ${selectedUser?.user_name || ''}`,
      })
      await loadRequests()
      setAdminComment('')
      setIsModalOpen(false)
      setModalAction(null)
      setSelectedUser(null)
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.error || 'Operation failed', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.field_name && request.field_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (request.details && request.details.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Group by user for the master table
  const groupedByUser = Object.values(
    filteredRequests.reduce((acc: any, req) => {
      const key = req.user_name + '|' + req.user_email + '|' + req.user
      if (!acc[key]) {
        acc[key] = {
          user_id: req.user,
          user_name: req.user_name,
          user_email: req.user_email,
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          latest: req.requested_at,
        }
      }
      acc[key].total += 1
      acc[key][req.status] += 1
      if (new Date(req.requested_at) > new Date(acc[key].latest)) acc[key].latest = req.requested_at
      return acc
    }, {})
  ) as Array<{ user_id: number; user_name: string; user_email: string; total: number; pending: number; approved: number; rejected: number; latest: string }>

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Update Requests</h1>
          <p className="text-gray-600">Review and approve employee profile update requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {requests.filter(r => r.status === 'pending').length} Pending
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by employee name, email, or field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped by User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Update Requests by Employee ({groupedByUser.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedByUser.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No profile update requests found</p>
            </div>
          ) : (
            <DataTable<any>
              columns={[
{ key: 'employee', header: 'Employee', cell: (u:any) => (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser({ user_id: u.user_id, user_name: u.user_name, user_email: u.user_email })
                      setAdminComment('')
                      setModalAction(null)
                      setIsModalOpen(true)
                    }}
                    className="text-left hover:underline"
                  >
                    <p className="font-medium text-primary">{u.user_name}</p>
                    <p className="text-sm text-gray-500">{u.user_email}</p>
                  </button>
                )},
                { key: 'totals', header: 'Totals', cell: (u:any) => (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Total {u.total}</Badge>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Pending {u.pending}</Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Approved {u.approved}</Badge>
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Rejected {u.rejected}</Badge>
                  </div>
                )},
                { key: 'latest', header: 'Latest Request', sortable: true, sortAccessor: (u:any)=> new Date(u.latest).getTime(), cell: (u:any) => (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(u.latest).toLocaleDateString()}</span>
                  </div>
                )},
{ key: 'actions', header: <span className="block text-center">Actions</span>, cell: (u:any) => (
                  <div className="flex items-center justify-center gap-2">
                    {u.pending > 0 ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulk(u.user_id, 'reject')}
                          disabled={processing}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleBulk(u.user_id, 'approve')}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">No pending</span>
                    )}
                  </div>
                )}
              ]}
              data={groupedByUser as any}
              getRowKey={(u:any)=>u.user_id}
              striped
            />
          )}
        </CardContent>
      </Card>

      {/* Employee-style full-screen modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-[95vw] max-w-[1000px] max-h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {modalAction === 'approve' ? 'Approve' : 'Reject'} all requests — {selectedUser.user_name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedUser.user_email}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {(() => {
                  const pendingCount = filteredRequests.filter(r => r.user === selectedUser.user_id && r.status === 'pending').length
                  return (
                    <div className="rounded-md border p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Admin comment (optional)</Label>
                        <span className="text-xs text-muted-foreground">{pendingCount} pending</span>
                      </div>
                      <Textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Add a note about this decision"
                        className="mt-1"
                        disabled={pendingCount === 0}
                      />
                    </div>
                  )
                })()}
                {filteredRequests
                  .filter(r => r.user === selectedUser.user_id)
                  .map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {request.field_name === 'multiple_fields' ? 
                              'Multiple Fields' : 
                              request.changes ? 
                                `${request.changes.length} field(s)` : 
                                formatFieldName(request.field_name || 'Unknown')}
                          </Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        {/* Handle consolidated requests */}
                        {request.field_name === 'multiple_fields' ? (
                          <div className="space-y-3">
                            <div>
                              <Label>Summary</Label>
                              <div className="p-2 bg-gray-50 border rounded text-sm">
                                {request.old_value || 'Multiple field changes'}
                              </div>
                            </div>
                            <div>
                              <Label>Changes Details</Label>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                {request.new_value || request.reason || 'Multiple field changes'}
                              </div>
                            </div>
                          </div>
                        ) : request.changes ? (
                          <div className="space-y-3">
                            <div>
                              <Label>Changes Summary</Label>
                              <div className="p-3 bg-gray-50 border rounded text-sm whitespace-pre-line">
                                {request.details || 'Multiple field changes'}
                              </div>
                            </div>
                            
                            {/* Individual changes breakdown */}
                            <div className="space-y-2">
                              <Label>Individual Changes</Label>
                              {request.changes.map((change, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-white border rounded">
                                  <div>
                                    <Label className="text-red-600 text-xs">{formatFieldName(change.field)} - Current</Label>
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                      {change.old_value || 'Empty'}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-green-600 text-xs">{formatFieldName(change.field)} - New</Label>
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                      {change.new_value}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Handle legacy single field requests */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-red-600">Current Value</Label>
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                {request.old_value || 'Empty'}
                              </div>
                            </div>
                            <div>
                              <Label className="text-green-600">New Value</Label>
                              <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                {request.new_value}
                              </div>
                            </div>
                          </div>
                        )}
                        {request.reason && (
                          <div>
                            <Label>Reason</Label>
                            <div className="p-2 bg-gray-50 border rounded text-sm">
                              {request.reason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex gap-3 w-full justify-end">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing} className="px-4 h-9">
                  Cancel
                </Button>
                {(() => {
                  const pendingCount = filteredRequests.filter(r => r.user === selectedUser.user_id && r.status === 'pending').length
                  if (pendingCount === 0) {
                    return <span className="text-sm text-muted-foreground">No pending changes</span>
                  }
                  if (modalAction === 'reject') {
                    return (
                      <Button onClick={() => handleBulk(selectedUser.user_id, 'reject')} disabled={processing} className="px-6 h-9 text-red-600 border-red-200 hover:bg-red-50" variant="outline">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject All
                      </Button>
                    )
                  }
                  if (modalAction === 'approve') {
                    return (
                      <Button onClick={() => handleBulk(selectedUser.user_id, 'approve')} disabled={processing} className="px-6 h-9 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve All
                      </Button>
                    )
                  }
                  return (
                    <>
                      <Button onClick={() => handleBulk(selectedUser.user_id, 'reject')} disabled={processing} className="px-6 h-9 text-red-600 border-red-200 hover:bg-red-50" variant="outline">
                        <XCircle className="h-4 w-4 mr-2" /> Reject All
                      </Button>
                      <Button onClick={() => handleBulk(selectedUser.user_id, 'approve')} disabled={processing} className="px-6 h-9 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve All
                      </Button>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
