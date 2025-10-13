"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, MapPin, Calendar, Briefcase, Clock, FileText, RefreshCw } from "lucide-react"
import api from "@/lib/api"
import { useEmployeeTypes, useRoles, useShifts, useTechnologies } from "@/hooks/use-common"
import { useDesignations } from "@/hooks/use-designations"

interface EmployeeDetailsProps {
  employeeId: string
}

interface Employee {
  id: string
  name?: string
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  phone?: string
  designation?: number | { id: number; name: string }
  employee_type?: number | { id: number; name: string }
  employeeType?: string
  department?: string
  joining_date?: string
  joiningDate?: string
  salary?: string | number
  address?: string
  is_active?: boolean
  status?: string
  role?: number | { id: number; name: string; display_name: string }
  technologies?: number[] | Array<{id: number; name: string}>
  shifts?: number[] | Array<{id: number; name: string; start_time: string; end_time: string}>
  designations?: number[] | Array<{id: number; title: string}>
  shift?: string | { id: number; name: string }
  birth_date?: string | null
  emergency_contact?: string | null
  emergency_phone?: string | null
  employee_details?: {
    document_link?: string
    bank_details?: {
      account_holder?: string
      account_number?: string
      ifsc_code?: string
      branch?: string
    }
  } | null
  gender?: string | null
  marital_status?: string | null
  organization?: number | null
  is_staff?: boolean
  current_address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  } | null
  permanent_address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  } | null
}

interface LeaveBalance {
  type: string
  total: number
  used: number
  remaining: number
}

interface Activity {
  date: string
  action: string
  time: string
}

export function EmployeeDetails({ employeeId }: EmployeeDetailsProps) {
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employeeTypeName, setEmployeeTypeName] = useState<string>('Employee')
  const [roleName, setRoleName] = useState<string>('Employee')
  const [designationName, setDesignationName] = useState<string>('Not specified')
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentAddressText, setCurrentAddressText] = useState<string>("")
  const [permanentAddressText, setPermanentAddressText] = useState<string>("")
  
  // Fetch reference data
  const { employeeTypes } = useEmployeeTypes()
  const { roles } = useRoles()
  const { designations } = useDesignations()
  const { technologies } = useTechnologies()
  const { shifts } = useShifts()

  // Default dummy data
  const dummyEmployee: Employee = {
    id: employeeId,
    name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    username: "johndoe",
    email: "john.doe@techcorp.com",
    phone: "+1 (555) 123-4567",
    designation: 1,
    employee_type: 1,
    department: "Engineering",
    joining_date: "2022-01-15",
    salary: "85000.00",
    is_active: true,
    technologies: [1, 2, 3, 4]
  }

  const dummyLeaveBalance: LeaveBalance[] = [
    { type: "Casual Leave", total: 18, used: 5, remaining: 13 },
    { type: "Sick Leave", total: 12, used: 2, remaining: 10 },
    { type: "Annual Leave", total: 15, used: 8, remaining: 7 },
  ]

  const dummyRecentActivity: Activity[] = [
    { date: "2025-10-01", action: "Clocked in", time: "09:00 AM" },
    { date: "2025-09-28", action: "Leave approved", time: "Casual Leave (2 days)" },
    { date: "2025-09-25", action: "Project assigned", time: "E-commerce Platform" },
    { date: "2025-09-20", action: "Expense submitted", time: "$250.00" },
  ]
  // Utility to resolve address display text (line1) from id or object
  const resolveAddressText = async (addr: any): Promise<string> => {
    try {
      if (!addr) return ""
      if (typeof addr === 'number') {
        const resp = await api.get(`/common/addresses/${addr}/`)
        return resp.data?.line1 || ""
      }
      if (typeof addr === 'object') {
        return addr?.line1 || ""
      }
      return ""
    } catch {
      return ""
    }
  }

  // Add refresh mechanism
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Function to manually refresh data
  const refreshEmployeeData = () => {
    setRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true)
        
        // Fetch employee data with cache busting
        const employeeResponse = await api.get(`/accounts/users/${employeeId}/?_t=${Date.now()}`)
        const employeeData = employeeResponse.data
        setEmployee(employeeData)
        
        // Resolve addresses for display
        const [currAddrText, permAddrText] = await Promise.all([
          resolveAddressText(employeeData.current_address),
          resolveAddressText(employeeData.permanent_address)
        ])
        setCurrentAddressText(currAddrText)
        setPermanentAddressText(permAddrText)
        
        // Fetch employee type name if ID is provided
        if (employeeData.employee_type) {
          try {
            const typeResponse = await api.get(`/common/employee-types/${employeeData.employee_type}/`)
            setEmployeeTypeName(typeResponse.data.name || 'Employee')
          } catch {
            setEmployeeTypeName('Employee')
          }
        }
        
        // Fetch role name if ID is provided
        if (employeeData.role) {
          try {
            const roleResponse = await api.get(`/accounts/roles/${employeeData.role}/`)
            setRoleName(roleResponse.data.display_name || roleResponse.data.name || 'Employee')
          } catch {
            setRoleName('Employee')
          }
        }
        
        // Always use dummy data for leave and activity
        setLeaveBalance(dummyLeaveBalance)
        setRecentActivity(dummyRecentActivity)

      } catch (error) {
        console.error("Error fetching employee data:", error)
        // Use dummy data as fallback
        setEmployee(dummyEmployee)
        setEmployeeTypeName('Full-time')
        setRoleName('Employee')
        setDesignationName('Senior Developer')
        setLeaveBalance(dummyLeaveBalance)
        setRecentActivity(dummyRecentActivity)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [employeeId, refreshKey])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {(employee?.first_name || employee?.name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">
                    {employee?.first_name || employee?.name || 'Employee'}
                    {employee?.last_name && ` ${employee.last_name}`}
                  </h3>
                  <p className="text-muted-foreground">
                    {employee?.designation || 
                     (typeof employee?.employee_type === 'object' ? 
                      (employee.employee_type as any)?.name : employee?.employee_type) || 
                     'Employee'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshEmployeeData}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{employeeTypeName}</Badge>
                <Badge 
                  variant="outline" 
                  className={employee?.is_active || employee?.status === 'active' ? 
                    "bg-green-50 text-green-700 border-green-200" : 
                    "bg-red-50 text-red-700 border-red-200"}
                >
                  {employee?.is_active ? 'Active' : employee?.status || 'Active'}
                </Badge>
                <Badge variant="secondary">{roleName}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{employee?.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee?.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(employee?.joining_date || employee?.joiningDate || '2022-01-01').toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize">{employee?.gender || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Birth Date:</span>
                  <span>{employee?.birth_date ? new Date(employee.birth_date).toLocaleDateString() : 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Marital Status:</span>
                  <span className="capitalize">{employee?.marital_status || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leave">Leave Balance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Employee Type</span>
                  <span className="text-sm font-medium">{employeeTypeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Designations</span>
                  <span className="text-sm font-medium">
                    {employee?.designations && Array.isArray(employee.designations) && employee.designations.length > 0
                      ? employee.designations.map((d: any) => {
                          const designation = designations?.find(des => des.id === (typeof d === 'number' ? d : d.id))
                          return designation?.title
                        }).filter(Boolean).join(', ')
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Salary</span>
                  <span className="text-sm font-medium">${employee?.salary || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <span className="text-sm font-medium">{roleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Technologies</span>
                  <span className="text-sm font-medium">
                    {employee?.technologies && Array.isArray(employee.technologies) && employee.technologies.length > 0
                      ? employee.technologies.map((t: any) => {
                          const tech = technologies?.find(tech => tech.id === (typeof t === 'number' ? t : t.id))
                          return tech?.name
                        }).filter(Boolean).join(', ')
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shifts</span>
                  <span className="text-sm font-medium">
                    {employee?.shifts && Array.isArray(employee.shifts) && employee.shifts.length > 0
                      ? employee.shifts.map((s: any) => {
                          const shift = shifts?.find(sh => sh.id === (typeof s === 'number' ? s : s.id))
                          return shift ? `${shift.name} (${shift.start_time}-${shift.end_time})` : null
                        }).filter(Boolean).join(', ')
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge 
                    variant="outline" 
                    className={employee?.is_active ? 
                      "bg-green-50 text-green-700 border-green-200" : 
                      "bg-red-50 text-red-700 border-red-200"}
                  >
                    {employee?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gender</span>
                  <span className="text-sm font-medium capitalize">{employee?.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Birth Date</span>
                  <span className="text-sm font-medium">
                    {employee?.birth_date ? new Date(employee.birth_date).toLocaleDateString() : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Marital Status</span>
                  <span className="text-sm font-medium capitalize">{employee?.marital_status || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{employee?.phone || 'Not provided'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Current Address</span>
                  <p className="text-sm font-medium">
                    {currentAddressText || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Permanent Address</span>
                  <p className="text-sm font-medium">
                    {permanentAddressText || 'Not provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Account Holder</span>
                  <span className="text-sm font-medium">
                    {employee?.employee_details?.bank_details?.account_holder || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <span className="text-sm font-medium">
                    {employee?.employee_details?.bank_details?.account_number || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">IFSC Code</span>
                  <span className="text-sm font-medium">
                    {employee?.employee_details?.bank_details?.ifsc_code || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Branch</span>
                  <span className="text-sm font-medium">
                    {employee?.employee_details?.bank_details?.branch || 'Not provided'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Document Link</span>
                  <span className="text-sm font-medium">
                    {employee?.employee_details?.document_link ? 
                      <a href={employee.employee_details.document_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Document
                      </a> : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Technologies</span>
                  <span className="text-sm font-medium">
                    {employee?.technologies && Array.isArray(employee.technologies) && employee.technologies.length > 0
                      ? employee.technologies.map((t: any) => {
                          const tech = technologies?.find(tech => tech.id === (typeof t === 'number' ? t : t.id))
                          return tech?.name
                        }).filter(Boolean).join(', ')
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shifts</span>
                  <span className="text-sm font-medium">
                    {employee?.shifts && Array.isArray(employee.shifts) && employee.shifts.length > 0
                      ? employee.shifts.map((s: any) => {
                          const shift = shifts?.find(sh => sh.id === (typeof s === 'number' ? s : s.id))
                          return shift ? `${shift.name} (${shift.start_time}-${shift.end_time})` : null
                        }).filter(Boolean).join(', ')
                      : 'Not specified'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave Balance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveBalance.map((leave: LeaveBalance) => (
                  <div key={leave.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{leave.type}</span>
                      <span className="text-sm text-muted-foreground">
                        {leave.remaining} of {leave.total} remaining
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(leave.remaining / leave.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity: Activity, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
