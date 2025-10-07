"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Edit, Trash2, FileText, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"

const mockClients = [
  {
    id: "1",
    name: "TechMart Inc.",
    email: "contact@techmart.com",
    phone: "+1 (555) 123-4567",
    company: "TechMart Inc.",
    status: "active",
    projects: 3,
    totalRevenue: 450000,
    lastContact: "2025-10-03",
  },
  {
    id: "2",
    name: "FinanceHub",
    email: "info@financehub.com",
    phone: "+1 (555) 234-5678",
    company: "FinanceHub Corp",
    status: "active",
    projects: 2,
    totalRevenue: 320000,
    lastContact: "2025-10-01",
  },
  {
    id: "3",
    name: "SalesPro",
    email: "hello@salespro.com",
    phone: "+1 (555) 345-6789",
    company: "SalesPro Ltd",
    status: "active",
    projects: 1,
    totalRevenue: 180000,
    lastContact: "2025-09-28",
  },
  {
    id: "4",
    name: "BrandCo",
    email: "contact@brandco.com",
    phone: "+1 (555) 456-7890",
    company: "BrandCo Agency",
    status: "inactive",
    projects: 0,
    totalRevenue: 95000,
    lastContact: "2025-08-15",
  },
]

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClients = mockClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()),
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
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<typeof filteredClients[0]>
          columns={[
            { key: 'client', header: 'Client', sortable: true, sortAccessor: (c:any)=>c.name, cell: (client:any) => (
              <div>
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-muted-foreground">{client.company}</div>
              </div>
            )},
            { key: 'contact', header: 'Contact', cell: (client:any) => (
              <div className="text-sm">
                <div>{client.email}</div>
                <div className="text-muted-foreground">{client.phone}</div>
              </div>
            )},
            { key: 'projects', header: 'Projects', sortable: true },
            { key: 'revenue', header: 'Revenue', sortable: true, sortAccessor: (c:any)=>c.totalRevenue, cell: (c:any)=> <span className="font-medium">${c.totalRevenue.toLocaleString()}</span> },
            { key: 'last', header: 'Last Contact', sortable: true, sortAccessor: (c:any)=>new Date(c.lastContact).getTime(), cell: (c:any)=> new Date(c.lastContact).toLocaleDateString() },
            { key: 'status', header: 'Status', cell: (c:any)=> getStatusBadge(c.status) },
            { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (client:any) => (
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
          data={filteredClients as any}
          getRowKey={(c:any)=>c.id}
          striped
          pageSize={10}
        />
      </CardContent>
    </Card>
  )
}
