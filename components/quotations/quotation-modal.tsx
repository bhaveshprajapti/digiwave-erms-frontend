'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { Plus, Trash2, Building, User, DollarSign, Server, Receipt, UserCheck } from 'lucide-react'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  gst_number: string
  website: string
  rating: number
  address_info: string | null
  is_active: boolean
  created_at: string
}

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

interface Quotation {
  id?: number
  client?: number
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  quotation_no: string
  date: string
  valid_until: string
  prepared_by?: number
  lead_source?: string

  // Service items
  service_items: ServiceItem[]

  // Hosting details
  domain_registration: HostingItem
  server_hosting: HostingItem
  ssl_certificate: HostingItem
  email_hosting: HostingItem

  // Financial
  discount_type: 'none' | 'flat' | 'percent'
  discount_value: number
  tax_rate: number
  grand_total: number

  // Additional info
  payment_terms?: string
  additional_notes?: string
  signatory_name?: string
  signatory_designation?: string
  signature?: File | null

  status: string
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  username: string
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serviceRowCounter, setServiceRowCounter] = useState(1)

  const [formData, setFormData] = useState<Partial<Quotation>>({
    client: undefined,
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    quotation_no: '',
    date: new Date().toISOString().split('T')[0],
    valid_until: '',
    prepared_by: undefined,
    lead_source: '',
    service_items: [{
      id: '1',
      category: '',
      description: '',
      quantity: 1,
      unit_price: 0
    }],
    domain_registration: { included: false, duration: '', unit_price: 0 },
    server_hosting: { included: false, duration: '', unit_price: 0 },
    ssl_certificate: { included: false, duration: '', unit_price: 0 },
    email_hosting: { included: false, duration: '', unit_price: 0 },
    discount_type: 'none',
    discount_value: 0,
    tax_rate: 0,
    grand_total: 0,
    payment_terms: '',
    additional_notes: '',
    signatory_name: '',
    signatory_designation: '',
    signature: null,
    status: 'draft'
  })

  // Load clients and employees for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load clients
        try {
          const clientsResponse = await apiService.get('/clients/clients/')
          const clientsData = Array.isArray(clientsResponse?.data?.results)
            ? clientsResponse.data.results
            : Array.isArray(clientsResponse?.data)
              ? clientsResponse.data
              : []
          setClients(clientsData)
        } catch (error) {
          console.error('Failed to load clients:', error)
          setClients([])
        }

        // Load employees
        try {
          const employeesResponse = await apiService.get('/accounts/users/')
          const employeesData = Array.isArray(employeesResponse?.data?.results)
            ? employeesResponse.data.results
            : Array.isArray(employeesResponse?.data)
              ? employeesResponse.data
              : []
          setEmployees(employeesData)
        } catch (error) {
          console.error('Failed to load employees:', error)
          setEmployees([])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        setClients([])
        setEmployees([])
        toast({
          title: "Error",
          description: "Failed to load clients and employees",
          variant: "destructive"
        })
      }
    }
    if (isOpen) {
      loadData()
    }
  }, [isOpen, toast])

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && quotation) {
        console.log('Loading quotation for edit:', quotation)
        setFormData({
          ...quotation,
          date: quotation.date ? quotation.date.split('T')[0] : new Date().toISOString().split('T')[0],
          valid_until: quotation.valid_until ? quotation.valid_until.split('T')[0] : '',
          service_items: quotation.service_items || [{
            id: '1',
            category: '',
            description: '',
            quantity: 1,
            unit_price: 0
          }],
          domain_registration: quotation.domain_registration || { included: false, duration: '', unit_price: 0 },
          server_hosting: quotation.server_hosting || { included: false, duration: '', unit_price: 0 },
          ssl_certificate: quotation.ssl_certificate || { included: false, duration: '', unit_price: 0 },
          email_hosting: quotation.email_hosting || { included: false, duration: '', unit_price: 0 },
          discount_type: quotation.discount_type || 'none',
          discount_value: quotation.discount_value || 0,
          tax_rate: quotation.tax_rate || 0,
        })
        setServiceRowCounter(quotation.service_items?.length || 1)
      } else {
        // Generate quotation number for new quotations
        const generateQuotationNo = async () => {
          try {
            const response = await apiService.get('/quotations/next-number/')
            return response.data.quotation_no
          } catch (error) {
            console.error('Failed to generate quotation number:', error)
            // Generate a fallback quotation number with IST date and unique combination
            const now = new Date()

            // Convert to IST (UTC+5:30)
            const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
            const istTime = new Date(now.getTime() + istOffset)

            // Format: DDMMYYYY
            const day = istTime.getUTCDate().toString().padStart(2, '0')
            const month = (istTime.getUTCMonth() + 1).toString().padStart(2, '0')
            const year = istTime.getUTCFullYear()
            const dateStr = `${day}${month}${year}`

            // Generate unique number (timestamp + random)
            const timestamp = istTime.getTime().toString().slice(-4)
            const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
            const uniqueNum = `${timestamp}${random}`

            // Format: QT-DW-DDMMYYYY-XXXXXX
            return `QT-DW-${dateStr}-${uniqueNum}`
          }
        }

        generateQuotationNo().then(quotationNo => {
          setFormData({
            client: undefined,
            client_name: '',
            client_email: '',
            client_phone: '',
            client_address: '',
            quotation_no: quotationNo,
            date: new Date().toISOString().split('T')[0],
            valid_until: '',
            prepared_by: undefined,
            lead_source: '',
            service_items: [{
              id: '1',
              category: '',
              description: '',
              quantity: 1,
              unit_price: 0
            }],
            domain_registration: { included: false, duration: '', unit_price: 0 },
            server_hosting: { included: false, duration: '', unit_price: 0 },
            ssl_certificate: { included: false, duration: '', unit_price: 0 },
            email_hosting: { included: false, duration: '', unit_price: 0 },
            discount_type: 'none',
            discount_value: 0,
            tax_rate: 0,
            grand_total: 0,
            payment_terms: '',
            additional_notes: '',
            signatory_name: '',
            signatory_designation: '',
            signature: null,
            status: 'draft'
          })
        })
      }
      setErrors({})
      setServiceRowCounter(1)
    }
  }, [isOpen, mode, quotation])

  // Calculate totals when relevant fields change
  useEffect(() => {
    const calculateTotal = () => {
      let subtotal = 0

      // Calculate service items total
      if (formData.service_items) {
        subtotal += formData.service_items.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price)
        }, 0)
      }

      // Add hosting items if included
      if (formData.domain_registration?.included) {
        subtotal += formData.domain_registration.unit_price || 0
      }
      if (formData.server_hosting?.included) {
        subtotal += formData.server_hosting.unit_price || 0
      }
      if (formData.ssl_certificate?.included) {
        subtotal += formData.ssl_certificate.unit_price || 0
      }
      if (formData.email_hosting?.included) {
        subtotal += formData.email_hosting.unit_price || 0
      }

      // Apply discount
      let discountAmount = 0
      if (formData.discount_type === 'flat') {
        discountAmount = formData.discount_value || 0
      } else if (formData.discount_type === 'percent') {
        discountAmount = (subtotal * (formData.discount_value || 0)) / 100
      }

      const afterDiscount = subtotal - discountAmount
      const taxAmount = (afterDiscount * (formData.tax_rate || 0)) / 100
      const grandTotal = afterDiscount + taxAmount

      setFormData(prev => ({
        ...prev,
        grand_total: grandTotal
      }))
    }

    calculateTotal()
  }, [
    formData.service_items,
    formData.domain_registration,
    formData.server_hosting,
    formData.ssl_certificate,
    formData.email_hosting,
    formData.discount_type,
    formData.discount_value,
    formData.tax_rate
  ])

  const handleInputChange = (field: keyof Quotation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClientChange = (clientId: string) => {
    if (clientId === 'none' || clientId === '') {
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
          client_address: selectedClient.address_info || ''
        }))
      }
    }
  }

  const addServiceRow = () => {
    const newCounter = serviceRowCounter + 1
    setServiceRowCounter(newCounter)

    setFormData(prev => ({
      ...prev,
      service_items: [
        ...(prev.service_items || []),
        {
          id: newCounter.toString(),
          category: '',
          description: '',
          quantity: 1,
          unit_price: 0
        }
      ]
    }))
  }

  const removeServiceRow = (id: string) => {
    setFormData(prev => ({
      ...prev,
      service_items: prev.service_items?.filter(item => item.id !== id) || []
    }))
  }

  const updateServiceItem = (id: string, field: keyof ServiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      service_items: prev.service_items?.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ) || []
    }))
  }

  const updateHostingItem = (type: 'domain_registration' | 'server_hosting' | 'ssl_certificate' | 'email_hosting', field: keyof HostingItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.quotation_no?.trim()) {
      newErrors.quotation_no = 'Quotation number is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required'
    }

    // If no client is selected, require manual client info
    if (!formData.client) {
      if (!formData.client_name?.trim()) {
        newErrors.client_name = 'Client name is required when no client is selected'
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
      // Prepare data for submission
      const submitData: any = {
        ...formData,
      }

      // Remove fields that shouldn't be sent or are handled separately
      delete submitData.signature // Handle signature separately if needed
      delete submitData.status // Backend handles status
      delete submitData.id // Don't send ID in update

      console.log('Submitting quotation data:', submitData)

      if (mode === 'add') {
        await apiService.post('/quotations/', submitData)
        toast({
          title: 'Success',
          description: 'Quotation created successfully',
        })
      } else {
        await apiService.put(`/quotations/${quotation!.id}/`, submitData)
        toast({
          title: 'Success',
          description: 'Quotation updated successfully',
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting quotation:', error)

      // Handle field-specific errors
      if (error.response?.data) {
        const serverErrors = error.response.data
        if (typeof serverErrors === 'object') {
          setErrors(serverErrors)

          // Show specific error messages
          const errorMessages = Object.entries(serverErrors)
            .map(([field, messages]: [string, any]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              const errorMsg = Array.isArray(messages) ? messages[0] : messages
              return `${fieldName}: ${errorMsg}`
            })
            .join('\n')

          toast({
            title: 'Validation Error',
            description: errorMessages || 'Please check the form for errors',
            variant: 'destructive',
          })
          return
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
      <DialogContent className="!max-w-7xl w-[98vw] max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="bg-white text-gray-900 p-4 border-b border-gray-200 sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {mode === 'add' ? 'Add New Quotation' : 'Edit Quotation'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'add' ? 'Create a new quotation with client details, services, and pricing' : 'Update quotation details including client information, services, and pricing'}
          </DialogDescription>
        </DialogHeader>

        <form id="quotation-form" onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-240px)] p-6">
          <div className="w-full">
            <table className="w-full border border-gray-300 table-fixed">
              <colgroup>
                <col className="w-1/6" />
                <col className="w-1/3" />
                <col className="w-1/6" />
                <col className="w-1/3" />
              </colgroup>
              <tbody>
                {/* Company Details */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Details
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300 w-1/6">Company Name</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Input value="DigiWave Technologies" readOnly className="bg-gray-100" />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Company Address</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Textarea value="Ashram Road, Ahmedabad" readOnly className="bg-gray-100" rows={2} />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Company Phone</th>
                  <td className="p-3 border-r border-gray-300">
                    <Input value="9624185617" readOnly className="bg-gray-100" />
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Company Email</th>
                  <td className="p-3 border-gray-300">
                    <Input value="hello.digiwave@gmail.com" readOnly className="bg-gray-100" />
                  </td>
                </tr>

                {/* Client Information */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Client Information
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Quotation No</th>
                  <td className="p-3 border-r border-gray-300">
                    <Input
                      value={formData.quotation_no || ''}
                      readOnly
                      className="bg-gray-100"
                    />
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Date</th>
                  <td className="p-3 border-gray-300">
                    <DatePicker
                      value={formData.date ? new Date(formData.date) : undefined}
                      onChange={(date) => handleInputChange('date', date?.toISOString().split('T')[0] || '')}
                      placeholder="Select date"
                      useIST={true}
                      className={errors.date ? 'border-red-500' : ''}
                    />
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Valid Until</th>
                  <td className="p-3 border-r border-gray-300">
                    <DatePicker
                      value={formData.valid_until ? new Date(formData.valid_until) : undefined}
                      onChange={(date) => handleInputChange('valid_until', date?.toISOString().split('T')[0] || '')}
                      placeholder="Valid until"
                      useIST={true}
                      minDate={new Date()}
                      className={errors.valid_until ? 'border-red-500' : ''}
                    />
                    {errors.valid_until && <p className="text-red-500 text-sm mt-1">{errors.valid_until}</p>}
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Prepared By</th>
                  <td className="p-3 border-gray-300">
                    <Select
                      value={formData.prepared_by?.toString() || 'none'}
                      onValueChange={(value) => handleInputChange('prepared_by', value === 'none' ? undefined : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select Employee</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.first_name && employee.last_name
                              ? `${employee.first_name} ${employee.last_name}`
                              : employee.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Select Client</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Select
                      value={formData.client?.toString() || 'none'}
                      onValueChange={handleClientChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client (optional)" />
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
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Client Name</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Input
                      value={formData.client_name || ''}
                      onChange={(e) => handleInputChange('client_name', e.target.value)}
                      placeholder="Enter client name"
                      disabled={!!formData.client}
                      className={formData.client ? 'bg-gray-100' : (errors.client_name ? 'border-red-500' : '')}
                    />
                    {errors.client_name && <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Client Contact</th>
                  <td className="p-3 border-r border-gray-300">
                    <Input
                      value={formData.client_phone || ''}
                      onChange={(e) => handleInputChange('client_phone', e.target.value)}
                      placeholder="Enter client contact"
                      disabled={!!formData.client}
                      className={formData.client ? 'bg-gray-100' : ''}
                    />
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Client Address</th>
                  <td className="p-3 border-gray-300">
                    <Textarea
                      value={formData.client_address || ''}
                      onChange={(e) => handleInputChange('client_address', e.target.value)}
                      placeholder="Enter client address"
                      rows={2}
                      disabled={!!formData.client}
                      className={formData.client ? 'bg-gray-100' : ''}
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Lead Source</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Input
                      value={formData.lead_source || ''}
                      onChange={(e) => handleInputChange('lead_source', e.target.value)}
                      placeholder="Enter lead source"
                    />
                  </td>
                </tr>

                {/* Service Charges */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Service Charges
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addServiceRow}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add item
                      </Button>
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="p-3 border-r border-gray-300">Category</th>
                  <th className="p-3 border-r border-gray-300">Description</th>
                  <th className="p-3 border-r border-gray-300">Quantity</th>
                  <th className="p-3 border-gray-300">Unit Price (₹)</th>
                </tr>
                {formData.service_items?.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="p-3 border-r border-gray-300">
                      <Select
                        value={item.category || 'none'}
                        onValueChange={(value) => updateServiceItem(item.id, 'category', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Select --</SelectItem>
                          <SelectItem value="web">Web Development</SelectItem>
                          <SelectItem value="mobile">Mobile Development</SelectItem>
                          <SelectItem value="cloud">Cloud Services</SelectItem>
                          <SelectItem value="ai_ml">AI/ML Algorithms</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 border-r border-gray-300">
                      <Input
                        value={item.description}
                        onChange={(e) => updateServiceItem(item.id, 'description', e.target.value)}
                        placeholder="Enter description"
                      />
                    </td>
                    <td className="p-3 border-r border-gray-300">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateServiceItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                      />
                    </td>
                    <td className="p-3 border-gray-300">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateServiceItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="Unit price"
                        />
                        {formData.service_items && formData.service_items.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeServiceRow(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Server & Domain Charges */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Server & Domain Charges
                    </div>
                  </th>
                </tr>
                {[
                  { key: 'domain_registration', label: 'Domain Registration' },
                  { key: 'server_hosting', label: 'Server Hosting' },
                  { key: 'ssl_certificate', label: 'SSL Certificate' },
                  { key: 'email_hosting', label: 'Email Hosting' }
                ].map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-300">
                    <th className="p-3 bg-gray-50 border-r border-gray-300">{label}</th>
                    <td colSpan={3} className="p-3 border-gray-300">
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={(formData[key as keyof Quotation] as HostingItem)?.included ? 'true' : 'false'}
                          onValueChange={(value) => updateHostingItem(key as any, 'included', value === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={(formData[key as keyof Quotation] as HostingItem)?.duration || ''}
                          onChange={(e) => updateHostingItem(key as any, 'duration', e.target.value)}
                          placeholder="Duration"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(formData[key as keyof Quotation] as HostingItem)?.unit_price || ''}
                          onChange={(e) => updateHostingItem(key as any, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="Price (₹)"
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Summary */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Summary
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Discount Type</th>
                  <td className="p-3 border-r border-gray-300">
                    <Select
                      value={formData.discount_type || 'none'}
                      onValueChange={(value) => handleInputChange('discount_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Discount Value</th>
                  <td className="p-3 border-gray-300">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_value || ''}
                      onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
                      placeholder="Enter value"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Tax Rate (%)</th>
                  <td className="p-3 border-r border-gray-300">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax_rate || ''}
                      onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                      placeholder="Enter tax rate"
                    />
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Grand Total</th>
                  <td className="p-3 border-gray-300">
                    <Input
                      value={`₹${typeof formData.grand_total === 'number' ? formData.grand_total.toFixed(2) : Number(formData.grand_total || 0).toFixed(2)}`}
                      readOnly
                      className="bg-gray-100 font-semibold"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Payment Terms</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Textarea
                      value={formData.payment_terms || ''}
                      onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                      placeholder="Enter payment terms"
                      rows={2}
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Additional Notes</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <Textarea
                      value={formData.additional_notes || ''}
                      onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                      placeholder="Enter additional notes"
                      rows={2}
                    />
                  </td>
                </tr>

                {/* Authorized Signatory */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Authorized Signatory
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Name</th>
                  <td className="p-3 border-r border-gray-300">
                    <Input
                      value={formData.signatory_name || ''}
                      onChange={(e) => handleInputChange('signatory_name', e.target.value)}
                      placeholder="Enter name"
                    />
                  </td>
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Designation</th>
                  <td className="p-3 border-gray-300">
                    <Input
                      value={formData.signatory_designation || ''}
                      onChange={(e) => handleInputChange('signatory_designation', e.target.value)}
                      placeholder="Enter designation"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="p-3 bg-gray-50 border-r border-gray-300">Signature</th>
                  <td colSpan={3} className="p-3 border-gray-300">
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
                        onChange={(e) => handleInputChange('signature', e.target.files?.[0] || null)}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {formData.signature && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-sm text-green-600">
                            Selected: {formData.signature.name} ({(formData.signature.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Upload signature image (PNG, JPG, JPEG, GIF, WebP - Max 5MB)
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-300 p-4 flex justify-end gap-4">
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
            form="quotation-form"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Quotation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuotationModal