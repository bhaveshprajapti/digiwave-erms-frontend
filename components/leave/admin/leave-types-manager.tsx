"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar, 
  Settings, 
  CheckCircle, 
  XCircle 
} from "lucide-react"
import { 
  getLeaveTypes, 
  createLeaveType, 
  updateLeaveType, 
  deleteLeaveType,
  getLeaveTypePolicies 
} from "@/lib/api/leave-types"

interface LeaveType {
  id: number
  name: string
  code: string
  is_paid: boolean
  description?: string
  color_code: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
  policies_count: number
}

interface LeaveTypeFormData {
  name: string
  code: string
  is_paid: boolean
  description: string
  color_code: string
  icon: string
  is_active: boolean
}

const defaultFormData: LeaveTypeFormData = {
  name: '',
  code: '',
  is_paid: true,
  description: '',
  color_code: '#007bff',
  icon: '',
  is_active: true
}

export function LeaveTypesManager() {
  const { toast } = useToast()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<LeaveTypeFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true)
      const data = await getLeaveTypes()
      setLeaveTypes(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leave types",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and code are required",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateLeaveType(editingId, formData)
        toast({
          title: "Success",
          description: "Leave type updated successfully"
        })
      } else {
        await createLeaveType(formData)
        toast({
          title: "Success", 
          description: "Leave type created successfully"
        })
      }
      
      setDialogOpen(false)
      setFormData(defaultFormData)
      setEditingId(null)
      fetchLeaveTypes()
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save leave type",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (leaveType: LeaveType) => {
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      is_paid: leaveType.is_paid,
      description: leaveType.description || '',
      color_code: leaveType.color_code,
      icon: leaveType.icon || '',
      is_active: leaveType.is_active
    })
    setEditingId(leaveType.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this leave type? This action cannot be undone.")) {
      return
    }

    setDeleting(id)
    try {
      await deleteLeaveType(id)
      toast({
        title: "Success",
        description: "Leave type deleted successfully"
      })
      fetchLeaveTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete leave type",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Types Management
            </CardTitle>
            <p className="text-muted-foreground">
              Manage different types of leave available in your organization
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Leave Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Leave Type' : 'Create Leave Type'}
                </DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? 'Update the leave type information below'
                    : 'Create a new leave type for your organization'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Annual Leave"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="AL"
                      required
                      maxLength={10}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color_code}
                        onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.color_code}
                        onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                        placeholder="#007bff"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon (optional)</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      placeholder="calendar-days"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe this leave type..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_paid"
                      checked={formData.is_paid}
                      onCheckedChange={(checked) => setFormData({...formData, is_paid: checked})}
                    />
                    <Label htmlFor="is_paid">Paid Leave</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-muted h-16 rounded"></div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: leaveType.color_code }}
                      />
                      <div>
                        <div className="font-medium">{leaveType.name}</div>
                        {leaveType.description && (
                          <div className="text-sm text-muted-foreground">
                            {leaveType.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{leaveType.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={leaveType.is_paid ? "default" : "secondary"}>
                      {leaveType.is_paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{leaveType.policies_count} policies</span>
                  </TableCell>
                  <TableCell>
                    {leaveType.is_active ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(leaveType.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(leaveType)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/dashboard/leave/policies?leave_type=${leaveType.id}`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Policies
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(leaveType.id)}
                          className="text-red-600"
                          disabled={deleting === leaveType.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleting === leaveType.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {leaveTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Leave Types Found</p>
                      <p className="text-sm">Create your first leave type to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}