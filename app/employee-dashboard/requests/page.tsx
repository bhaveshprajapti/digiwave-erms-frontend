"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, Clock, FileText, ExternalLink } from "lucide-react"
import api from "@/lib/api"

interface ProfileUpdateRequest {
  id?: number
  field?: string
  field_name?: string
  old_value: string
  new_value: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at?: string
  document_link?: string
  reason?: string
}

export default function EmployeeRequestsPage() {
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/accounts/profile-update-requests/my_requests/')
      const data = Array.isArray(response.data) ? response.data : []
      const normalized = data.map((item: any) => ({
        ...item,
        field: item.field ?? item.field_name ?? ''
      }))
      setRequests(normalized)
    } catch (error) {
      console.error("Error loading requests:", error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  const filterByStatus = (status: string) => {
    return requests.filter(request => request.status === status)
  }

  const formatFieldName = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Requests</h1>
        <p className="text-muted-foreground">Track the status of your profile update requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{filterByStatus('pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{filterByStatus('approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{filterByStatus('rejected').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <RequestsList requests={requests} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <RequestsList requests={filterByStatus('pending')} />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <RequestsList requests={filterByStatus('approved')} />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <RequestsList requests={filterByStatus('rejected')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RequestsList({ requests }: { requests: ProfileUpdateRequest[] }) {
  const formatFieldName = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No profile update requests found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request, index) => (
        <Card key={request.id || index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <h3 className="font-medium text-lg">
                    {formatFieldName(request.field || request.field_name || 'Field')} Update
                  </h3>
                  <Badge 
                    variant="secondary"
                    className={`capitalize ${getStatusColor(request.status)}`}
                  >
                    {request.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">From:</span>
                    <p className="mt-1 p-2 bg-muted rounded">{request.old_value || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">To:</span>
                    <p className="mt-1 p-2 bg-muted rounded">{request.new_value || 'N/A'}</p>
                  </div>
                </div>

                {request.reason && (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Reason:</span>
                    <p className="mt-1">{request.reason}</p>
                  </div>
                )}

                {request.document_link && (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Supporting Document:</span>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-1" 
                      asChild
                    >
                      <a 
                        href={request.document_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Document
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-right text-sm text-muted-foreground">
                <p>Requested:</p>
                <p className="font-medium">{new Date(request.requested_at).toLocaleDateString()}</p>
                {request.reviewed_at && (
                  <>
                    <p className="mt-2">Reviewed:</p>
                    <p className="font-medium">{new Date(request.reviewed_at).toLocaleDateString()}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}