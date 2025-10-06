import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { useState } from "react"
import Swal from 'sweetalert2'

interface ManagementTableProps<T> {
  title: string
  description: string
  items: T[]
  isLoading: boolean
  fields: {
    key: keyof T
    label: string
    type: "text" | "switch" | "number" | "time"
  }[]
  onAdd: (data: Partial<T>) => Promise<void>
  onEdit: (id: number, data: Partial<T>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function ManagementTable<T extends { id: number; name: string; is_active?: boolean }>({
  title,
  description,
  items,
  isLoading,
  fields,
  onAdd,
  onEdit,
  onDelete,
}: ManagementTableProps<T>) {
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  // Initialize form data with default values based on field types
  const [formData, setFormData] = useState<Partial<T>>(() => {
    const defaults: Partial<T> = {}
    fields.forEach(field => {
      if (field.type === 'switch') {
        if (field.key === 'is_active') {
          defaults[field.key] = true as any
        } else {
          defaults[field.key] = false as any
        }
      }
    })
    return defaults
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (field: typeof fields[0], value: any): string => {
    if (field.type === 'text' && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`
    }
    if (field.type === 'time' && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`
    }
    if (field.type === 'number' && (value === undefined || value === '' || isNaN(Number(value)))) {
      return `${field.label} must be a valid number`
    }
    return ''
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    fields.forEach(field => {
      const value = formData[field.key]
      const error = validateField(field, value)
      if (error) {
        newErrors[field.key as string] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleAdd = async () => {
    if (!validateForm()) {
      return
    }

    // Ensure all required fields are present with proper defaults
    const submitData = { ...formData }
    fields.forEach(field => {
      if (submitData[field.key] === undefined || submitData[field.key] === '') {
        if (field.type === 'switch') {
          submitData[field.key] = (field.key === 'is_active' ? true : false) as any
        } else if (field.type === 'text') {
          submitData[field.key] = '' as any
        } else if (field.type === 'time') {
          submitData[field.key] = '' as any // No default time
        } else if (field.type === 'number') {
          submitData[field.key] = 0 as any
        }
      }
    })
    
    try {
      await onAdd(submitData)
      setIsAddOpen(false)
      setErrors({})
      // Reset form to default values
      setFormData(() => {
        const defaults: Partial<T> = {}
        fields.forEach(field => {
          if (field.type === 'switch') {
            if (field.key === 'is_active') {
              defaults[field.key] = true as any
            } else {
              defaults[field.key] = false as any
            }
          }
        })
        return defaults
      })
      toast({
        title: "Success",
        description: "Item added successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return

    if (!validateForm()) {
      return
    }

    try {
      await onEdit(editingItem.id, formData)
      setIsEditOpen(false)
      setEditingItem(null)
      setFormData({})
      setErrors({})
      toast({
        title: "Success",
        description: "Item updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (item: T) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${item.name}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    try {
      await onDelete(item.id)
      Swal.fire(
        'Deleted!',
        'The item has been deleted successfully.',
        'success'
      )
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      Swal.fire(
        'Error!',
        'Failed to delete the item. Please try again.',
        'error'
      )
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const renderFormField = (field: typeof fields[0], value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={String(field.key)}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(Boolean(checked))}
            />
            <Label htmlFor={String(field.key)}>{field.label}</Label>
          </div>
        )
      case "number":
        return (
          <Input
            type="number"
            id={String(field.key)}
            value={value ?? ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          />
        )
      case "time":
        return (
          <TimePicker
            label={field.label}
            date={value ? new Date(`1970-01-01T${value}`) : undefined}
            setDate={(date: Date | undefined) => {
              if (date) {
                const hours = date.getHours().toString().padStart(2, '0')
                const minutes = date.getMinutes().toString().padStart(2, '0')
                onChange(`${hours}:${minutes}`)
              } else {
                onChange('')
              }
            }}
          />
        )
      default:
        return (
          <Input
            type="text"
            id={String(field.key)}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )
    }
  }

  const renderForm = () => {
    const currentData = editingItem ? editingItem : formData
    return (
      <div className="grid gap-4 py-4">
        {fields.map((field) => (
          <div key={field.key as string} className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor={field.key as string} className="text-right pt-2">
              {field.label}
            </Label>
            <div className="col-span-3">
              {renderFormField(
                field,
                formData[field.key] ?? currentData[field.key] ?? "",
                (value) => {
                  setFormData({ ...formData, [field.key]: value })
                  // Clear error when user starts typing
                  if (errors[field.key as string]) {
                    setErrors({ ...errors, [field.key as string]: '' })
                  }
                }
              )}
              {errors[field.key as string] && (
                <p className="text-sm text-red-500 mt-1">{errors[field.key as string]}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field) => (
                <TableHead key={field.key as string}>{field.label}</TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {fields.map((field) => (
                  <TableCell key={field.key as string}>
                    {field.type === "switch" ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={Boolean(item[field.key])}
                          onCheckedChange={async (checked) => {
                            try {
                              await onEdit(item.id, { [field.key]: checked } as Partial<T>)
                              toast({
                                title: "Success",
                                description: "Status updated successfully",
                              })
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update status",
                                variant: "destructive",
                              })
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {Boolean(item[field.key]) ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ) : (
                      String(item[field.key] ?? "")
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingItem(item)
                        setFormData({ ...item })
                        setErrors({})
                        setIsEditOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}