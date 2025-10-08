"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { approveLeaveRequest, getLeaveRequests, rejectLeaveRequest } from "@/lib/api/leave-requests"

export default function AdminLeavesPage() {
  const [tab, setTab] = useState("pending")
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async (statusLabel: string) => {
    setLoading(true)
    try {
      const data = await getLeaveRequests({ status: statusLabel === "all" ? undefined : capitalize(statusLabel) })
      setRows(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(tab)
  }, [tab])

  const onApprove = async (id: number) => {
    await approveLeaveRequest(id)
    load(tab)
  }

  const onReject = async (id: number) => {
    const reason = prompt("Rejection reason (optional)") || undefined
    await rejectLeaveRequest(id, reason)
    load(tab)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Requests (Admin)</h2>
        <p className="text-sm text-muted-foreground md:text-base">Review and take action on employee leave requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[160px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.user}</TableCell>
                        <TableCell>{r.leave_type}</TableCell>
                        <TableCell>{r.start_date}</TableCell>
                        <TableCell>{r.end_date}</TableCell>
                        <TableCell>{r.duration_days}</TableCell>
                        <TableCell>{tab === "all" ? (r.status ?? "pending") : tab}</TableCell>
                        <TableCell>
                          {tab === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => onApprove(r.id)}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => onReject(r.id)}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
