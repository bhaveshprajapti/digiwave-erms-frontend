"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  field_name: string
  old_value: string
  new_value: string
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
  const [adminComment, setAdminComment] = useState("")
  const [processing, setProcessing] = useState(false)
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
      
      toast({
        title: "Request Approved",
        description: "Profile update has been approved and applied",
      })
      
      loadRequests() // Refresh the list
      setSelectedRequest(null)
      setAdminComment("")
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve the request",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!adminComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      await api.post(`/accounts/profile-update-requests/${requestId}/reject/`, {
        admin_comment: adminComment
      })
      
      toast({
        title: "Request Rejected",
        description: "Profile update has been rejected",
      })
      
      loadRequests() // Refresh the list
      setSelectedRequest(null)
      setAdminComment("")
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject the request",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.field_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Update Requests ({filteredRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No profile update requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.user_name}</p>
                        <p className="text-sm text-gray-500">{request.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {formatFieldName(request.field_name)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm">
                          <span className="font-medium">From:</span> {request.old_value || 'Empty'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">To:</span> {request.new_value}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(request.requested_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setAdminComment(request.admin_comment || "")
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Profile Update Request Details</DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-6">
                                {/* Employee Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="font-medium mb-2">Employee Information</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Name:</span> {selectedRequest.user_name}
                                    </div>
                                    <div>
                                      <span className="font-medium">Email:</span> {selectedRequest.user_email}
                                    </div>
                                  </div>
                                </div>

                                {/* Change Details */}
                                <div>
                                  <h3 className="font-medium mb-2">Requested Change</h3>
                                  <div className="space-y-2">
                                    <div>
                                      <Label>Field: {formatFieldName(selectedRequest.field_name)}</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-red-600">Current Value</Label>
                                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                          {selectedRequest.old_value || 'Empty'}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-green-600">New Value</Label>
                                        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                          {selectedRequest.new_value}
                                        </div>
                                      </div>
                                    </div>
                                    {selectedRequest.reason && (
                                      <div>
                                        <Label>Reason</Label>
                                        <div className="p-2 bg-gray-50 border rounded text-sm">
                                          {selectedRequest.reason}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Admin Comment */}
                                <div>
                                  <Label htmlFor="admin_comment">Admin Comment</Label>
                                  <Textarea
                                    id="admin_comment"
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    placeholder="Add your comment (required for rejection)"
                                    className="mt-1"
                                  />
                                </div>

                                {/* Actions */}
                                {selectedRequest.status === 'pending' && (
                                  <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleReject(selectedRequest.id)}
                                      disabled={processing}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={() => handleApprove(selectedRequest.id)}
                                      disabled={processing}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                  </div>
                                )}

                                {selectedRequest.status !== 'pending' && (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">Status: {getStatusBadge(selectedRequest.status)}</p>
                                        {selectedRequest.processed_at && (
                                          <p className="text-sm text-gray-500">
                                            Processed on {new Date(selectedRequest.processed_at).toLocaleString()}
                                          </p>
                                        )}
                                        {selectedRequest.approved_by_name && (
                                          <p className="text-sm text-gray-500">
                                            By: {selectedRequest.approved_by_name}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {selectedRequest.admin_comment && (
                                      <div className="mt-2">
                                        <Label>Admin Comment</Label>
                                        <div className="p-2 bg-white border rounded text-sm">
                                          {selectedRequest.admin_comment}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
