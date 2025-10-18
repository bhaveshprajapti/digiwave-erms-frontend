'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'

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

interface QuotationDetails {
  id: number
  quotation_no: string
  date: string
  valid_until: string
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  service_items: ServiceItem[]
  domain_registration: HostingItem
  server_hosting: HostingItem
  ssl_certificate: HostingItem
  email_hosting: HostingItem
  discount_type: 'none' | 'flat' | 'percent'
  discount_value: number
  tax_rate: number
  grand_total: number
  payment_terms?: string
  additional_notes?: string
  signatory_name?: string
  signatory_designation?: string
  status: string
}

interface QuotationViewModalProps {
  isOpen: boolean
  onClose: () => void
  quotationId: number | null
}

const QuotationViewModal: React.FC<QuotationViewModalProps> = ({
  isOpen,
  onClose,
  quotationId,
}) => {
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && quotationId) {
      loadQuotationDetails()
    }
  }, [isOpen, quotationId])

  const loadQuotationDetails = async () => {
    if (!quotationId) return

    try {
      setIsLoading(true)
      const response = await apiService.get(`/quotations/${quotationId}/`)
      setQuotation(response.data)
    } catch (error) {
      console.error('Failed to load quotation details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quotation details',
        variant: 'destructive',
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const calculateServiceTotal = () => {
    if (!quotation) return 0
    return quotation.service_items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    )
  }

  const calculateInfraTotal = () => {
    if (!quotation) return 0
    let total = 0
    if (quotation.domain_registration?.included) {
      total += quotation.domain_registration.unit_price
    }
    if (quotation.server_hosting?.included) {
      total += quotation.server_hosting.unit_price
    }
    if (quotation.ssl_certificate?.included) {
      total += quotation.ssl_certificate.unit_price
    }
    if (quotation.email_hosting?.included) {
      total += quotation.email_hosting.unit_price
    }
    return total
  }

  const calculateSubtotal = () => {
    return calculateServiceTotal() + calculateInfraTotal()
  }

  const calculateDiscount = () => {
    if (!quotation) return 0
    const subtotal = calculateSubtotal()
    if (quotation.discount_type === 'flat') {
      return quotation.discount_value
    } else if (quotation.discount_type === 'percent') {
      return (subtotal * quotation.discount_value) / 100
    }
    return 0
  }

  const calculateTax = () => {
    if (!quotation) return 0
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    return ((subtotal - discount) * quotation.tax_rate) / 100
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary font-bold text-xl">
              {quotation?.quotation_no || 'Loading...'}
            </span>
            {quotation && getStatusBadge(quotation.status)}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : quotation ? (
          <div className="space-y-4">
            {/* Company & Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company & Client Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Quotation No:</span>{' '}
                      <span>{quotation.quotation_no}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Date:</span>{' '}
                      <span>{new Date(quotation.date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Valid Until:</span>{' '}
                      <span>{new Date(quotation.valid_until).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Client Name:</span>{' '}
                      <span>{quotation.client_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Client Contact:</span>{' '}
                      <span>{quotation.client_phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Client Email:</span>{' '}
                      <span>{quotation.client_email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Client Address:</span>{' '}
                      <span>{quotation.client_address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Charges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Service Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-2 font-semibold">Sr.</th>
                        <th className="text-left p-2 font-semibold">Category</th>
                        <th className="text-left p-2 font-semibold">Description</th>
                        <th className="text-right p-2 font-semibold">Qty</th>
                        <th className="text-right p-2 font-semibold">Unit Price (₹)</th>
                        <th className="text-right p-2 font-semibold">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.service_items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{item.unit_price.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">
                            {(item.quantity * item.unit_price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-right">
                  <span className="font-semibold">Total Service Charge: </span>
                  <span className="font-bold">₹{calculateServiceTotal().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Server & Domain Charges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Server & Domain Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-2 font-semibold">Charge Type</th>
                        <th className="text-center p-2 font-semibold">Included</th>
                        <th className="text-left p-2 font-semibold">Duration</th>
                        <th className="text-right p-2 font-semibold">Unit Price (₹)</th>
                        <th className="text-right p-2 font-semibold">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Domain Registration', data: quotation.domain_registration },
                        { name: 'Server Hosting', data: quotation.server_hosting },
                        { name: 'SSL Certificate', data: quotation.ssl_certificate },
                        { name: 'Email Hosting', data: quotation.email_hosting },
                      ].map((item) => (
                        <tr key={item.name} className="border-b">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2 text-center">
                            <Badge variant={item.data.included ? 'default' : 'outline'}>
                              {item.data.included ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="p-2">{item.data.duration || '-'}</td>
                          <td className="p-2 text-right">
                            {item.data.included ? item.data.unit_price.toLocaleString() : '-'}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {item.data.included ? item.data.unit_price.toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Total Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Subtotal (Services)</td>
                          <td className="py-2 text-right">₹{calculateServiceTotal().toLocaleString()}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Subtotal (Server & Domain)</td>
                          <td className="py-2 text-right">₹{calculateInfraTotal().toLocaleString()}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Discount</td>
                          <td className="py-2 text-right">
                            {quotation.discount_type === 'flat' && `₹${quotation.discount_value}`}
                            {quotation.discount_type === 'percent' && `${quotation.discount_value}%`}
                            {quotation.discount_type === 'none' && 'None'}
                            {' = ₹'}
                            {calculateDiscount().toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Tax ({quotation.tax_rate}%)</td>
                          <td className="py-2 text-right">₹{calculateTax().toLocaleString()}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-bold text-lg">Grand Total</td>
                          <td className="py-2 text-right font-bold text-lg">
                            ₹{quotation.grand_total.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold mb-1">Payment Terms:</p>
                      <p className="text-sm text-gray-600">{quotation.payment_terms || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Additional Notes:</p>
                      <p className="text-sm text-gray-600">{quotation.additional_notes || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Authorized Signatory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authorized Signatory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold mb-1">Name:</p>
                    <p className="text-sm">{quotation.signatory_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Designation:</p>
                    <p className="text-sm">{quotation.signatory_designation || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default QuotationViewModal
