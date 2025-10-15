'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { quotationService, clientService } from '@/services/api'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  gst_number: string
  website: string
  rating: number
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  country: string
  postal_code: string
}

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

interface QuotationModalProps {
  isOpen: boolean
  onClose: () => void
  quotation?: Quotation | null
  mode: 'add' | 'edit'
  onSuccess: () => void
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  quotation,
  mode,
  onSuccess
}) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Partial<Quotation>>({
    client: undefined,
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    quotation_number: '',
    title: '',
    description: '',
    status: 'draft',
    issue_date: '',
    expiry_date: '',
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    notes: '',
    terms_conditions: ''
  })

  // Load clients for dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientService.list()
        setClients(response.data.results || response.data || [])
      } catch (error) {
        console.error('Failed to load clients:', error)
      }
    }
    if (isOpen) {
      loadClients()
    }
  }, [isOpen])

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && quotation) {
        setFormData({
          ...quotation,
          issue_date: quotation.issue_date ? quotation.issue_date.split('T')[0] : '',
          expiry_date: quotation.expiry_date ? quotation.expiry_date.split('T')[0] : ''
        })
      } else {
        setFormData({
          client: undefined,
          client_name: '',
          client_email: '',
          client_phone: '',
          client_address: '',
          quotation_number: '',
          title: '',
          description: '',
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          subtotal: 0,
          tax_rate: 0,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: 0,
          notes: '',
          terms_conditions: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, mode, quotation])

  // Calculate totals when relevant fields change
  useEffect(() => {
    const subtotal = formData.subtotal || 0
    const taxRate = formData.tax_rate || 0
    const discountAmount = formData.discount_amount || 0
    
    const taxAmount = (subtotal * taxRate) / 100
    const totalAmount = subtotal + taxAmount - discountAmount
    
    setFormData(prev => ({
      ...prev,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }))
  }, [formData.subtotal, formData.tax_rate, formData.discount_amount])

  const handleInputChange = (field: keyof Quotation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClientChange = (clientId: string) => {
    if (clientId === 'none') {
      setFormData(prev => ({
        ...prev,
        client: undefined,
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: ''
      }))
    } else {
      const selectedClient = clients.find(c => c.id.toString() === clientId)
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          client: selectedClient.id,
          client_name: selectedClient.name,
          client_email: selectedClient.email,
          client_phone: selectedClient.phone,
          client_address: `${selectedClient.address_line_1}, ${selectedClient.city}, ${selectedClient.state} ${selectedClient.postal_code}`
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.quotation_number?.trim()) {
      newErrors.quotation_number = 'Quotation number is required'
    }

    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required'
    }

    // If no client is selected, require manual client info
    if (!formData.client) {
      if (!formData.client_name?.trim()) {
        newErrors.client_name = 'Client name is required when no client is selected'
      }
      if (!formData.client_email?.trim()) {
        newErrors.client_email = 'Client email is required when no client is selected'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = { ...formData }
      
      if (mode === 'add') {
        await quotationService.create(submitData)
        toast({
          title: 'Success',
          description: 'Quotation created successfully',
        })
      } else {
        await quotationService.update(quotation!.id, submitData)
        toast({
          title: 'Success',
          description: 'Quotation updated successfully',
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting quotation:', error)
      if (error.response?.data) {
        const serverErrors = error.response.data
        if (typeof serverErrors === 'object') {
          setErrors(serverErrors)
        }
      }
      toast({
        title: 'Error',
        description: mode === 'add' ? 'Failed to create quotation' : 'Failed to update quotation',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Quotation' : 'Edit Quotation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quotation_number">Quotation Number *</Label>
              <Input
                id="quotation_number"
                value={formData.quotation_number || ''}
                onChange={(e) => handleInputChange('quotation_number', e.target.value)}
                className={errors.quotation_number ? 'border-red-500' : ''}
              />
              {errors.quotation_number && (
                <p className="text-red-500 text-sm">{errors.quotation_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'draft'}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date || ''}
                onChange={(e) => handleInputChange('issue_date', e.target.value)}
                className={errors.issue_date ? 'border-red-500' : ''}
              />
              {errors.issue_date && (
                <p className="text-red-500 text-sm">{errors.issue_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date || ''}
                onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="client">Select Client (Optional)</Label>
              <Select
                value={formData.client?.toString() || 'none'}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Client Selected</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manual client fields when no client selected */}
            {!formData.client && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name || ''}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={errors.client_name ? 'border-red-500' : ''}
                  />
                  {errors.client_name && (
                    <p className="text-red-500 text-sm">{errors.client_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email || ''}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    className={errors.client_email ? 'border-red-500' : ''}
                  />
                  {errors.client_email && (
                    <p className="text-red-500 text-sm">{errors.client_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Client Phone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone || ''}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_address">Client Address</Label>
                  <Textarea
                    id="client_address"
                    value={formData.client_address || ''}
                    onChange={(e) => handleInputChange('client_address', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={formData.subtotal || ''}
                  onChange={(e) => handleInputChange('subtotal', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={formData.tax_rate || ''}
                  onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_amount">Tax Amount (Calculated)</Label>
                <Input
                  id="tax_amount"
                  type="number"
                  step="0.01"
                  value={formData.tax_amount || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_amount">Discount Amount</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  value={formData.discount_amount || ''}
                  onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="total_amount">Total Amount (Calculated)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount || ''}
                  disabled
                  className="bg-gray-100 font-semibold text-lg"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_conditions"
                value={formData.terms_conditions || ''}
                onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Saving...' : (mode === 'add' ? 'Create' : 'Update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default QuotationModal