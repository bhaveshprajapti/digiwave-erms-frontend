"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, Calendar, Briefcase, MapPin, User, Building, CreditCard } from "lucide-react"
import api from "@/lib/api"
import { useEmployeeTypes, useRoles, useShifts, useTechnologies } from "@/hooks/use-common"
import { useDesignations } from "@/hooks/use-designations"

interface EmployeeDetailsModalProps {
  employeeId: string | null
  isOpen: boolean
  onClose: () => void
}

export function EmployeeDetailsModal({ employeeId, isOpen, onClose }: EmployeeDetailsModalProps) {
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const { employeeTypes } = useEmployeeTypes()
  const { roles } = useRoles()
  const { designations } = useDesignations()
  const { technologies } = useTechnologies()
  const { shifts } = useShifts()

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchEmployeeData()
    }
  }, [isOpen, employeeId])

  const fetchEmployeeData = async () => {
    if (!employeeId) return
    
    setLoading(true)
    try {
      const response = await api.get(`/accounts/users/${employeeId}/`)
      setEmployee(response.data)
    } catch (error) {
      console.error("Error fetching employee:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeTypeName = () => {
    if (!employee?.employee_type) return 'N/A'
    const type = employeeTypes?.find(t => t.id === employee.employee_type)
    return type?.name || 'N/A'
  }

  const getRoleName = () => {
    if (!employee?.role) return 'N/A'
    const role = roles?.find(r => r.id === employee.role)
    return role?.display_name || role?.name || 'N/A'
  }

  const getDesignationNames = () => {
    if (!employee?.designations || employee.designations.length === 0) return 'Not specified'
    return employee.designations.map((d: any) => {
      const designation = designations?.find(des => des.id === (typeof d === 'number' ? d : d.id))
      return designation?.title
    }).filter(Boolean).join(', ')
  }

  const getTechnologyNames = () => {
    if (!employee?.technologies || employee.technologies.length === 0) return 'Not specified'
    return employee.technologies.map((t: any) => {
      const tech = technologies?.find(tech => tech.id === (typeof t === 'number' ? t : t.id))
      return tech?.name
    }).filter(Boolean).join(', ')
  }

  const getShiftNames = () => {
    if (!employee?.shifts || employee.shifts.length === 0) return 'Not specified'
    return employee.shifts.map((s: any) => {
      const shift = shifts?.find(sh => sh.id === (typeof s === 'number' ? s : s.id))
      return shift ? `${shift.name} (${shift.start_time}-${shift.end_time})` : null
    }).filter(Boolean).join(', ')
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-6xl !w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Employee Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl !w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {(employee?.first_name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {employee?.first_name} {employee?.last_name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="default">{getEmployeeTypeName()}</Badge>
                <Badge variant={employee?.is_active ? "default" : "secondary"} className={employee?.is_active ? "bg-green-600" : ""}>
                  {employee?.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{getRoleName()}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Contact Information */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{employee?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{employee?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium capitalize">{employee?.gender || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Birth Date:</span>
                  <span className="font-medium">
                    {employee?.birth_date ? new Date(employee.birth_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Marital Status:</span>
                  <span className="font-medium capitalize">{employee?.marital_status || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Employee Type:</span>
                  <p className="font-medium">{getEmployeeTypeName()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <p className="font-medium">{getRoleName()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Designations:</span>
                  <p className="font-medium">{getDesignationNames()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Joining Date:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {employee?.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Technologies:</span>
                  <p className="font-medium">{getTechnologyNames()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Shifts:</span>
                  <p className="font-medium">{getShiftNames()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          {employee?.employee_details?.bank_details && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Account Holder:</span>
                    <p className="font-medium">{employee.employee_details.bank_details.account_holder || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account Number:</span>
                    <p className="font-medium">{employee.employee_details.bank_details.account_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IFSC Code:</span>
                    <p className="font-medium">{employee.employee_details.bank_details.ifsc_code || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Branch:</span>
                    <p className="font-medium">{employee.employee_details.bank_details.branch || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
