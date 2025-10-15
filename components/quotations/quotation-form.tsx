"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Client {
  id: number
  name: string
  email: string
  phone?: string
}

export function QuotationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [useExistingClient, setUseExistingClient] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, rate: 0, amount: 0 }])
  
  // Form data state
  const [formData, setFormData] = useState({
    // Client selection
    client: '',
    
    // Standalone client info
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    
    // Quotation details
    title: '',
    description: '',
    notes: '',
    terms_conditions: 'Payment Terms: 50% upfront, 50% upon completion\nDelivery: Within agreed timeline\nWarranty: 90 days post-delivery',
    
    // Dates
    valid_until: '',
    
    // Financial
    tax_rate: 10.0,
    discount: 0
  })

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [])
  
  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/clients/dropdown/')
      setClients(response.data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, rate: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate
    }
    setLineItems(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const tax = subtotal * (formData.tax_rate / 100)
  const total = subtotal + tax - formData.discount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare quotation data
      const quotationData = {
        // Client info - either linked client or standalone
        ...(useExistingClient && formData.client 
          ? { client: parseInt(formData.client) }
          : {
              client_name: formData.client_name,
              client_email: formData.client_email,
              client_phone: formData.client_phone,
              client_address: formData.client_address
            }
        ),
        
        // Quotation details
        title: formData.title,
        description: formData.description,
        notes: formData.notes,
        terms_conditions: formData.terms_conditions,
        valid_until: formData.valid_until,
        
        // Financial data
        line_items: lineItems,
        tax_rate: formData.tax_rate,
        discount: formData.discount
      }
      
      const response = await api.post('/clients/quotations/', quotationData)
      
      toast({
        title: "Success",
        description: `Quotation ${response.data.quotation_no} created successfully`,
      })
      
      router.push("/dashboard/quotations")
      
    } catch (error: any) {
      console.error('Error creating quotation:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create quotation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection Toggle */}
            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/20">
              <Switch
                id="useExistingClient"
                checked={useExistingClient}
                onCheckedChange={setUseExistingClient}
              />
              <Label htmlFor="useExistingClient" className="text-sm font-medium">
                Use existing client
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                {useExistingClient ? 'Select from existing clients' : 'Create quotation without linking to client'}
              </span>
            </div>

            {useExistingClient ? (
              /* Existing Client Selection */
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Select Client</Label>
                  <Select
                    value={formData.client}
                    onValueChange={(value) => handleInputChange('client', value)}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={(e) => handleInputChange('valid_until', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              /* Standalone Client Info */
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      placeholder="Enter client name"
                      required
                      value={formData.client_name}
                      onChange={(e) => handleInputChange('client_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="client@example.com"
                      value={formData.client_email}
                      onChange={(e) => handleInputChange('client_email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Client Phone</Label>
                    <Input
                      id="clientPhone"
                      placeholder="Enter phone number"
                      value={formData.client_phone}
                      onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      required
                      value={formData.valid_until}
                      onChange={(e) => handleInputChange('valid_until', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    placeholder="Enter client address"
                    rows={2}
                    value={formData.client_address}
                    onChange={(e) => handleInputChange('client_address', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Quotation Details */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quotation Title</Label>
                <Input
                  id="title"
                  placeholder="E-commerce Platform Development"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project scope"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or special instructions"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-5">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    placeholder="Service or product description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", Number.parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`rate-${index}`}>Rate</Label>
                  <Input
                    id={`rate-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateLineItem(index, "rate", Number.parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Amount</Label>
                  <div className="flex h-10 items-center font-medium">${item.amount.toFixed(2)}</div>
                </div>
                <div className="flex items-end md:col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount ($)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({formData.tax_rate}%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-red-600">-${formData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter payment terms, delivery schedule, and other conditions"
              rows={5}
              value={formData.terms_conditions}
              onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Quotation"}
          </Button>
        </div>
      </div>
    </form>
  )
}
