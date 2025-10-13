"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Clock, Plus } from "lucide-react"
import { 
  getFlexibleTimingTypes, 
  FlexibleTimingType,
  createFlexibleTimingType,
  updateFlexibleTimingType,
  deleteFlexibleTimingType
} from "@/lib/api/flexible-timing"

interface CreateFlexibleTimingType {
  name: string
  code: string
  max_duration_minutes: number
  max_per_month: number
  requires_approval: boolean
  advance_notice_hours: number
  is_active: boolean
}

export function FlexibleTimingTypesManager() {
  const { toast } = useToast()
  const [types, setTypes] = useState<FlexibleTimingType[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<FlexibleTimingType | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [formData, setFormData] = useState<CreateFlexibleTimingType>({
    name: '',
    code: '',
    max_duration_minutes: 60,
    max_per_month: 2,
    requires_approval: true,
    advance_notice_hours: 2,
    is_active: true
  })

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    setLoading(true)
    try {
      const data = await getFlexibleTimingTypes() // Fetch all types (active and inactive)
      setTypes(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load flexible timing types",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({}) // Clear previous errors
    
    try {
      if (editingType) {
        await updateFlexibleTimingType(editingType.id, formData)
        toast({ title: "Success", description: "Flexible timing type updated successfully" })
      } else {
        await createFlexibleTimingType(formData)
        toast({ title: "Success", description: "Flexible timing type created successfully" })
      }
      
      setDialogOpen(false)
      resetForm()
      await loadTypes()
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
        if (errorData.detail) {
          toast({
            title: "Error",
            description: errorData.detail,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save flexible timing type",
          variant: "destructive"
        })
      }
    }
  }

  const handleEdit = (type: FlexibleTimingType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      code: type.code,
      max_duration_minutes: type.max_duration_minutes,
      max_per_month: type.max_per_month,
      requires_approval: type.requires_approval,
      advance_notice_hours: type.advance_notice_hours,
      is_active: type.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (type: FlexibleTimingType) => {
    if (!confirm(`Are you sure you want to delete "${type.name}"?`)) return
    
    try {
      await deleteFlexibleTimingType(type.id)
      toast({ title: "Success", description: "Flexible timing type deleted successfully" })
      await loadTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to delete flexible timing type",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      max_duration_minutes: 60,
      max_per_month: 2,
      requires_approval: true,
      advance_notice_hours: 2,
      is_active: true
    })
    setEditingType(null)
    setFormErrors({})
  }

  const handleStatusToggle = async (type: FlexibleTimingType) => {
    setUpdatingStatus(type.id)
    try {
      await updateFlexibleTimingType(type.id, { is_active: !type.is_active })
      toast({
        title: "Success",
        description: `Timing type ${!type.is_active ? 'activated' : 'deactivated'} successfully`
      })
      await loadTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'code', header: 'Code', sortable: true },
    { 
      key: 'max_duration_minutes', 
      header: 'Max Duration',
      sortable: true,
      cell: (type: FlexibleTimingType) => `${type.max_duration_minutes} min`
    },
    { 
      key: 'max_per_month', 
      header: 'Monthly Limit',
      sortable: true,
      cell: (type: FlexibleTimingType) => `${type.max_per_month} requests`
    },
    {
      key: 'requires_approval',
      header: 'Requires Approval',
      sortable: true,
      cell: (type: FlexibleTimingType) => type.requires_approval ? 'Yes' : 'No'
    },
    {
      key: 'advance_notice_hours',
      header: 'Notice Required',
      sortable: true,
      cell: (type: FlexibleTimingType) => `${type.advance_notice_hours} hours`
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (type: FlexibleTimingType) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={type.is_active}
            onCheckedChange={() => handleStatusToggle(type)}
            disabled={updatingStatus === type.id}
          />
          <span className={`text-sm font-medium ${type.is_active ? 'text-green-600' : 'text-gray-500'}`}>
            {type.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: <span className="block text-center">Actions</span>,
      cell: (type: FlexibleTimingType) => (
        <div className="flex items-center justify-center">
          <ActionButtons
            onEdit={() => handleEdit(type)}
            onDelete={() => handleDelete(type)}
          />
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Flexible Timing Types
            </CardTitle>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Timing Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={types}
            loading={loading}
            getRowKey={(type) => type.id.toString()}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">
              {editingType ? 'Edit' : 'Add'} Flexible Timing Type
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingType 
                ? 'Update the flexible timing type settings below.' 
                : 'Create a new flexible timing type for employees to request timing adjustments.'}
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
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
                  }}
                  placeholder="e.g., Late Arrival"
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
                    setFormData(prev => ({ ...prev, code: e.target.value }))
                    if (formErrors.code) setFormErrors(prev => ({ ...prev, code: '' }))
                  }}
                  placeholder="e.g., LATE_ARR"
                  required
                  className={`h-10 ${formErrors.code ? 'border-red-500' : ''}`}
                />
                {formErrors.code && (
                  <p className="text-sm text-red-600">{formErrors.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="max_duration" className="text-sm font-semibold">Max Duration (minutes) *</Label>
                <Input
                  id="max_duration"
                  type="number"
                  value={formData.max_duration_minutes.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_duration_minutes: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="480"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="max_per_month" className="text-sm font-semibold">Max Per Month *</Label>
                <Input
                  id="max_per_month"
                  type="number"
                  value={formData.max_per_month.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_per_month: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="31"
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="advance_notice" className="text-sm font-semibold">Advance Notice (hours) *</Label>
              <Input
                id="advance_notice"
                type="number"
                value={formData.advance_notice_hours.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, advance_notice_hours: parseInt(e.target.value) || 0 }))}
                min="0"
                max="168"
                required
                className="h-10"
              />
            </div>

            <div className="flex items-center justify-start gap-8 pt-2 pb-2 border-t border-b">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="requires_approval"
                  checked={formData.requires_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked as boolean }))}
                />
                <Label htmlFor="requires_approval" className="text-sm font-medium cursor-pointer">Requires Approval</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                />
                <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="min-w-[100px]">
                Cancel
              </Button>
              <Button type="submit" className="min-w-[120px]">
                {editingType ? 'Update' : 'Create'} Timing Type
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
