"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, MoreVertical, Eye, Download, Send, Trash2, Plus, Edit } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { quotationService } from '@/services/api'
import QuotationModal from './quotation-modal'

interface Quotation {
  id: number
  client?: number
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  quotation_number: string
  title: string
  description: string
  status: string
  issue_date: string
  expiry_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes: string
  terms_conditions: string
}

export function QuotationList() {
  const { toast } = useToast()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null)

  // Load quotations from API
  const loadQuotations = async () => {
    try {
      setIsLoading(true)
      const response = await quotationService.list()
      setQuotations(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to load quotations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quotations',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load quotations on component mount
  useEffect(() => {
    loadQuotations()
  }, [])

  const filteredQuotations = quotations.filter((quote) => {
    const matchesSearch =
      quote.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || quote.status === activeTab

    return matchesSearch && matchesTab
  })

  // Handle modal actions
  const handleAddQuotation = () => {
    setSelectedQuotation(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDeleteQuotation = (quotation: Quotation) => {
    setQuotationToDelete(quotation)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!quotationToDelete) return

    try {
      await quotationService.delete(quotationToDelete.id)
      toast({
        title: 'Success',
        description: 'Quotation deleted successfully',
      })
      loadQuotations() // Refresh the list
    } catch (error) {
      console.error('Failed to delete quotation:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete quotation',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setQuotationToDelete(null)
    }
  }

  const handleRefresh = () => {
    loadQuotations()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      draft: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
      sent: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      accepted: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      rejected: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
      expired: { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200" },
    }
    const config = variants[status] || variants.draft
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Quotations</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddQuotation}>
              <Plus className="mr-2 h-4 w-4" />
              Add Quotation
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading quotations...
                    </TableCell>
                  </TableRow>
                ) : filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No quotations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quotation_number}</TableCell>
                      <TableCell>{quote.client_name || 'No client'}</TableCell>
                      <TableCell>{quote.title}</TableCell>
                      <TableCell className="font-medium">${quote.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString() : 'No expiry'}
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditQuotation(quote)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            {quote.status === "draft" && (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                Send to Client
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteQuotation(quote)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    
    {/* Quotation Modal */}
    <QuotationModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      quotation={selectedQuotation}
      mode={modalMode}
      onSuccess={handleRefresh}
    />
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the quotation
            "{quotationToDelete?.quotation_number}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
