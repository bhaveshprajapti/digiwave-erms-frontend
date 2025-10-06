"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Check, X, Eye } from "lucide-react"

const mockLeaveRequests = [
  {
    id: "1",
    employeeName: "Sarah Johnson",
    leaveType: "Casual Leave",
    startDate: "2025-10-15",
    endDate: "2025-10-17",
    duration: 3,
    reason: "Personal work",
    status: "pending",
    appliedDate: "2025-10-05",
  },
  {
    id: "2",
    employeeName: "Mike Chen",
    leaveType: "Sick Leave",
    startDate: "2025-10-08",
    endDate: "2025-10-09",
    duration: 2,
    reason: "Medical appointment",
    status: "approved",
    appliedDate: "2025-10-03",
  },
  {
    id: "3",
    employeeName: "Emma Davis",
    leaveType: "Annual Leave",
    startDate: "2025-12-20",
    endDate: "2025-12-27",
    duration: 8,
    reason: "Holiday vacation",
    status: "pending",
    appliedDate: "2025-10-04",
  },
  {
    id: "4",
    employeeName: "James Wilson",
    leaveType: "Casual Leave",
    startDate: "2025-10-01",
    endDate: "2025-10-01",
    duration: 1,
    reason: "Family event",
    status: "rejected",
    appliedDate: "2025-09-28",
  },
]

export function LeaveRequestList() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredRequests = mockLeaveRequests.filter((req) => {
    if (activeTab === "all") return true
    return req.status === activeTab
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
    > = {
      pending: { variant: "secondary", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      approved: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      rejected: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
    }
    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.employeeName}</div>
                        <div className="text-sm text-muted-foreground">Applied {request.appliedDate}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.leaveType}</TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{request.duration} days</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === "pending" && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
