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
  const [selectedUser, setSelectedUser] = useState<{ user_id: number; user_name: string; user_email: string } | null>(null)
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
    setProcessing(true)
    try {
      await api.post(`/accounts/profile-update-requests/${requestId}/reject/`, {
        admin_comment: adminComment && adminComment.trim().length > 0 ? adminComment : 'Request rejected'
      })
      
      toast({
        title: "Request Rejected",
        description: "Profile update has been rejected",
      })
      
      loadRequests() // Refresh the list
      setSelectedRequest(null)
      setAdminComment("")
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      const description = error?.response?.data?.error || "Failed to reject the request"
      toast({
        title: "Error",
        description,
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Totals</TableHead>
                  <TableHead>Latest Request</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedByUser.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.user_name}</p>
                        <p className="text-sm text-gray-500">{u.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Total {u.total}</Badge>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Pending {u.pending}</Badge>
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Approved {u.approved}</Badge>
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Rejected {u.rejected}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(u.latest).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser({ user_id: u.user_id, user_name: u.user_name, user_email: u.user_email })
                              setAdminComment("")
                            }}
                          >
                            View Requests
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Requests for {selectedUser?.user_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {filteredRequests.filter(r => r.user === selectedUser?.user_id).length === 0 ? (
                              <div className="text-center py-8 text-gray-500">No requests for this user.</div>
                            ) : (
                              filteredRequests
                                .filter(r => r.user === selectedUser?.user_id)
                                .map((request) => (
                                  <div key={request.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-2 w-full">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {formatFieldName(request.field_name)}
                                          </Badge>
                                          {getStatusBadge(request.status)}
                                        </div>
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
                                        {request.reason && (
                                          <div>
                                            <Label>Reason</Label>
                                            <div className="p-2 bg-gray-50 border rounded text-sm">
                                              {request.reason}
                                            </div>
                                          </div>
                                        )}
                                        {request.status === 'pending' && (
                                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-end pt-2">
                                            <Textarea
                                              value={adminComment}
                                              onChange={(e) => setAdminComment(e.target.value)}
                                              placeholder="Admin comment (optional)"
                                              className="md:max-w-sm"
                                            />
                                            <div className="flex items-center gap-2">
                                              <Button
                                                variant="outline"
                                                onClick={() => handleReject(request.id)}
                                                disabled={processing}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                              >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                              </Button>
                                              <Button
                                                onClick={() => handleApprove(request.id)}
                                                disabled={processing}
                                                className="bg-green-600 hover:bg-green-700"
                                              >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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
