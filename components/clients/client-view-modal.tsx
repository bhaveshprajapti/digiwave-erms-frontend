"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ExternalLink, MapPin, Building, User, Phone, Mail, Globe, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Client {
  id: number
  name: string
  email: string
  phone?: string
  gst_number?: string
  website?: string
  rating?: number
  is_active?: boolean
  company_name?: string
  address_details?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  }
  address_info?: string
  created_at: string
  updated_at?: string
}

interface ClientViewModalProps {
  isOpen: boolean
  onClose: () => void
  client?: Client | null
  onStatusUpdate?: (client: Client, newStatus: boolean) => void
}

export function ClientViewModal({ isOpen, onClose, client, onStatusUpdate }: ClientViewModalProps) {
  const { toast } = useToast()

  const handleStatusToggle = async (newStatus: boolean) => {
    if (!client) return
    
    try {
      await api.patch(`/clients/clients/${client.id}/`, { is_active: newStatus })
      
      // Update the parent component if callback provided
      if (onStatusUpdate) {
        onStatusUpdate({ ...client, is_active: newStatus }, newStatus)
      }
      
      toast({
        title: "Success",
        description: `Client ${newStatus ? 'activated' : 'deactivated'} successfully`,
        variant: "success"
      })
    } catch (error) {
      console.error('Error updating client status:', error)
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive"
      })
    }
  }

  if (!isOpen || !client) return null

  const formatAddress = (addressDetails: any) => {
    if (!addressDetails) return 'N/A'
    
    const parts = [
      addressDetails.line1,
      addressDetails.line2,
      addressDetails.city,
      addressDetails.state,
      addressDetails.country,
      addressDetails.pincode
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[95vw] max-w-[1000px] max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold uppercase text-gray-900">
                {client.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6" style={{maxHeight: '70vh'}}>
          <div className="table-responsive">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                
                {/* Basic Information */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left text-sm font-semibold text-gray-700 border border-gray-300">
                    <User className="w-4 h-4 inline-block mr-2 text-blue-600" />
                    Basic Information
                  </th>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300 w-1/4">Name</th>
                  <td className="p-3 border border-gray-300">
                    <span className="font-medium">{client.name}</span>
                  </td>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300 w-1/4">Email</th>
                  <td className="p-3 border border-gray-300">
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {client.email}
                    </a>
                  </td>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Phone</th>
                  <td className="p-3 border border-gray-300">
                    <span className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {client.phone || 'N/A'}
                    </span>
                  </td>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Website</th>
                  <td className="p-3 border border-gray-300">
                    {client.website ? (
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        {client.website}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </td>
                </tr>

                {/* Address */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left text-sm font-semibold text-gray-700 border border-gray-300">
                    <MapPin className="w-4 h-4 inline-block mr-2 text-green-600" />
                    Address
                  </th>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Street / Locality</th>
                  <td colSpan={3} className="p-3 border border-gray-300">
                    <span>{client.address_details?.line1 || client.address_info || 'N/A'}</span>
                  </td>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">City</th>
                  <td className="p-3 border border-gray-300">{client.address_details?.city || 'N/A'}</td>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">State</th>
                  <td className="p-3 border border-gray-300">{client.address_details?.state || 'N/A'}</td>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Country</th>
                  <td className="p-3 border border-gray-300">{client.address_details?.country || 'N/A'}</td>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Pincode</th>
                  <td className="p-3 border border-gray-300">{client.address_details?.pincode || 'N/A'}</td>
                </tr>

                {/* Company Details */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left text-sm font-semibold text-gray-700 border border-gray-300">
                    <Building className="w-4 h-4 inline-block mr-2 text-blue-600" />
                    Company Details
                  </th>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Company Name</th>
                  <td className="p-3 border border-gray-300">
                    <span>{client.company_name || client.name}</span>
                  </td>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">GST Number</th>
                  <td className="p-3 border border-gray-300">
                    <span className="flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      {client.gst_number || 'N/A'}
                    </span>
                  </td>
                </tr>

                {/* Status */}
                <tr className="bg-gray-100">
                  <th colSpan={4} className="p-3 text-left text-sm font-semibold text-gray-700 border border-gray-300">
                    <Hash className="w-4 h-4 inline-block mr-2 text-purple-600" />
                    Status
                  </th>
                </tr>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border border-gray-300">Status</th>
                  <td colSpan={3} className="p-3 border border-gray-300">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={client.is_active !== false}
                        onCheckedChange={handleStatusToggle}
                        id="client-status"
                      />
                      <Label htmlFor="client-status" className="text-sm font-medium cursor-pointer">
                        {client.is_active !== false ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </td>
                </tr>
                
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}