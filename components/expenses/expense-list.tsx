"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Eye, Edit, Trash2, Receipt } from "lucide-react"
import Link from "next/link"

const mockExpenses = [
  {
    id: "1",
    description: "Office Supplies",
    category: "Office",
    amount: 450,
    date: "2025-10-05",
    submittedBy: "John Doe",
    status: "approved",
    receipt: true,
  },
  {
    id: "2",
    description: "Client Dinner Meeting",
    category: "Travel",
    amount: 280,
    date: "2025-10-04",
    submittedBy: "Sarah Chen",
    status: "pending",
    receipt: true,
  },
  {
    id: "3",
    description: "Software License",
    category: "Software",
    amount: 1200,
    date: "2025-10-03",
    submittedBy: "Mike Chen",
    status: "approved",
    receipt: true,
  },
  {
    id: "4",
    description: "Marketing Materials",
    category: "Marketing",
    amount: 850,
    date: "2025-10-02",
    submittedBy: "Emily Davis",
    status: "approved",
    receipt: false,
  },
  {
    id: "5",
    description: "Team Building Event",
    category: "HR",
    amount: 2400,
    date: "2025-10-01",
    submittedBy: "John Doe",
    status: "rejected",
    receipt: true,
  },
]

export function ExpenseList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredExpenses = mockExpenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || expense.status === activeTab

    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      approved: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      rejected: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
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
          <CardTitle>All Expenses</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
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
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.submittedBy}</TableCell>
                    <TableCell>
                      {expense.receipt ? (
                        <Receipt className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/expenses/${expense.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {expense.status === "pending" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
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
