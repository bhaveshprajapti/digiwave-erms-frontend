"use client"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useDesignations, createDesignation, updateDesignation, deleteDesignation, type Designation } from "@/hooks/use-designations"

export default function DesignationsPage() {
  const { designations, isLoading, error, mutate } = useDesignations()
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    level: 1 as number,
    is_active: true,
  })

  const handleOpenDialog = (designation?: Designation) => {
    if (designation) {
      setEditingDesignation(designation)
      setFormData({
        title: designation.title,
        level: designation.level,
        is_active: designation.is_active,
      })
    } else {
      setEditingDesignation(null)
      setFormData({
        title: "",
        level: 1,
        is_active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingDesignation(null)
    setFormData({ title: "", level: 1, is_active: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingDesignation) {
        await updateDesignation(String(editingDesignation.id), formData)
        toast({
          title: "Success",
          description: "Designation updated successfully",
        })
      } else {
        await createDesignation(formData)
        toast({
          title: "Success",
          description: "Designation created successfully",
        })
      }
      
      mutate() // Refresh the data
      handleCloseDialog()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save designation",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDesignation(String(id))
      toast({
        title: "Success",
        description: "Designation deleted successfully",
      })
      mutate() // Refresh the data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete designation",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Designations</h1>
            <p className="text-muted-foreground">Manage employee designations</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Designation
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Designations</h1>
            <p className="text-muted-foreground">Manage employee designations</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px] text-destructive">
            Error loading designations
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Designations</h1>
          <p className="text-muted-foreground">Manage employee designations</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Designation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Designations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations?.map((designation) => (
                <TableRow key={designation.id}>
                  <TableCell className="font-medium">{designation.title}</TableCell>
                  <TableCell>{designation.level}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={designation.is_active}
                        onCheckedChange={async (checked) => {
                          try {
                            await updateDesignation(String(designation.id), {
                              title: designation.title,
                              level: designation.level,
                              is_active: checked
                            })
                            mutate()
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
                        {designation.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(designation.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(designation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(designation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDesignation ? "Edit Designation" : "Add Designation"}
            </DialogTitle>
            <DialogDescription>
              {editingDesignation
                ? "Update the designation details."
                : "Create a new designation for employees."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Developer"
                  required
                />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                  placeholder="e.g., 1, 2, 3"
                  min={1}
                  max={10}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDesignation ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
