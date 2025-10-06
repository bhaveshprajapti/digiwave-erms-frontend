"use client"


import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createEmployee, updateEmployee } from "@/hooks/use-employees"
import { useEmployeeTypes, useRoles, useShifts, useTechnologies } from "@/hooks/use-common"
import { useDesignations } from "@/hooks/use-designations"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"


interface EmployeeFormData {
  id?: number
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  employee_type: string
  role: string
  joining_date: string
  salary: string
  is_active: boolean
  designations: number[]
  shifts: number[]
  technologies: number[]
  create_folder: boolean
  is_on_probation: boolean
  probation_months: string
  is_on_notice_period: boolean
  notice_period_end_date: string
  gender: string
  birth_date: string
  marital_status: string
  current_address: string
  permanent_address: string
  document_link: string
  account_holder: string
  account_number: string
  ifsc_code: string
  branch: string
  emergency_contact: string
  emergency_phone: string
  profile_picture: File | null
}


interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  employee?: any
  mode: 'add' | 'edit'
  onSuccess?: () => void
}


export function EmployeeModal({ isOpen, onClose, employee, mode, onSuccess }: EmployeeModalProps) {
  const { toast } = useToast()
  const { employeeTypes, isLoading: loadingTypes } = useEmployeeTypes()
  const { roles, isLoading: loadingRoles } = useRoles()
  const { designations, isLoading: loadingDesignations } = useDesignations()
  const { shifts, isLoading: loadingShifts } = useShifts()
  const { technologies, isLoading: loadingTechnologies } = useTechnologies()
  const [loading, setLoading] = useState(false)


  const [formData, setFormData] = useState<EmployeeFormData>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    employee_type: "",
    role: "",
    joining_date: "",
    salary: "",
    is_active: true,
    designations: [],
    shifts: [],
    technologies: [],
    create_folder: false,
    is_on_probation: false,
    probation_months: "",
    is_on_notice_period: false,
    notice_period_end_date: "",
    gender: "",
    birth_date: "",
    marital_status: "",
    current_address: "",
    permanent_address: "",
    document_link: "",
    account_holder: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    emergency_contact: "",
    emergency_phone: "",
    profile_picture: null,
  })


  const [joiningDate, setJoiningDate] = useState<Date>()
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([])
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])

  // Function to fetch address text from address ID
  const fetchAddressText = async (addressId: number): Promise<string> => {
    try {
      const response = await api.get(`/common/addresses/${addressId}/`)
      if (response.data) {
        return response.data.line1 || ''
      }
    } catch (error) {
      console.error('Error fetching address:', error)
    }
    return ''
  }

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (employee && mode === 'edit') {
        // Fetch address texts if they are IDs
        let currentAddressText = ''
        let permanentAddressText = ''
        
        if (typeof employee.current_address === 'number') {
          currentAddressText = await fetchAddressText(employee.current_address)
        } else if (typeof employee.current_address === 'object' && employee.current_address?.line1) {
          currentAddressText = employee.current_address.line1
        }
        
        if (typeof employee.permanent_address === 'number') {
          permanentAddressText = await fetchAddressText(employee.permanent_address)
        } else if (typeof employee.permanent_address === 'object' && employee.permanent_address?.line1) {
          permanentAddressText = employee.permanent_address.line1
        }

      setFormData({
        username: employee.username || "",
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        password: "", // Don't pre-fill password for security
        employee_type: employee.employee_type?.toString() || "",
        role: employee.role?.toString() || "",
        joining_date: employee.joining_date || "",
        salary: employee.salary?.toString() || "",
        is_active: employee.is_active ?? true,
        designations: employee.designations || [],
        shifts: employee.shifts || [],
        technologies: employee.technologies || [],
        create_folder: false,
        is_on_probation: employee.is_on_probation || false,
        probation_months: employee.probation_months?.toString() || "",
        is_on_notice_period: employee.is_on_notice_period || false,
        notice_period_end_date: employee.notice_period_end_date || "",
        gender: employee.gender || "",
        birth_date: employee.birth_date || "",
        marital_status: employee.marital_status || "",
        current_address: currentAddressText,
        permanent_address: permanentAddressText,
        document_link: employee.employee_details?.document_link || employee.document_link || "",
        account_holder: employee.employee_details?.bank_details?.account_holder || employee.account_holder || "",
        account_number: employee.employee_details?.bank_details?.account_number || employee.account_number || "",
        ifsc_code: employee.employee_details?.bank_details?.ifsc_code || employee.ifsc_code || "",
        branch: employee.employee_details?.bank_details?.branch || employee.branch || "",
        emergency_contact: employee.emergency_contact || "",
        emergency_phone: employee.emergency_phone || "",
        profile_picture: null,
      })
      
      const designationStrings = employee.designations?.map((id: number) => id.toString()) || []
      const shiftStrings = employee.shifts?.map((id: number) => id.toString()) || []
      const technologyStrings = employee.technologies?.map((id: number) => id.toString()) || []
      
      setSelectedDesignations(designationStrings)
      setSelectedShifts(shiftStrings)
      setSelectedTechnologies(technologyStrings)
      
      if (employee.joining_date) {
        setJoiningDate(new Date(employee.joining_date))
      }
      } else {
      // Reset form for add mode
      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        employee_type: "",
        role: "",
        joining_date: "",
        salary: "",
        is_active: true,
        designations: [],
        shifts: [],
        technologies: [],
        create_folder: false,
        is_on_probation: false,
        probation_months: "",
        is_on_notice_period: false,
        notice_period_end_date: "",
        gender: "",
        birth_date: "",
        marital_status: "",
        current_address: "",
        permanent_address: "",
        document_link: "",
        account_holder: "",
        account_number: "",
        ifsc_code: "",
        branch: "",
        emergency_contact: "",
        emergency_phone: "",
        profile_picture: null,
      })
      setSelectedDesignations([])
      setSelectedShifts([])
      setSelectedTechnologies([])
      setJoiningDate(undefined)
    }
    }
    
    loadEmployeeData()
  }, [employee, mode, isOpen])


  const handleChange = useCallback((field: keyof EmployeeFormData, value: string | number[] | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create FormData for file upload support
      const formDataToSend = new FormData()
      
      // Add basic fields
      formDataToSend.append('username', formData.username)
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      
      if (formData.password) {
        formDataToSend.append('password', formData.password)
      }
      
      if (formData.employee_type && formData.employee_type !== '0') {
        formDataToSend.append('employee_type', formData.employee_type)
      }
      if (formData.role && formData.role !== '0') {
        formDataToSend.append('role', formData.role)
      }
      formDataToSend.append('salary', formData.salary)
      formDataToSend.append('is_active', formData.is_active.toString())
      
      if (joiningDate) {
        formDataToSend.append('joining_date', joiningDate.toISOString().split('T')[0])
      }
      
      if (formData.birth_date) {
        formDataToSend.append('birth_date', formData.birth_date)
      }
      
      formDataToSend.append('gender', formData.gender)
      formDataToSend.append('marital_status', formData.marital_status)
      formDataToSend.append('is_on_probation', formData.is_on_probation.toString())
      formDataToSend.append('is_on_notice_period', formData.is_on_notice_period.toString())
      formDataToSend.append('create_folder', formData.create_folder.toString())
      
      if (formData.probation_months) {
        formDataToSend.append('probation_months', formData.probation_months)
      }
      
      if (formData.notice_period_end_date) {
        formDataToSend.append('notice_period_end_date', formData.notice_period_end_date)
      }
      
      // Add bank details
      formDataToSend.append('account_holder', formData.account_holder)
      formDataToSend.append('account_number', formData.account_number)
      formDataToSend.append('ifsc_code', formData.ifsc_code)
      formDataToSend.append('branch', formData.branch)
      
      // Add address fields as text (not objects)
      if (formData.current_address) {
        formDataToSend.append('current_address_text', formData.current_address)
      }
      
      if (formData.permanent_address) {
        formDataToSend.append('permanent_address_text', formData.permanent_address)
      }
      
      if (formData.document_link) {
        formDataToSend.append('document_link', formData.document_link)
      }
      
      // Add emergency contact fields
      if (formData.emergency_contact) {
        formDataToSend.append('emergency_contact', formData.emergency_contact)
      }
      
      if (formData.emergency_phone) {
        formDataToSend.append('emergency_phone', formData.emergency_phone)
      }
      
      // Add arrays
      selectedDesignations.forEach(id => {
        formDataToSend.append('designations', id)
      })
      
      selectedShifts.forEach(id => {
        formDataToSend.append('shifts', id)
      })
      
      selectedTechnologies.forEach(id => {
        formDataToSend.append('technologies', id)
      })
      
      // Add profile picture
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture)
      }

      if (mode === 'edit' && employee?.id) {
        await updateEmployee(employee.id.toString(), formDataToSend)
        toast({
          title: "Success",
          description: "Employee updated successfully",
        })
      } else {
        await createEmployee(formDataToSend)
        toast({
          title: "Success",
          description: "Employee created successfully",
        })
      }

      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving employee:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save employee",
      })
    } finally {
      setLoading(false)
    }
  }


  if (loadingTypes || loadingRoles || loadingDesignations || loadingShifts || loadingTechnologies) {
    if (!isOpen) return null
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-96 h-64 bg-white rounded-lg shadow-2xl flex items-center justify-center">
          <div className="animate-pulse text-gray-600">Loading...</div>
        </div>
      </div>
    )
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
      <div className="relative w-[90vw] max-w-[800px] max-h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Employee' : 'Add New Employee'}
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
                    {/* Personal Details */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal Details
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">First Name</th>
                      <td className="p-2 border">
                        <Input
                          id="first_name"
                          placeholder="Enter first name"
                          required
                          className="h-9"
                          value={formData.first_name}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Last Name</th>
                      <td className="p-2 border">
                        <Input
                          id="last_name"
                          placeholder="Enter last name"
                          required
                          className="h-9"
                          value={formData.last_name}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Username</th>
                      <td className="p-2 border">
                        <Input
                          id="username"
                          placeholder="Choose a username"
                          required
                          className="h-9"
                          value={formData.username}
                          onChange={(e) => handleChange("username", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Password</th>
                      <td className="p-2 border">
                        {mode === 'add' && (
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            required
                            className="h-9"
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Email</th>
                      <td className="p-2 border">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          required
                          className="h-9"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Phone</th>
                      <td className="p-2 border">
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          className="h-9"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Gender</th>
                      <td className="p-2 border">
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleChange("gender", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Birth Date</th>
                      <td className="p-2 border">
                        <DatePicker
                          value={formData.birth_date ? new Date(formData.birth_date) : undefined}
                          onChange={(date: Date | undefined) => {
                            handleChange("birth_date", date?.toISOString().split('T')[0] || "")
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Marital Status</th>
                      <td colSpan={3} className="p-2 border">
                        <Select
                          value={formData.marital_status}
                          onValueChange={(value) => handleChange("marital_status", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>

                    {/* Contact Details */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Contact Details
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Current Address</th>
                      <td colSpan={3} className="p-2 border">
                        <textarea
                          id="current_address"
                          className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md resize-none"
                          placeholder="Enter current address"
                          value={formData.current_address}
                          onChange={(e) => handleChange("current_address", e.target.value)}
                          rows={2}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Permanent Address</th>
                      <td colSpan={3} className="p-2 border">
                        <textarea
                          id="permanent_address"
                          className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md resize-none"
                          placeholder="Enter permanent address"
                          value={formData.permanent_address}
                          onChange={(e) => handleChange("permanent_address", e.target.value)}
                          rows={2}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Emergency Contact</th>
                      <td className="p-2 border">
                        <Input
                          id="emergency_contact"
                          placeholder="Enter emergency contact name"
                          className="h-9"
                          value={formData.emergency_contact}
                          onChange={(e) => handleChange("emergency_contact", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Emergency Phone</th>
                      <td className="p-2 border">
                        <Input
                          id="emergency_phone"
                          type="tel"
                          placeholder="Enter emergency phone"
                          className="h-9"
                          value={formData.emergency_phone}
                          onChange={(e) => handleChange("emergency_phone", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Document Link</th>
                      <td colSpan={3} className="p-2 border">
                        <Input
                          id="document_link"
                          type="url"
                          placeholder="https://example.com/document"
                          className="h-9"
                          value={formData.document_link}
                          onChange={(e) => handleChange("document_link", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Profile Picture</th>
                      <td colSpan={3} className="p-2 border">
                        <Input
                          id="profile_picture"
                          type="file"
                          accept="image/*"
                          className="h-9 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={(e) => handleChange("profile_picture", e.target.files?.[0] || null)}
                        />
                      </td>
                    </tr>

                    {/* Job Details */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        Job Details
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Employee Type</th>
                      <td className="p-2 border">
                        <Select
                          value={formData.employee_type}
                          onValueChange={(value) => handleChange("employee_type", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeTypes?.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Role</th>
                      <td className="p-2 border">
                        <Select
                          value={formData.role}
                          onValueChange={(value) => handleChange("role", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Salary</th>
                      <td className="p-2 border">
                        <Input
                          id="salary"
                          type="number"
                          placeholder="Enter salary"
                          required
                          className="h-9"
                          value={formData.salary}
                          onChange={(e) => handleChange("salary", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Joining Date</th>
                      <td className="p-2 border">
                        <DatePicker
                          value={joiningDate}
                          onChange={(date: Date | undefined) => {
                            setJoiningDate(date)
                            handleChange("joining_date", date?.toISOString().split('T')[0] || "")
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Shift Time</th>
                      <td colSpan={3} className="p-2 border">
                        <MultiSelect
                          options={shifts?.map(s => ({ 
                            value: s.id.toString(), 
                            label: `${s.name} (${s.start_time} - ${s.end_time})` 
                          })) || []}
                          value={selectedShifts}
                          onChange={setSelectedShifts}
                          placeholder="-- Select Shift --"
                          disabled={loadingShifts}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Designations</th>
                      <td className="p-2 border">
                        <MultiSelect
                          options={designations?.map(d => ({ 
                            value: d.id.toString(), 
                            label: d.title
                          })) || []}
                          value={selectedDesignations}
                          onChange={setSelectedDesignations}
                          placeholder="Search designations"
                          disabled={loadingDesignations}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Technologies</th>
                      <td className="p-2 border">
                        <MultiSelect
                          options={technologies?.map(t => ({ 
                            value: t.id.toString(), 
                            label: t.name 
                          })) || []}
                          value={selectedTechnologies}
                          onChange={setSelectedTechnologies}
                          placeholder="Search technologies"
                          disabled={loadingTechnologies}
                        />
                      </td>
                    </tr>

                    {/* Bank Details */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Bank Details
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Account Holder Name</th>
                      <td className="p-2 border">
                        <Input
                          id="account_holder"
                          placeholder="Enter account holder name"
                          className="h-9"
                          value={formData.account_holder}
                          onChange={(e) => handleChange("account_holder", e.target.value)}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Account Number</th>
                      <td className="p-2 border">
                        <Input
                          id="account_number"
                          placeholder="Enter account number"
                          className="h-9"
                          value={formData.account_number}
                          onChange={(e) => handleChange("account_number", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">IFSC Code</th>
                      <td className="p-2 border">
                        <Input
                          id="ifsc_code"
                          placeholder="Enter IFSC code"
                          className="h-9"
                          value={formData.ifsc_code}
                          onChange={(e) => handleChange("ifsc_code", e.target.value.toUpperCase())}
                        />
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Branch</th>
                      <td className="p-2 border">
                        <Input
                          id="branch"
                          placeholder="Enter branch name"
                          className="h-9"
                          value={formData.branch}
                          onChange={(e) => handleChange("branch", e.target.value)}
                        />
                      </td>
                    </tr>

                    {/* Additional Options */}
                    <tr className="bg-gray-100">
                      <th colSpan={4} className="p-2 text-left text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 inline-block mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Additional Options
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Active Status</th>
                      <td colSpan={3} className="p-2 border">
                        <div className="flex items-center">
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => handleChange("is_active", checked)}
                          />
                          <Label htmlFor="is_active" className="ml-2 cursor-pointer text-sm text-gray-700">Is Active</Label>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Create Folder</th>
                      <td colSpan={3} className="p-2 border">
                        <div className="flex items-center">
                          <Switch
                            id="create_folder"
                            checked={formData.create_folder}
                            onCheckedChange={(checked) => handleChange("create_folder", checked)}
                          />
                          <Label htmlFor="create_folder" className="ml-2 cursor-pointer text-sm text-gray-700">Create Employee Folder</Label>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Probation Status</th>
                      <td className="p-2 border">
                        <div className="flex items-center">
                          <Switch
                            id="is_on_probation"
                            checked={formData.is_on_probation}
                            onCheckedChange={(checked) => handleChange("is_on_probation", checked)}
                          />
                          <Label htmlFor="is_on_probation" className="ml-2 cursor-pointer text-sm text-gray-700">Is on Probation</Label>
                        </div>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Probation Months</th>
                      <td className="p-2 border">
                        <Input
                          id="probation_months"
                          type="number"
                          min="1"
                          max="24"
                          placeholder="Enter months (1-24)"
                          className="h-9"
                          disabled={!formData.is_on_probation}
                          value={formData.probation_months}
                          onChange={(e) => handleChange("probation_months", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Notice Period</th>
                      <td className="p-2 border">
                        <div className="flex items-center">
                          <Switch
                            id="is_on_notice_period"
                            checked={formData.is_on_notice_period}
                            onCheckedChange={(checked) => handleChange("is_on_notice_period", checked)}
                          />
                          <Label htmlFor="is_on_notice_period" className="ml-2 cursor-pointer text-sm text-gray-700">Is on Notice Period</Label>
                        </div>
                      </td>
                      <th className="p-2 text-left text-sm font-medium text-gray-600 border">Last Working Date</th>
                      <td className="p-2 border">
                        <DatePicker
                          value={formData.notice_period_end_date ? new Date(formData.notice_period_end_date) : undefined}
                          onChange={(date: Date | undefined) => {
                            handleChange("notice_period_end_date", date?.toISOString().split('T')[0] || "")
                          }}
                          disabled={!formData.is_on_notice_period}
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
                mode === 'edit' ? 'Update Employee' : 'Create Employee'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
