"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { 
  Plus, 
  Settings,
  CheckCircle, 
  XCircle 
} from "lucide-react"
import { getLeaveTypes } from "@/lib/api/leave-types"
import { 
  getLeavePolicies, 
  createLeavePolicy, 
  updateLeavePolicy, 
  deleteLeavePolicy,
  cloneLeavePolicy 
} from "@/lib/api/leave-policies"
import { LeaveType, LeavePolicy } from "@/lib/schemas"
import Swal from 'sweetalert2'

interface PolicyFormData {
  name: string
  leave_type: number
  applicable_roles?: number[]
  annual_quota: number
  monthly_accrual: string
  carry_forward_limit: number
  notice_days: number
  max_consecutive: number
  is_active: boolean
}

const defaultFormData: PolicyFormData = {
  name: '',
  leave_type: 0,
  applicable_roles: [],
  annual_quota: 0,
  monthly_accrual: '0',
  carry_forward_limit: 0,
  notice_days: 0,
  max_consecutive: 0,
  is_active: true
}

export function LeaveTypePoliciesManager() {
  const { toast } = useToast()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [policies, setPolicies] = useState<LeavePolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<PolicyFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [typesData, policiesData] = await Promise.all([
        getLeaveTypes(),
        getLeavePolicies()
      ])
      setLeaveTypes(typesData)
      setPolicies(policiesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || formData.leave_type === 0) {
      toast({
        title: "Validation Error",
        description: "Name and leave type are required",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateLeavePolicy(editingId, formData)
        toast({
          title: "Success",
          description: "Policy updated successfully"
        })
      } else {
        await createLeavePolicy(formData)
        toast({
          title: "Success", 
          description: "Policy created successfully"
        })
      }
      
      setDialogOpen(false)
      setFormData(defaultFormData)
      setEditingId(null)
      fetchData()
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save policy",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (policy: LeavePolicy) => {
    setFormData({
      name: policy.name,
      leave_type: policy.leave_type,
      applicable_roles: policy.applicable_roles,
      annual_quota: policy.annual_quota || 0,
      monthly_accrual: policy.monthly_accrual?.toString() || '0',
      carry_forward_limit: policy.carry_forward_limit || 0,
      notice_days: policy.notice_days || 0,
      max_consecutive: policy.max_consecutive || 0,
      is_active: policy.is_active
    })
    setEditingId(policy.id)
    setDialogOpen(true)
  }

  const handleDelete = async (policy: LeavePolicy) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete policy "${policy.name}"? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await deleteLeavePolicy(policy.id)
      toast({
        title: "Success",
        description: "Policy deleted successfully"
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete policy",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingId(null)
  }

  // Get available leave types (not used in existing policies, except for current policy when editing)
  const availableLeaveTypes = leaveTypes.filter(type => {
    if (editingId && formData.leave_type === type.id) {
      return true // Always allow current leave type when editing
    }
    return !policies.some(policy => policy.leave_type === type.id)
  })

  // Get used leave types for display
  const usedLeaveTypes = leaveTypes.filter(type => {
    return policies.some(policy => policy.leave_type === type.id)
  })

  const getLeaveTypeNames = (leaveTypeId: number) => {
    const type = leaveTypes.find(t => t.id === leaveTypeId)
    return type ? `${type.name} (${type.code})` : `Unknown (${leaveTypeId})`
  }

  const columns = [
    {
      key: 'name',
      header: 'Policy Name',
      sortable: true
    },
    {
      key: 'leave_type',
      header: 'Leave Type',
      sortable: true,
      cell: (policy: LeavePolicy) => getLeaveTypeNames(policy.leave_type)
    },
    {
      key: 'annual_quota',
      header: 'Annual Quota',
      sortable: true,
      cell: (policy: LeavePolicy) => `${policy.annual_quota || 0} days`
    },
    {
      key: 'monthly_accrual',
      header: 'Monthly Accrual',
      sortable: true,
      cell: (policy: LeavePolicy) => `${policy.monthly_accrual || 0} days`
    },
    {
      key: 'carry_forward_limit',
      header: 'Carry Forward',
      sortable: true,
      cell: (policy: LeavePolicy) => `${policy.carry_forward_limit || 0} days`
    },
    {
      key: 'notice_days',
      header: 'Notice Days',
      sortable: true,
      cell: (policy: LeavePolicy) => `${policy.notice_days || 0} days`
    },
    {
      key: 'max_consecutive',
      header: 'Max Consecutive',
      sortable: true,
      cell: (policy: LeavePolicy) => `${policy.max_consecutive || 0} days`
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (policy: LeavePolicy) => (
        <Badge variant={policy.is_active ? "default" : "secondary"}>
          {policy.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: <span className="block text-center">Actions</span>,
      cell: (policy: LeavePolicy) => (
        <div className="flex items-center justify-center">
          <ActionButtons
            onEdit={() => handleEdit(policy)}
            onDelete={() => handleDelete(policy)}
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
              <Settings className="h-5 w-5" />
              Leave Policies Management
            </CardTitle>
            <CardDescription>
              Configure leave-type specific policies with detailed rules and restrictions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Leave Policy' : 'Create Leave Policy'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId 
                      ? 'Update the policy information below'
                      : 'Create a new leave policy'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Policy Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Standard Annual Leave Policy"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Leave Type *</Label>
                    <Select
                      value={formData.leave_type && formData.leave_type !== 0 ? formData.leave_type.toString() : undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: parseInt(value) }))}
                      disabled={availableLeaveTypes.length === 0}
                    >
                      <SelectTrigger className={availableLeaveTypes.length === 0 ? "opacity-50" : ""}>
                        {formData.leave_type && formData.leave_type !== 0 ? (
                          <SelectValue />
                        ) : (
                          <span className="text-muted-foreground">
                            {availableLeaveTypes.length === 0
                              ? "All leave types are already used in policies"
                              : "Select leave type..."}
                          </span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {availableLeaveTypes.length === 0 ? (
                          <div className="px-2 py-3 text-sm text-gray-500 text-center">
                            No leave types available for new policies
                          </div>
                        ) : (
                          availableLeaveTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name} ({type.code})
                              {editingId && formData.leave_type === type.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annual_quota">Annual Quota</Label>
                      <Input
                        id="annual_quota"
                        type="number"
                        min="0"
                        value={formData.annual_quota}
                        onChange={(e) => setFormData({...formData, annual_quota: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_accrual">Monthly Accrual</Label>
                      <Input
                        id="monthly_accrual"
                        value={formData.monthly_accrual}
                        onChange={(e) => setFormData({...formData, monthly_accrual: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carry_forward_limit">Carry Forward Limit</Label>
                      <Input
                        id="carry_forward_limit"
                        type="number"
                        min="0"
                        value={formData.carry_forward_limit}
                        onChange={(e) => setFormData({...formData, carry_forward_limit: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notice_days">Notice Days</Label>
                      <Input
                        id="notice_days"
                        type="number"
                        min="0"
                        value={formData.notice_days}
                        onChange={(e) => setFormData({...formData, notice_days: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_consecutive">Max Consecutive Days</Label>
                    <Input
                      id="max_consecutive"
                      type="number"
                      min="0"
                      value={formData.max_consecutive}
                      onChange={(e) => setFormData({...formData, max_consecutive: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Active Policy</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : (editingId ? 'Update Policy' : 'Create Policy')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Settings className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading policies...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={policies}
            getRowKey={(policy) => policy.id}
            striped
            pageSize={10}
          />
        )}
      </CardContent>
    </Card>
  )
}
