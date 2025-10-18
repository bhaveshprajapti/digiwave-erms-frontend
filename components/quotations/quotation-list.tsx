"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, Plus, Download, Send } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import QuotationModal from './quotation-modal'
import QuotationViewModal from './quotation-view-modal'

interface ServiceItem {
  id: string
  category: string
  description: string
  quantity: number
  unit_price: number
}

interface HostingItem {
  included: boolean
  duration: string
  unit_price: number
}

interface ClientInfo {
  name?: string
  email?: string
  phone?: string
  address?: string
}

interface Quotation {
  id: number
  client?: number
  client_info?: ClientInfo
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  company_name?: string
  quotation_no?: string
  quotation_number?: string
  title?: string
  description?: string
  status?: string
  date?: string
  valid_until?: string
  issue_date?: string
  expiry_date?: string
  created_at?: string
  updated_at?: string
  subtotal?: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount?: number
  grand_total?: number
  notes?: string
  terms_conditions?: string

  // Additional fields for modal compatibility
  service_items?: ServiceItem[]
  domain_registration?: HostingItem
  server_hosting?: HostingItem
  ssl_certificate?: HostingItem
  email_hosting?: HostingItem
  discount_type?: 'none' | 'flat' | 'percent'
  discount_value?: number
  payment_terms?: string
  additional_notes?: string
  signatory_name?: string
  signatory_designation?: string
  prepared_by?: number
  lead_source?: string
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
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewQuotationId, setViewQuotationId] = useState<number | null>(null)

  // Load quotations from API
  const loadQuotations = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.get('/quotations/')
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
    const clientName = quote.client_info?.name || quote.client_name || ''
    const clientEmail = quote.client_info?.email || quote.client_email || ''

    const matchesSearch =
      (quote.quotation_no || quote.quotation_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientEmail.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || quote.status?.toLowerCase() === activeTab.toLowerCase()

    return matchesSearch && matchesTab
  })

  // Handle modal actions
  const handleAddQuotation = () => {
    setSelectedQuotation(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleEditQuotation = async (quotation: Quotation) => {
    try {
      // Fetch full quotation details for editing
      const response = await apiService.get(`/quotations/${quotation.id}/`)
      setSelectedQuotation(response.data)
      setModalMode('edit')
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch quotation details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quotation details for editing',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteQuotation = (quotation: Quotation) => {
    setQuotationToDelete(quotation)
    setDeleteDialogOpen(true)
  }

  const handleViewQuotation = (quotationId: number) => {
    setViewQuotationId(quotationId)
    setViewModalOpen(true)
  }

  // PDF download handler - Direct download
  const handleDownloadPDF = async (quotationId: number) => {
    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait...',
      })

      // Fetch full quotation details
      const response = await apiService.get(`/quotations/${quotationId}/`)
      const quotationData = response.data

      // Import the PDF generation function dynamically
      const { generateAndDownloadQuotationPDF } = await import('@/lib/pdf-utils')
      
      // Generate and download PDF
      await generateAndDownloadQuotationPDF(quotationData)

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      })
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'destructive',
      })
    }
  }

  const confirmDelete = async () => {
    if (!quotationToDelete) return

    try {
      await apiService.delete(`/quotations/${quotationToDelete.id}/`)
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

  const getStatusBadge = (status: string | null | undefined) => {
    const safeStatus = status || 'draft'
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      draft: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
      sent: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      accepted: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      rejected: { variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
      expired: { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200" },
    }
    const config = variants[safeStatus] || variants.draft
    return (
      <Badge variant={config.variant} className={config.className}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">Quotations</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleAddQuotation} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Quotation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList> */}

            <TabsContent value={activeTab} className="mt-4">
              <DataTable<Quotation>
                columns={[
                  {
                    key: 'sr',
                    header: 'Sr No.',
                    cell: (_q, i) => <span className="font-medium">{i + 1}</span>,
                    className: 'w-16'
                  },
                  {
                    key: 'quotation_no',
                    header: 'Quotation No.',
                    cell: (q) => (
                      <button
                        onClick={() => handleViewQuotation(q.id)}
                        className="font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                      >
                        {q.quotation_no || q.quotation_number || 'N/A'}
                      </button>
                    )
                  },
                  {
                    key: 'client_name',
                    header: 'Client Name',
                    cell: (q) => {
                      const clientName = q.client_info?.name || q.client_name || 'No client'
                      const clientEmail = q.client_info?.email || q.client_email
                      return (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{clientName}</span>
                          {clientEmail && (
                            <span className="text-xs text-muted-foreground">{clientEmail}</span>
                          )}
                        </div>
                      )
                    }
                  },
                  {
                    key: 'date',
                    header: 'Issue Date',
                    cell: (q) => {
                      const dateValue = q.date || q.issue_date || q.created_at
                      return (
                        <span className="text-sm">
                          {dateValue ? new Date(dateValue).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : 'No date'}
                        </span>
                      )
                    }
                  },
                  {
                    key: 'valid_until',
                    header: 'Valid Until',
                    cell: (q) => (
                      <span className="text-sm">
                        {q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'No expiry'}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (q) => getStatusBadge(q.status)
                  },
                  {
                    key: 'actions',
                    header: <span className="block text-center">Actions</span>,
                    cell: (quote) => (
                      <div className="flex items-center justify-center">
                        <ActionButtons
                          onEdit={() => handleEditQuotation(quote)}
                          onDelete={() => handleDeleteQuotation(quote)}
                          extras={[
                            {
                              title: 'Download PDF',
                              onClick: () => handleDownloadPDF(quote.id),
                              className: 'hover:bg-green-100',
                              icon: <Download className="h-4 w-4 text-green-600" />
                            },
                            ...(quote.status === "draft" ? [{
                              title: 'Send to Client',
                              onClick: () => { },
                              className: 'hover:bg-purple-100',
                              icon: <Send className="h-4 w-4 text-purple-600" />
                            }] : [])
                          ]}
                        />
                      </div>
                    )
                  },
                ]}
                data={filteredQuotations}
                getRowKey={(q) => q.id.toString()}
                striped
                emptyText="No quotations found."
                loading={isLoading}
                pageSize={10}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quotation Modal */}
      <QuotationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        quotation={selectedQuotation as any}
        mode={modalMode}
        onSuccess={handleRefresh}
      />

      {/* View Quotation Modal */}
      <QuotationViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setViewQuotationId(null)
        }}
        quotationId={viewQuotationId}
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
