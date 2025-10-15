"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Edit, Trash2, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { useToast } from "@/hooks/use-toast"
import { ClientModal } from "./client-modal"
import Swal from 'sweetalert2'
import api from "@/lib/api"

interface Client {
  id: number
  name: string
  email: string
  phone?: string
  gst_number?: string
  website?: string
  rating: number
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
            <Button asChild>
              <Link href="/dashboard/clients/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Link>
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
            { key: 'gst', header: 'GST Number', cell: (client) => client.gst_number || 'N/A' },
            { key: 'rating', header: 'Rating', sortable: true, cell: (client) => (
              <div className="flex items-center">
                <span className="font-medium">{client.rating}/5</span>
              </div>
            )},
            { key: 'created', header: 'Created', sortable: true, sortAccessor: (c)=>new Date(c.created_at).getTime(), cell: (c)=> new Date(c.created_at).toLocaleDateString() },
            { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (client) => (
              <div className="flex items-center justify-center">
                <ActionButtons
                  extras={[
                    { title: 'View Details', onClick: () => window.location.href = `/dashboard/clients/${client.id}`, icon: <Eye className="h-4 w-4" />},
                    { title: 'Create Quote', onClick: () => window.location.href = `/dashboard/quotations/new?client=${client.id}`, icon: <FileText className="h-4 w-4" />},
                    { title: 'Edit', onClick: () => window.location.href = `/dashboard/clients/${client.id}/edit`, icon: <Edit className="h-4 w-4" />},
                    { title: 'Delete', onClick: () => {}, className: 'hover:bg-red-100', icon: <Trash2 className="h-4 w-4 text-red-600" />},
                  ]}
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
  )
}
