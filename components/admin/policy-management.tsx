"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const mockPolicies = [
  {
    id: "1",
    name: "Annual Leave",
    code: "AL",
    quota: 18,
    carryForward: true,
    maxCarryForward: 5,
    applicableRoles: ["All"],
  },
  {
    id: "2",
    name: "Sick Leave",
    code: "SL",
    quota: 12,
    carryForward: false,
    maxCarryForward: 0,
    applicableRoles: ["All"],
  },
  {
    id: "3",
    name: "Casual Leave",
    code: "CL",
    quota: 10,
    carryForward: false,
    maxCarryForward: 0,
    applicableRoles: ["All"],
  },
]

export function PolicyManagement() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Leave Types</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Leave Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="leave-name">Leave Name</Label>
                      <Input id="leave-name" placeholder="e.g., Annual Leave" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leave-code">Code</Label>
                      <Input id="leave-code" placeholder="e.g., AL" maxLength={3} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quota">Annual Quota (Days)</Label>
                      <Input id="quota" type="number" placeholder="18" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carry-forward">Max Carry Forward</Label>
                      <Input id="carry-forward" type="number" placeholder="5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicable-roles">Applicable Roles</Label>
                    <Select>
                      <SelectTrigger id="applicable-roles">
                        <SelectValue placeholder="Select roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead className="hidden sm:table-cell">Carry Forward</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{policy.name}</div>
                        <div className="text-xs text-muted-foreground">{policy.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{policy.quota} days</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {policy.carryForward ? (
                        <span className="text-sm">Max {policy.maxCarryForward} days</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flex Allowance Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Late Arrival</h4>
                  <p className="text-sm text-muted-foreground">15 minutes grace period</p>
                </div>
                <Badge variant="outline">1x/month</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Early Departure</h4>
                  <p className="text-sm text-muted-foreground">15 minutes grace period</p>
                </div>
                <Badge variant="outline">1x/month</Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Add Flex Type
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
