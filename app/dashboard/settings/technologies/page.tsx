"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Trash2, Plus } from "lucide-react"
import { useTechnologies } from "@/hooks/use-common"

interface TechnologyFormData {
  name: string
  description: string
  category: string
  is_active: boolean
}

export default function TechnologiesPage() {
  const { toast } = useToast()
  const { technologies, isLoading, createTechnology, updateTechnology, deleteTechnology } = useTechnologies()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTechnology, setEditingTechnology] = useState<any>(null)
  const [formData, setFormData] = useState<TechnologyFormData>({
    name: "",
    description: "",
    category: "",
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
      }

      if (editingTechnology) {
        await updateTechnology(editingTechnology.id, payload)
        toast({
          title: "Success",
          description: "Technology updated successfully",
        })
      } else {
        await createTechnology(payload)
        toast({
          title: "Success",
          description: "Technology created successfully",
        })
      }
      
      setIsDialogOpen(false)
      setEditingTechnology(null)
      setFormData({ name: "", description: "", category: "", is_active: true })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save technology",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (technology: any) => {
    setEditingTechnology(technology)
    setFormData({
      name: technology.name,
      description: technology.description || "",
      category: technology.category || "",
      is_active: technology.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this technology?")) {
      try {
        await deleteTechnology(id)
        toast({
          title: "Success",
          description: "Technology deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete technology",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleStatus = async (technology: any) => {
    try {
      await updateTechnology(technology.id, {
        ...technology,
        is_active: !technology.is_active,
      })
      toast({
        title: "Success",
        description: `Technology ${!technology.is_active ? 'activated' : 'deactivated'} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update technology status",
        variant: "destructive",
      })
    }
  }

  const openCreateDialog = () => {
    setEditingTechnology(null)
    setFormData({ name: "", description: "", category: "", is_active: true })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technologies</h1>
          <p className="text-muted-foreground">
            Manage the technologies and skills used in your organization
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Technology
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Technologies</CardTitle>
          <CardDescription>
            A list of all technologies and skills in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technologies?.map((technology: any) => (
                  <TableRow key={technology.id}>
                    <TableCell className="font-medium">{technology.name}</TableCell>
                    <TableCell>
                      {technology.category || (
                        <span className="text-muted-foreground">No category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={technology.is_active}
                            onChange={() => handleToggleStatus(technology)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm">
                          {technology.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(technology)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(technology.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && technologies?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No technologies found</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add your first technology
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTechnology ? "Edit Technology" : "Add New Technology"}
            </DialogTitle>
            <DialogDescription>
              {editingTechnology 
                ? "Update the details of this technology" 
                : "Add a new technology or skill to your organization"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., React, Python, Docker"
                  required
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Frontend, Backend, DevOps"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the technology"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <Label htmlFor="is_active" className="cursor-pointer">
                  <span className="font-medium">Active Status</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.is_active ? "Active" : "Inactive"}
                  </span>
                </Label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name.trim()}>
                {editingTechnology ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
