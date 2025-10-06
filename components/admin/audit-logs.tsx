"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

const mockLogs = [
  {
    id: "1",
    timestamp: "2025-10-05 14:32:15",
    user: "John Doe",
    action: "UPDATE",
    entity: "Employee",
    entityId: "EMP-001",
    description: "Updated salary information",
    ipAddress: "192.168.1.100",
  },
  {
    id: "2",
    timestamp: "2025-10-05 13:15:42",
    user: "Sarah Johnson",
    action: "CREATE",
    entity: "Leave Request",
    entityId: "LR-234",
    description: "Created new leave request",
    ipAddress: "192.168.1.105",
  },
  {
    id: "3",
    timestamp: "2025-10-05 12:08:30",
    user: "Admin",
    action: "DELETE",
    entity: "Project",
    entityId: "PRJ-045",
    description: "Deleted completed project",
    ipAddress: "192.168.1.1",
  },
  {
    id: "4",
    timestamp: "2025-10-05 11:45:18",
    user: "Mike Chen",
    action: "UPDATE",
    entity: "Task",
    entityId: "TSK-789",
    description: "Marked task as completed",
    ipAddress: "192.168.1.110",
  },
  {
    id: "5",
    timestamp: "2025-10-05 10:22:05",
    user: "Emma Davis",
    action: "CREATE",
    entity: "Client",
    entityId: "CLT-156",
    description: "Added new client",
    ipAddress: "192.168.1.115",
  },
]

export function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  const getActionBadge = (action: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
    > = {
      CREATE: { variant: "default", className: "bg-green-100 text-green-700 border-green-200" },
      UPDATE: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200" },
      DELETE: { variant: "destructive", className: "" },
    }
    const config = variants[action] || { variant: "outline" as const, className: "" }
    return (
      <Badge variant={config.variant} className={config.className}>
        {action}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>System Activity</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Timestamp</TableHead>
                <TableHead className="min-w-[120px]">User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Entity</TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead className="hidden xl:table-cell">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-medium">{log.entity}</div>
                      <div className="text-xs text-muted-foreground">{log.entityId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{log.description}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
