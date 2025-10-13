"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Plus, Settings } from "lucide-react"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { 
  getLeaveTypes, 
  createLeaveType, 
  updateLeaveType, 
  deleteLeaveType,
  getLeaveTypePolicies 
} from "@/lib/api/leave-types"
import { LeaveType } from "@/lib/schemas"

interface LeaveTypeFormData {
  name: string
  code: string
  is_paid: boolean
  color_code: string
  is_active: boolean
}

const defaultFormData: LeaveTypeFormData = {
  name: '',
  code: '',
  is_paid: true,
  color_code: '#007bff',
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
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
    setFormErrors({}) // Clear previous errors
    
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
      const errorData = error?.response?.data
      
      // Handle field-specific validation errors
      if (errorData && typeof errorData === 'object') {
        const errors: Record<string, string> = {}
        
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            errors[key] = errorData[key][0]
          } else if (typeof errorData[key] === 'string') {
            errors[key] = errorData[key]
          }
        })
        
        setFormErrors(errors)
        
        // Show toast for general errors
        if (errorData.detail || errorData.message) {
          toast({
            title: "Error",
            description: errorData.detail || errorData.message,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save leave type",
          variant: "destructive"
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (leaveType: LeaveType) => {
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      is_paid: leaveType.is_paid,
      color_code: leaveType.color_code,
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
    setFormErrors({})
  }

  const handleStatusToggle = async (leaveType: LeaveType) => {
    setUpdatingStatus(leaveType.id)
    try {
      await updateLeaveType(leaveType.id, { is_active: !leaveType.is_active })
      toast({
        title: "Success",
        description: `Leave type ${!leaveType.is_active ? 'activated' : 'deactivated'} successfully`
      })
      fetchLeaveTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (leaveType: LeaveType) => (
        <div className="font-medium">{leaveType.name}</div>
      )
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      cell: (leaveType: LeaveType) => (
        <Badge variant="outline">{leaveType.code}</Badge>
      )
    },
    {
      key: 'is_paid',
      header: 'Type',
      sortable: true,
      cell: (leaveType: LeaveType) => (
        <Badge variant={leaveType.is_paid ? "default" : "secondary"}>
          {leaveType.is_paid ? "Paid" : "Unpaid"}
        </Badge>
      )
    },
    {
      key: 'policies_count',
      header: 'Policies',
      sortable: true,
      cell: (leaveType: LeaveType) => `${leaveType.policies_count} policies`
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (leaveType: LeaveType) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={leaveType.is_active}
            onCheckedChange={() => handleStatusToggle(leaveType)}
            disabled={updatingStatus === leaveType.id}
          />
          <span className={`text-sm font-medium ${leaveType.is_active ? 'text-green-600' : 'text-gray-500'}`}>
            {leaveType.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      cell: (leaveType: LeaveType) => new Date(leaveType.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      header: <span className="block text-center">Actions</span>,
      cell: (leaveType: LeaveType) => (
        <div className="flex items-center justify-center">
          <ActionButtons
            onEdit={() => handleEdit(leaveType)}
            onDelete={() => handleDelete(leaveType.id)}
            disabled={deleting === leaveType.id}
          />
        </div>
      )
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Types Management
            </CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Leave Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl">
                  {editingId ? 'Edit Leave Type' : 'Create Leave Type'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingId 
                    ? 'Update the leave type information below'
                    : 'Create a new leave type for your organization'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-semibold">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value})
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
                      }}
                      placeholder="e.g., Annual Leave"
                      required
                      className={`h-10 ${formErrors.name ? 'border-red-500' : ''}`}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="code" className="text-sm font-semibold">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => {
                        setFormData({...formData, code: e.target.value.toUpperCase()})
                        if (formErrors.code) setFormErrors(prev => ({ ...prev, code: '' }))
                      }}
                      placeholder="e.g., AL"
                      required
                      maxLength={10}
                      className={`h-10 ${formErrors.code ? 'border-red-500' : ''}`}
                    />
                    {formErrors.code && (
                      <p className="text-sm text-red-600">{formErrors.code}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 pb-2 border-t border-b">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="is_paid"
                      checked={formData.is_paid}
                      onCheckedChange={(checked) => setFormData({...formData, is_paid: checked})}
                    />
                    <Label htmlFor="is_paid" className="text-sm font-medium cursor-pointer">Paid Leave</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active</Label>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="min-w-[100px]">
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={leaveTypes}
          loading={loading}
          getRowKey={(leaveType) => leaveType.id.toString()}
        />
      </CardContent>
    </Card>
  )
}