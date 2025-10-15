"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { useToast } from "@/hooks/use-toast"
import { ClientModal } from "./client-modal"
import { ClientStats } from "./client-stats"
import Swal from 'sweetalert2'
import api from "@/lib/api"

interface Client {
  id: number
  name: string
  email: string
  phone?: string
  gst_number?: string
  website?: string
  rating?: number
  is_active?: boolean
  address_info?: string
  address_details?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  }
  created_at: string
}

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const { toast } = useToast()
  
  // Calculate stats
  const totalClients = clients.length
  const activeClients = clients.filter(client => client.is_active !== false).length // Default to active if undefined
  const inactiveClients = clients.filter(client => client.is_active === false).length
  
  useEffect(() => {
    fetchClients()
  }, [])
  
  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/clients/')
      setClients(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddClient = () => {
    setModalMode('add')
    setSelectedClient(null)
    setIsModalOpen(true)
  }
  
  const handleEditClient = async (client: Client) => {
    try {
      // Fetch complete client details for editing
      const response = await api.get(`/clients/clients/${client.id}/`)
      setModalMode('edit')
      setSelectedClient(response.data)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive"
      })
    }
  }
  
  const handleDeleteClient = async (client: Client) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${client.name}". This action cannot be undone!`,
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
      await api.delete(`/clients/clients/${client.id}/`)
      Swal.fire(
        'Deleted!',
        'The client has been deleted successfully.',
        'success'
      )
      fetchClients() // Refresh the list
    } catch (error: any) {
      console.error("Error deleting client:", error)
      Swal.fire(
        'Error!',
        'Failed to delete the client. Please try again.',
        'error'
      )
    }
  }
  
  const handleRefresh = () => {
    fetchClients()
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      active: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      inactive: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
    }
    const config = variants[status] || variants.active
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  return (
    <>
    {/* Client Stats */}
    <ClientStats 
      totalClients={totalClients}
      activeClients={activeClients}
      inactiveClients={inactiveClients}
      loading={loading}
    />
    
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Clients</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<Client>
          columns={[
            { key: 'client', header: 'Client', sortable: true, sortAccessor: (c)=>c.name, cell: (client) => (
              <div>
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-muted-foreground">{client.email}</div>
              </div>
            )},
            { key: 'contact', header: 'Contact', cell: (client) => (
              <div className="text-sm">
                <div>{client.phone || 'N/A'}</div>
                {client.website && (
                  <div className="text-muted-foreground">
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {client.website}
                    </a>
                  </div>
                )}
              </div>
            )},
            { key: 'address', header: 'Address', cell: (client) => (
              <div className="text-sm max-w-[200px]">
                <div className="truncate">{client.address_info || 'N/A'}</div>
              </div>
            )},
            { key: 'gst', header: 'GST Number', cell: (client) => client.gst_number || 'N/A' },
            { key: 'status', header: 'Status', cell: (client) => (
              <Badge 
                variant="outline" 
                className={client.is_active !== false ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}
              >
                {client.is_active !== false ? 'Active' : 'Inactive'}
              </Badge>
            )},
            { key: 'created', header: 'Created', sortable: true, sortAccessor: (c)=>new Date(c.created_at).getTime(), cell: (c)=> new Date(c.created_at).toLocaleDateString() },
            { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (client) => (
              <div className="flex items-center justify-center">
                <ActionButtons
                  onEdit={() => handleEditClient(client)}
                  onDelete={() => handleDeleteClient(client)}
                />
              </div>
            )}
          ]}
          data={filteredClients}
          getRowKey={(c)=>c.id.toString()}
          striped
          pageSize={10}
          loading={loading}
          emptyText="No clients found"
        />
      </CardContent>
    </Card>
    
    {/* Client Modal */}
    <ClientModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      client={selectedClient}
      mode={modalMode}
      onSuccess={handleRefresh}
    />
  </>
  )
}
