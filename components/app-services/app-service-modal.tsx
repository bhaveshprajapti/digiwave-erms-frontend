"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createAppService, updateAppService } from "@/hooks/use-app-services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface AppServiceFormData {
  id?: string
  name: string
  description: string
  is_active: boolean
}

interface AppService {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

interface AppServiceModalProps {
  isOpen: boolean
  onClose: () => void
  appService?: AppService | null
  mode: 'add' | 'edit'
  onSuccess?: () => void
}

export function AppServiceModal({ isOpen, onClose, appService, mode, onSuccess }: AppServiceModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState<AppServiceFormData>({
    name: "",
    description: "",
    is_active: true,
  })

  // Clear field errors when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    if (appService && mode === 'edit') {
      setFormData({
        id: appService.id,
        name: appService.name || "",
        description: appService.description || "",
        is_active: appService.is_active ?? true,
      })
    } else {
      // Reset form for add mode
      setFormData({
        name: "",
        description: "",
        is_active: true,
      })
    }
  }, [appService, mode, isOpen])

  const handleChange = useCallback((field: keyof AppServiceFormData, value: string | boolean) => {
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
      if (mode === 'edit' && appService?.id) {
        await updateAppService(appService.id, formData)
        toast({
          title: "Success",
          description: "App Service updated successfully",
        })
      } else {
        await createAppService(formData)
        toast({
          title: "Success",
          description: "App Service created successfully",
        })
      }

      // Clear any existing field errors on successful submission
      setFieldErrors({})
      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving app service:', error)
      
      // Parse validation errors from Django backend
      let errorMessage = "Failed to save app service"
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
          // Handle custom error messages
          errorMessage = errorData.message
        } else if (errorData.detail) {
          // Handle DRF detail messages
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      }
      
      // Only show toast for non-field errors or when there are no field errors
      if (Object.keys(errors).length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: errorMessage,
        })
      }
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
      <div className="relative w-[95vw] max-w-[600px] max-h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit App Service' : 'Add New App Service'}
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
                    {/* App Service Details */}
                    <tr className="bg-gray-100">
                      <th colSpan={2} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        App Service Details
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border w-1/3">Name</th>
                      <td className="p-2 border">
                        <div>
                          <Input
                            id="name"
                            placeholder="Enter app service name"
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
                    </tr>

                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Description</th>
                      <td className="p-2 border">
                        <div>
                          <Textarea
                            id="description"
                            placeholder="Enter description (optional)"
                            className={`min-h-[80px] resize-none ${fieldErrors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            rows={3}
                          />
                          {fieldErrors.description && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Active Status</th>
                      <td className="p-2 border">
                        <div className="flex items-center">
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => handleChange("is_active", checked)}
                          />
                          <Label htmlFor="is_active" className="ml-2 cursor-pointer text-sm text-gray-700">
                            Is Active
                          </Label>
                        </div>
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
                mode === 'edit' ? 'Update App Service' : 'Create App Service'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}