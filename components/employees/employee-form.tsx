"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createEmployee } from "@/hooks/use-employees"
import { useRouter } from "next/navigation"
import { useEmployeeTypes, useRoles, useShifts, useTechnologies } from "@/hooks/use-common"
import { useDesignations } from "@/hooks/use-designations"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"

interface EmployeeFormData {
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
  profile_picture: File | null
}

export function EmployeeForm() {
  const router = useRouter()
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
    profile_picture: null,
  })
  
  const [joiningDate, setJoiningDate] = useState<Date>()
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([])
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])

  const handleChange = useCallback((field: keyof EmployeeFormData, value: string | number[] | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const employeeData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        employee_type: parseInt(formData.employee_type),
        role: parseInt(formData.role),
        joining_date: joiningDate?.toISOString().split('T')[0],
        salary: parseFloat(formData.salary),
        is_active: formData.is_active,
        designations: selectedDesignations.map(id => parseInt(id)),
        shifts: selectedShifts.map(id => parseInt(id)),
        technologies: selectedTechnologies.map(id => parseInt(id)),
        create_folder: formData.create_folder,
        is_on_probation: formData.is_on_probation,
        probation_months: formData.probation_months ? parseInt(formData.probation_months) : null,
        is_on_notice_period: formData.is_on_notice_period,
        notice_period_end_date: formData.notice_period_end_date || null,
        gender: formData.gender,
        birth_date: formData.birth_date,
        marital_status: formData.marital_status,
        current_address: formData.current_address,
        permanent_address: formData.permanent_address,
        document_link: formData.document_link,
        account_holder: formData.account_holder,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
        branch: formData.branch,
      }
      
      await createEmployee(employeeData)
      toast({
        title: "Success",
        description: "Employee created successfully",
      })
      router.push("/dashboard/employees")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create employee",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingTypes || loadingRoles || loadingDesignations || loadingShifts || loadingTechnologies) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  required
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  required
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  required
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birth_date">Birth Date</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange("birth_date", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select
                value={formData.marital_status}
                onValueChange={(value) => handleChange("marital_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current_address">Current Address</Label>
              <textarea
                id="current_address"
                className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                placeholder="Enter current address"
                value={formData.current_address}
                onChange={(e) => handleChange("current_address", e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="permanent_address">Permanent Address</Label>
              <textarea
                id="permanent_address"
                className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                placeholder="Enter permanent address"
                value={formData.permanent_address}
                onChange={(e) => handleChange("permanent_address", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="document_link">Document Link</Label>
                <Input
                  id="document_link"
                  type="url"
                  placeholder="https://example.com/document"
                  value={formData.document_link}
                  onChange={(e) => handleChange("document_link", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profile_picture">Profile Picture</Label>
                <Input
                  id="profile_picture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange("profile_picture", e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="employee_type">Employee Type</Label>
                <Select
                  value={formData.employee_type}
                  onValueChange={(value) => handleChange("employee_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="designations">Designations</Label>
              <MultiSelect
                options={designations?.map(d => ({ 
                  value: d.id.toString(), 
                  label: `${d.title} (Level ${d.level})` 
                })) || []}
                value={selectedDesignations}
                onChange={setSelectedDesignations}
                placeholder="Select designations..."
                disabled={loadingDesignations}
              />
            </div>

            <div>
              <Label htmlFor="shifts">Shifts</Label>
              <MultiSelect
                options={shifts?.map(s => ({ 
                  value: s.id.toString(), 
                  label: `${s.name} (${s.start_time} - ${s.end_time})` 
                })) || []}
                value={selectedShifts}
                onChange={setSelectedShifts}
                placeholder="Select shifts..."
                disabled={loadingShifts}
              />
            </div>

            <div>
              <Label htmlFor="technologies">Technologies</Label>
              <MultiSelect
                options={technologies?.map(t => ({ 
                  value: t.id.toString(), 
                  label: t.name 
                })) || []}
                value={selectedTechnologies}
                onChange={setSelectedTechnologies}
                placeholder="Select technologies..."
                disabled={loadingTechnologies}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="50000"
                  value={formData.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="joining_date">Joining Date</Label>
                <DatePicker
                  value={joiningDate}
                  onChange={(date: Date | undefined) => {
                    setJoiningDate(date)
                    handleChange("joining_date", date?.toISOString().split('T')[0] || "")
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="account_holder">Account Holder Name</Label>
                <Input
                  id="account_holder"
                  placeholder="Enter account holder name"
                  value={formData.account_holder}
                  onChange={(e) => handleChange("account_holder", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  placeholder="Enter account number"
                  value={formData.account_number}
                  onChange={(e) => handleChange("account_number", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  placeholder="Enter IFSC code"
                  value={formData.ifsc_code}
                  onChange={(e) => handleChange("ifsc_code", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="Enter branch name"
                  value={formData.branch}
                  onChange={(e) => handleChange("branch", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="create_folder"
                checked={formData.create_folder}
                onCheckedChange={(checked) => handleChange("create_folder", checked)}
              />
              <Label htmlFor="create_folder" className="cursor-pointer">
                <span className="font-medium">Create Employee Folder</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  Create a dedicated folder for this employee's documents and files
                </span>
              </Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_on_probation"
                  checked={formData.is_on_probation}
                  onCheckedChange={(checked) => handleChange("is_on_probation", checked)}
                />
                <Label htmlFor="is_on_probation" className="cursor-pointer">
                  <span className="font-medium">Is on Probation</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Employee is currently on probation period
                  </span>
                </Label>
              </div>

              {formData.is_on_probation && (
                <div className="ml-8">
                  <Label htmlFor="probation_months">Probation Period (Months)</Label>
                  <Input
                    id="probation_months"
                    type="number"
                    min="1"
                    max="24"
                    value={formData.probation_months}
                    onChange={(e) => handleChange("probation_months", e.target.value)}
                    placeholder="Enter number of months (1-24)"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_on_notice_period"
                  checked={formData.is_on_notice_period}
                  onCheckedChange={(checked) => handleChange("is_on_notice_period", checked)}
                />
                <Label htmlFor="is_on_notice_period" className="cursor-pointer">
                  <span className="font-medium">Is on Notice Period</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Employee has submitted notice to leave
                  </span>
                </Label>
              </div>

              {formData.is_on_notice_period && (
                <div className="ml-8">
                  <Label htmlFor="notice_period_end_date">Notice Period End Date</Label>
                  <Input
                    id="notice_period_end_date"
                    type="date"
                    value={formData.notice_period_end_date}
                    onChange={(e) => handleChange("notice_period_end_date", e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Employee"}
          </Button>
        </CardFooter>
      </div>
    </form>
  )
}
