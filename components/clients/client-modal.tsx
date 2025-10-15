"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface ClientFormData {
  id?: number
  name: string
  email: string
  phone: string
  gst_number: string
  website: string
  rating: number
  address_line1: string
  address_line2: string
  address_city: string
  address_state: string
  address_country: string
  address_pincode: string
  is_active: boolean
}

interface Client {
  id: number
  name: string
  email: string
  phone?: string
  gst_number?: string
  website?: string
  rating: number
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  }
  created_at: string
}

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  client?: Client | null
  mode: 'add' | 'edit'
  onSuccess?: () => void
}

export function ClientModal({ isOpen, onClose, client, mode, onSuccess }: ClientModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
    gst_number: "",
    website: "",
    rating: 5,
    address_line1: "",
    address_line2: "",
    address_city: "",
    address_state: "",
    address_country: "India",
    address_pincode: "",
    is_active: true,
  })

  // Clear field errors when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData({
        id: client.id,
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        gst_number: client.gst_number || "",
        website: client.website || "",
        rating: client.rating || 5,
        address_line1: client.address?.line1 || "",
        address_line2: client.address?.line2 || "",
        address_city: client.address?.city || "",
        address_state: client.address?.state || "",
        address_country: client.address?.country || "India",
        address_pincode: client.address?.pincode || "",
        is_active: true, // Clients don't have is_active in the model, defaulting to true
      })
    } else {
      // Reset form for add mode
      setFormData({
        name: "",
        email: "",
        phone: "",
        gst_number: "",
        website: "",
        rating: 5,
        address_line1: "",
        address_line2: "",
        address_city: "",
        address_state: "",
        address_country: "India",
        address_pincode: "",
        is_active: true,
      })
    }
  }, [client, mode, isOpen])

  const handleChange = useCallback((field: keyof ClientFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [fieldErrors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create FormData
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gst_number: formData.gst_number,
        website: formData.website,
        rating: formData.rating,
      }

      if (mode === 'edit' && client?.id) {
        await api.put(`/clients/clients/${client.id}/`, submitData)
        toast({
          title: "Success",
          description: "Client updated successfully",
        })
      } else {
        await api.post('/clients/clients/', submitData)
        toast({
          title: "Success",
          description: "Client created successfully",
        })
      }

      // Clear any existing field errors on successful submission
      setFieldErrors({})
      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving client:', error)
      
      // Parse validation errors from Django backend
      let errorMessage = "Failed to save client"
      const errors: {[key: string]: string} = {}
      
      if (error.response?.data) {
        const errorData = error.response.data
        console.log('Backend error data:', errorData)
        
        // Check if it's a validation error with field-specific messages
        if (typeof errorData === 'object' && !errorData.message) {
          // Handle Django field validation errors
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errors[field] = messages.join(', ')
            } else if (typeof messages === 'string') {
              errors[field] = messages
            }
          }
          
          // Set field errors for display below inputs
          setFieldErrors(errors)
          
          // If there are field errors, show a generic toast
          if (Object.keys(errors).length > 0) {
            errorMessage = "Please fix the validation errors below"
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      }
      
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[95vw] max-w-[900px] max-h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Client' : 'Add New Client'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse align-middle">
                  <tbody>
                    {/* Basic Information */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Basic Information
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border w-1/4">Client Name</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="name"
                            placeholder="Enter client name"
                            required
                            className={`h-9 ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                          />
                          {fieldErrors.name && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                          )}
                        </div>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border w-1/4">Email</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            required
                            className={`h-9 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                          />
                          {fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Phone</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter phone number"
                            className={`h-9 ${fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                          />
                          {fieldErrors.phone && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                          )}
                        </div>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Website</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="website"
                            type="url"
                            placeholder="https://example.com"
                            className={`h-9 ${fieldErrors.website ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.website}
                            onChange={(e) => handleChange("website", e.target.value)}
                          />
                          {fieldErrors.website && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.website}</p>
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">GST Number</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="gst_number"
                            placeholder="Enter GST number"
                            className={`h-9 ${fieldErrors.gst_number ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.gst_number}
                            onChange={(e) => handleChange("gst_number", e.target.value.toUpperCase())}
                          />
                          {fieldErrors.gst_number && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.gst_number}</p>
                          )}
                        </div>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Rating</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="rating"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="1-5"
                            className={`h-9 ${fieldErrors.rating ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.rating}
                            onChange={(e) => handleChange("rating", parseInt(e.target.value) || 1)}
                          />
                          {fieldErrors.rating && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.rating}</p>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Address Information */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Address Information
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Address Line 1</th>
                      <td colSpan={3} className="p-2 border">
                        <Input
                          id="address_line1"
                          placeholder="Enter address line 1"
                          className="h-9"
                          value={formData.address_line1}
                          onChange={(e) => handleChange("address_line1", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Address Line 2</th>
                      <td colSpan={3} className="p-2 border">
                        <Input
                          id="address_line2"
                          placeholder="Enter address line 2 (optional)"
                          className="h-9"
                          value={formData.address_line2}
                          onChange={(e) => handleChange("address_line2", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">City</th>
                      <td className="p-2 border">
                        <Input
                          id="address_city"
                          placeholder="Enter city"
                          className="h-9"
                          value={formData.address_city}
                          onChange={(e) => handleChange("address_city", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">State</th>
                      <td className="p-2 border">
                        <Input
                          id="address_state"
                          placeholder="Enter state"
                          className="h-9"
                          value={formData.address_state}
                          onChange={(e) => handleChange("address_state", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Country</th>
                      <td className="p-2 border">
                        <Input
                          id="address_country"
                          placeholder="Enter country"
                          className="h-9"
                          value={formData.address_country}
                          onChange={(e) => handleChange("address_country", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Pincode</th>
                      <td className="p-2 border">
                        <Input
                          id="address_pincode"
                          placeholder="Enter pincode"
                          className="h-9"
                          value={formData.address_pincode}
                          onChange={(e) => handleChange("address_pincode", e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex gap-3 w-full justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-4 h-9">
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={loading}
              className="px-6 h-9 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                mode === 'edit' ? 'Update Client' : 'Create Client'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}