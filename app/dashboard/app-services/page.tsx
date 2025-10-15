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
import { useToast } from "@/hooks/use-toast"
import { deleteAppService } from "@/hooks/use-app-services"
import Swal from 'sweetalert2'

interface AppService {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export default function AppServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedAppService, setSelectedAppService] = useState<AppService | null>(null)
  
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

  const handleDeleteAppService = async (appService: AppService) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${appService.name}". This action cannot be undone!`,
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
      await deleteAppService(appService.id)
      Swal.fire(
        'Deleted!',
        'The app service has been deleted successfully.',
        'success'
      )
      toast({
        title: "Success",
        description: "App Service deleted successfully",
      })
      mutate()
    } catch (error: any) {
      console.error("Error deleting app service:", error)
      Swal.fire(
        'Error!',
        'Failed to delete the app service. Please try again.',
        'error'
      )
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete app service",
      })
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

    </div>
  )
}