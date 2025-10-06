"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Eye, Edit, Trash2, FileText } from "lucide-react"
import Link from "next/link"

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.company}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{client.email}</div>
                    <div className="text-muted-foreground">{client.phone}</div>
                  </div>
                </TableCell>
                <TableCell>{client.projects}</TableCell>
                <TableCell className="font-medium">${client.totalRevenue.toLocaleString()}</TableCell>
                <TableCell>{new Date(client.lastContact).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(client.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/quotations/new?client=${client.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Create Quote
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/clients/${client.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
