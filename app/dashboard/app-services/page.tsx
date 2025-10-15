"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { AppServiceModal } from "@/components/app-services/app-service-modal"
import { useAppServices } from "@/hooks/use-app-services"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteAppService } from "@/hooks/use-app-services"

interface AppService {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

export default function AppServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedAppService, setSelectedAppService] = useState<AppService | null>(null)
  const [appServiceToDelete, setAppServiceToDelete] = useState<AppService | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { appServices, isLoading, error, mutate } = useAppServices()
  const { toast } = useToast()

  const handleAddAppService = () => {
    setModalMode('add')
    setSelectedAppService(null)
    setIsModalOpen(true)
  }

  const handleEditAppService = (appService: AppService) => {
    setModalMode('edit')
    setSelectedAppService(appService)
    setIsModalOpen(true)
  }

  const handleDeleteAppService = (appService: AppService) => {
    setAppServiceToDelete(appService)
  }

  const confirmDelete = async () => {
    if (!appServiceToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteAppService(appServiceToDelete.id)
      toast({
        title: "Success",
        description: "App Service deleted successfully",
      })
      mutate()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete app service",
      })
    } finally {
      setIsDeleting(false)
      setAppServiceToDelete(null)
    }
  }

  const handleRefresh = () => {
    mutate()
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-destructive">Error loading app services</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4 w-full">
              <div className="p-2 bg-primary/10 rounded-full">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total App Services</p>
                <p className="text-2xl font-bold text-primary">
                  {isLoading ? "..." : appServices?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4 w-full">
              <div className="p-2 bg-green-100 rounded-full">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : appServices?.filter(service => service.is_active).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4 w-full">
              <div className="p-2 bg-red-100 rounded-full">
                <Plus className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Services</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? "..." : appServices?.filter(service => !service.is_active).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Services Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">All App Services</CardTitle>
            <Button 
              onClick={handleAddAppService}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add App Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<AppService>
            columns={[
              { 
                key: 'sr', 
                header: 'Sr No.', 
                cell: (_item, i) => <span className="font-medium">{i + 1}</span>, 
                className: 'w-16' 
              },
              { 
                key: 'name', 
                header: 'Name', 
                cell: (item) => <span className="font-medium">{item.name}</span>,
                sortable: true
              },
              { 
                key: 'description', 
                header: 'Description', 
                cell: (item) => <span className="text-sm text-muted-foreground">{item.description || '-'}</span> 
              },
              { 
                key: 'is_active', 
                header: 'Status', 
                cell: (item) => (
                  <Badge variant={item.is_active ? 'default' : 'secondary'} 
                    className={item.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                )
              },
              { 
                key: 'created_at', 
                header: 'Created', 
                cell: (item) => <span className="text-sm">{new Date(item.created_at).toLocaleDateString()}</span>,
                sortable: true
              },
              { 
                key: 'actions', 
                header: <span className="block text-center">Actions</span>, 
                cell: (item) => (
                  <div className="flex items-center justify-center">
                    <ActionButtons
                      onEdit={() => handleEditAppService(item)}
                      onDelete={() => handleDeleteAppService(item)}
                    />
                  </div>
                )
              },
            ]}
            data={appServices || []}
            getRowKey={(item) => item.id}
            striped
            loading={isLoading}
            emptyText="No app services found."
          />
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <AppServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appService={selectedAppService}
        mode={modalMode}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!appServiceToDelete} onOpenChange={(open) => !open && setAppServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the app service
              <strong> "{appServiceToDelete?.name}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}