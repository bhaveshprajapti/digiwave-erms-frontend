"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/common/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Clock, Plus, Edit, Trash2 } from "lucide-react"
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
  description?: string
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
  
  // Form state
  const [formData, setFormData] = useState<CreateFlexibleTimingType>({
    name: '',
    code: '',
    description: '',
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
      const data = await getFlexibleTimingTypes()
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
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save flexible timing type",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (type: FlexibleTimingType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
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
      description: '',
      max_duration_minutes: 60,
      max_per_month: 2,
      requires_approval: true,
      advance_notice_hours: 2,
      is_active: true
    })
    setEditingType(null)
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    { key: 'description', header: 'Description' },
    { 
      key: 'max_duration_minutes', 
      header: 'Max Duration',
      cell: (type: FlexibleTimingType) => `${type.max_duration_minutes} min`
    },
    { 
      key: 'max_per_month', 
      header: 'Monthly Limit',
      cell: (type: FlexibleTimingType) => `${type.max_per_month} requests`
    },
    {
      key: 'requires_approval',
      header: 'Requires Approval',
      cell: (type: FlexibleTimingType) => type.requires_approval ? 'Yes' : 'No'
    },
    {
      key: 'advance_notice_hours',
      header: 'Notice Required',
      cell: (type: FlexibleTimingType) => `${type.advance_notice_hours} hours`
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (type: FlexibleTimingType) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(type)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(type)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit' : 'Add'} Flexible Timing Type
            </DialogTitle>
            <DialogDescription>
              {editingType 
                ? 'Update the flexible timing type settings below.' 
                : 'Create a new flexible timing type for employees to request timing adjustments.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Late Arrival"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., LATE_ARR"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this timing type..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_duration">Max Duration (minutes) *</Label>
                <Input
                  id="max_duration"
                  type="number"
                  value={formData.max_duration_minutes.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_duration_minutes: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="480"
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_per_month">Max Per Month *</Label>
                <Input
                  id="max_per_month"
                  type="number"
                  value={formData.max_per_month.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_per_month: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="31"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="advance_notice">Advance Notice (hours) *</Label>
              <Input
                id="advance_notice"
                type="number"
                value={formData.advance_notice_hours.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, advance_notice_hours: parseInt(e.target.value) || 0 }))}
                min="0"
                max="168"
                required
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_approval"
                  checked={formData.requires_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked as boolean }))}
                />
                <Label htmlFor="requires_approval">Requires Approval</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingType ? 'Update' : 'Create'} Timing Type
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
