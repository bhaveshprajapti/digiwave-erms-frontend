"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Eye, Download, Send, Trash2 } from "lucide-react"
import Link from "next/link"

const mockQuotations = [
  {
    id: "Q-2025-001",
    client: "TechMart Inc.",
    title: "E-commerce Platform Development",
    amount: 150000,
    status: "pending",
    validUntil: "2025-10-31",
    createdDate: "2025-10-01",
  },
  {
    id: "Q-2025-002",
    client: "FinanceHub",
    title: "Mobile Banking App",
    amount: 120000,
    status: "accepted",
    validUntil: "2025-10-15",
    createdDate: "2025-09-15",
  },
  {
    id: "Q-2025-003",
    client: "SalesPro",
    title: "CRM System Implementation",
    amount: 85000,
    status: "accepted",
    validUntil: "2025-09-30",
    createdDate: "2025-09-01",
  },
  {
    id: "Q-2025-004",
    client: "BrandCo",
    title: "Marketing Website Redesign",
    amount: 45000,
    status: "rejected",
    validUntil: "2025-09-20",
    createdDate: "2025-08-25",
  },
  {
    id: "Q-2025-005",
    client: "DataCorp",
    title: "Analytics Dashboard",
    amount: 95000,
    status: "pending",
    validUntil: "2025-11-15",
    createdDate: "2025-10-05",
  },
]

export function QuotationList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredQuotations = mockQuotations.filter((quote) => {
    const matchesSearch =
      quote.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || quote.status === activeTab

    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      accepted: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      rejected: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
      draft: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
    }
    const config = variants[status] || variants.pending
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
          <CardTitle>All Quotations</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.id}</TableCell>
                    <TableCell>{quote.client}</TableCell>
                    <TableCell>{quote.title}</TableCell>
                    <TableCell className="font-medium">${quote.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(quote.validUntil).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/quotations/${quote.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {quote.status === "pending" && (
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Send to Client
                            </DropdownMenuItem>
                          )}
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
