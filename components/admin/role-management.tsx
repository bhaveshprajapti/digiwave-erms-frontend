"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2 } from "lucide-react"

const mockRoles = [
  {
    id: "1",
    name: "Admin",
    description: "Full system access",
    userCount: 5,
    permissions: ["all"],
  },
  {
    id: "2",
    name: "Manager",
    description: "Team and project management",
    userCount: 12,
    permissions: ["view_employees", "approve_leaves", "manage_projects"],
  },
  {
    id: "3",
    name: "Employee",
    description: "Basic employee access",
    userCount: 231,
    permissions: ["view_profile", "submit_leaves", "log_time"],
  },
]

const availablePermissions = [
  { id: "view_employees", label: "View Employees", module: "Employees" },
  { id: "manage_employees", label: "Manage Employees", module: "Employees" },
  { id: "view_leaves", label: "View Leaves", module: "Leave" },
  { id: "approve_leaves", label: "Approve Leaves", module: "Leave" },
  { id: "manage_projects", label: "Manage Projects", module: "Projects" },
  { id: "view_projects", label: "View Projects", module: "Projects" },
  { id: "manage_clients", label: "Manage Clients", module: "Clients" },
  { id: "view_reports", label: "View Reports", module: "Reports" },
  { id: "manage_settings", label: "Manage Settings", module: "Settings" },
]

export function RoleManagement() {
  const [roles, setRoles] = useState(mockRoles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Roles</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input id="role-name" placeholder="e.g., Team Lead" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Input id="role-description" placeholder="Brief description of the role" />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-3 rounded-lg border p-4">
                      {availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions([...selectedPermissions, permission.id])
                              } else {
                                setSelectedPermissions(selectedPermissions.filter((p) => p !== permission.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={permission.id}
                            className="flex flex-1 cursor-pointer items-center justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <span>{permission.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {permission.module}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsDialogOpen(false)}>Create Role</Button>
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
                  <TableHead className="min-w-[150px]">Role Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="hidden lg:table-cell">Permissions</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{role.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.userCount}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 2).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" disabled={role.name === "Admin"}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
