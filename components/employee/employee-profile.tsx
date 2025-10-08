"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Edit, 
  Save,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import api from "@/lib/api"
import authService from "@/lib/auth"

interface ProfileUpdateRequest {
  field?: string
  field_name?: string
  old_value: string
  new_value: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  document_link?: string
}

export function EmployeeProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<ProfileUpdateRequest[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    marital_status: "",
    current_address: "",
    permanent_address: "",
    emergency_contact: "",
    emergency_phone: "",
  })

  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false)

  const [requestDocumentLink, setRequestDocumentLink] = useState("")

  useEffect(() => {
    loadUserProfile()
    loadPendingRequests()
  }, [])

  const loadUserProfile = async () => {
    try {
      const u = authService.getUserData()
      if (u) {
        // Fetch complete user details
        const response = await api.get(`/accounts/users/${u.id}/`)
        const fullUser = response.data
        
        setUser(fullUser)
        setFormData({
          first_name: fullUser.first_name || "",
          last_name: fullUser.last_name || "",
          email: fullUser.email || "",
          phone: fullUser.phone || "",
          birth_date: fullUser.birth_date || "",
          gender: fullUser.gender || "",
          marital_status: fullUser.marital_status || "",
          current_address: await getAddressText(fullUser.current_address),
          permanent_address: await getAddressText(fullUser.permanent_address),
          emergency_contact: fullUser.emergency_contact || "",
          emergency_phone: fullUser.emergency_phone || "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAddressText = async (addressId: number): Promise<string> => {
    if (!addressId) return ""
    try {
      const response = await api.get(`/common/addresses/${addressId}/`)
      return response.data?.line1 || ""
    } catch (error) {
      return ""
    }
  }

  const loadPendingRequests = async () => {
    try {
      const response = await api.get('/accounts/profile-update-requests/my_requests/')
      const data = Array.isArray(response.data) ? response.data : []
      const normalized = data.map((item: any) => ({
        ...item,
        field: item.field ?? item.field_name ?? ''
      }))
      setPendingRequests(normalized)
    } catch (error) {
      console.error("Error loading pending requests:", error)
      // Fallback to empty array
      setPendingRequests([])
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Create profile update requests for changed fields
      const changes: any[] = []
      
      Object.keys(formData).forEach(key => {
        const oldValue = getOriginalValue(key)
        const newValue = formData[key as keyof typeof formData]
        
        if (oldValue !== newValue && newValue.trim() !== "") {
          changes.push({
            field: key,
            old_value: oldValue,
            new_value: newValue
          })
        }
      })

      if (changes.length === 0) {
        toast({
          title: "No Changes",
          description: "No changes detected to submit for approval",
        })
        setEditMode(false)
        return
      }

      // Create one consolidated profile update request
      const changesDetails = changes.map(change => 
        `${change.field.replace('_', ' ')}: "${change.old_value}" → "${change.new_value}"`
      ).join(', ')
      
      // Since bulk endpoint doesn't exist, create a single request with consolidated info
      const requestData = {
        field_name: 'multiple_fields',
        old_value: `Multiple fields (${changes.length} changes)`,
        new_value: changesDetails,
        reason: `Profile update request with ${changes.length} field(s): ${changesDetails}`,
        document_link: requestDocumentLink || undefined
      }
      
      await api.post('/accounts/profile-update-requests/', requestData)
      
      toast({
        title: "Update Requested",
        description: `Profile update request with ${changes.length} field changes submitted for admin approval`,
      })
      
      setEditMode(false)
      setRequestDocumentLink("")
      loadPendingRequests() // Reload pending requests
      
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to submit profile updates",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getOriginalValue = (field: string): string => {
    if (!user) return ""
    
    switch (field) {
      case "current_address":
        return user.current_address?.line1 || ""
      case "permanent_address":
        return user.permanent_address?.line1 || ""
      default:
        return user[field] || ""
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and settings</p>
        </div>
        <div className="flex items-center space-x-2">
          {!editMode && (
            <Button 
              onClick={() => setEditMode(true)} 
              disabled={pendingRequests.some(r => r.status === 'pending')}
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          )}
          {!editMode && pendingRequests.some(r => r.status === 'pending') && (
            <div className="text-sm text-orange-600">
              Profile editing disabled - pending approval
            </div>
          )}
        </div>
      </div>


      <Tabs defaultValue="profile" className="space-y-6">
        <div className="flex justify-start">
          <TabsList className="w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              Requests
              {pendingRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs px-1.5 py-0.5">
                  {pendingRequests.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          {editMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Update Request</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="document_link">Document link (optional)</Label>
                  <Input
                    id="document_link"
                    type="url"
                    placeholder="https://..."
                    value={requestDocumentLink}
                    onChange={(e) => setRequestDocumentLink(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Include a URL to supporting documentation for your update request.</p>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Profile Picture & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                    Employee ID: {user?.id}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Birth Date</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange("birth_date", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange("gender", value)}
                    disabled={!editMode}
                  >
                    <SelectTrigger className={editMode ? "" : "bg-gray-50"}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select 
                    value={formData.marital_status} 
                    onValueChange={(value) => handleInputChange("marital_status", value)}
                    disabled={!editMode}
                  >
                    <SelectTrigger className={editMode ? "" : "bg-gray-50"}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Address Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <textarea
                    id="current_address"
                    className={`w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md resize-none ${
                      editMode ? "" : "bg-gray-50"
                    }`}
                    value={formData.current_address}
                    onChange={(e) => {
                      const val = e.target.value
                      handleInputChange("current_address", val)
                      if (sameAsCurrentAddress) {
                        setFormData(prev => ({ ...prev, permanent_address: val }))
                      }
                    }}
                    disabled={!editMode}
                    placeholder="Enter your current address"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="permanent_address">Permanent Address</Label>
                    {editMode && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="same_as_current_addr" className="text-sm">Same as current</Label>
                        <Switch
                          id="same_as_current_addr"
                          checked={sameAsCurrentAddress}
                          onCheckedChange={(checked) => {
                            setSameAsCurrentAddress(checked)
                            if (checked) {
                              setFormData(prev => ({ ...prev, permanent_address: prev.current_address }))
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <textarea
                    id="permanent_address"
                    className={`w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md resize-none ${
                      editMode ? "" : "bg-gray-50"
                    }`}
                    value={sameAsCurrentAddress ? formData.current_address : formData.permanent_address}
                    onChange={(e) => handleInputChange("permanent_address", e.target.value)}
                    disabled={!editMode || sameAsCurrentAddress}
                    placeholder="Enter your permanent address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Emergency Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                    placeholder="Enter emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => handleInputChange("emergency_phone", e.target.value)}
                    disabled={!editMode}
                    className={editMode ? "" : "bg-gray-50"}
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons at Bottom Right */}
          {editMode && (
            <div className="flex justify-end gap-3 pt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditMode(false)
                  setRequestDocumentLink("")
                  loadUserProfile() // Reset form data
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfile}
                disabled={saving || pendingRequests.some(r => r.status === 'pending')}
                className="flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? "Submitting..." : "Submit for Approval"}</span>
              </Button>
            </div>
          )}
          
          {/* Pending Request Warning */}
          {editMode && pendingRequests.some(r => r.status === 'pending') && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-orange-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>You have a pending profile update request. Please wait for approval before submitting new changes.</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Profile Update Requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending profile update requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {(request.field?.replace?.('_', ' ') || request.field_name?.replace?.('_', ' ') || 'Field')} Update
                          </p>
                          <div className="text-sm text-gray-600 mt-1">
                            <p><span className="font-medium">From:</span> {request.old_value}</p>
                            <p><span className="font-medium">To:</span> {request.new_value}</p>
                            {request.document_link && (
                              <p>
                                <span className="font-medium">Document:</span>{' '}
                                <a
                                  href={request.document_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  {request.document_link}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="secondary"
                            className={`capitalize ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-orange-100 text-orange-800 border-orange-200'
                            }`}
                          >
                            {request.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
