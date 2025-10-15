"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, Calendar, Briefcase, Building, Eye, EyeOff, LinkIcon, FileText, Clock, Copy, Check } from "lucide-react"
import api from "@/lib/api"
import { useEmployeeTypes, useRoles, useShifts, useTechnologies } from "@/hooks/use-common"
import { useDesignations } from "@/hooks/use-designations"
import { useCurrentUser } from "@/hooks/use-current-user"

type Shift = { name: string; start_time?: string; end_time?: string }
type Address = { line1?: string }
type BankDetails = { account_holder?: string; account_number?: string; ifsc_code?: string; branch?: string }
type EmployeeDetails = { bank_details?: BankDetails; document_link?: string | null }

export interface Employee {
  id?: string | number
  username?: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  email?: string
  phone?: string
  joining_date?: string
  salary?: number | string
  employee_type?: number
  role?: number
  designations?: number[]
  technologies?: number[]
  shifts?: number[]
  gender?: string
  birth_date?: string
  marital_status?: string
  current_address?: Address
  permanent_address?: Address
  password?: string
  plain_password?: string
  employee_details?: EmployeeDetails
}

interface EmployeeDetailsModalProps {
  employeeId: string | null
  isOpen: boolean
  onClose: () => void
}

export function EmployeeDetailsModal({ employeeId, isOpen, onClose }: EmployeeDetailsModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { employeeTypes } = useEmployeeTypes()
  const { roles } = useRoles()
  const { designations } = useDesignations()
  const { technologies } = useTechnologies()
  const { shifts } = useShifts()
  const { currentUser } = useCurrentUser()

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
      console.log('📋 Employee data received:', response.data)
      console.log('🔐 Plain password field:', response.data.plain_password)
      console.log('🔒 Password field:', response.data.password)
      console.log('👤 Current user:', currentUser)
      console.log('🛡️ Is current user staff/admin?', currentUser?.is_staff || currentUser?.is_superuser)
      setEmployee(response.data)
    } catch (error) {
      console.error("Error fetching employee:", error)
    } finally {
      setLoading(false)
    }
  }

  const displayName = useMemo(() => {
    const fn = employee?.first_name || ""
    const ln = employee?.last_name || ""
    return `${fn} ${ln}`.trim() || employee?.username || "Unknown User"
  }, [employee])

  const initial = useMemo(
    () => (employee?.first_name?.charAt(0) || employee?.username?.charAt(0) || "U").toUpperCase(),
    [employee],
  )

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
    if (!employee?.designations || employee.designations.length === 0) return []
    return employee.designations.map((d: any) => {
      const designation = designations?.find(des => des.id === (typeof d === 'number' ? d : d.id))
      return designation?.title
    }).filter(Boolean)
  }

  const getTechnologyNames = () => {
    if (!employee?.technologies || employee.technologies.length === 0) return []
    return employee.technologies.map((t: any) => {
      const tech = technologies?.find(tech => tech.id === (typeof t === 'number' ? t : t.id))
      return tech?.name
    }).filter(Boolean)
  }

  const getShiftNames = () => {
    if (!employee?.shifts || employee.shifts.length === 0) return []
    return employee.shifts.map((s: any) => {
      const shift = shifts?.find(sh => sh.id === (typeof s === 'number' ? s : s.id))
      return shift ? `${shift.name} (${shift.start_time}-${shift.end_time})` : null
    }).filter(Boolean)
  }

  const shiftText = useMemo(() => {
    const shifts = getShiftNames()
    return shifts.length > 0 ? shifts.join(" | ") : "N/A"
  }, [employee, shifts])

  const technologiesText = useMemo(() => {
    const techs = getTechnologyNames()
    return techs.length > 0 ? techs.join(", ") : "N/A"
  }, [employee, technologies])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-6xl !w-[95vw] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Employee Details...</DialogTitle>
            <DialogDescription className="sr-only">Please wait while employee details are being loaded</DialogDescription>
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
      <DialogContent
        className="
          !max-w-6xl !w-[95vw]
          p-6
          max-h-[90vh]
          overflow-y-auto
          bg-gradient-to-b from-background to-background/95
          rounded-xl
        "
      >
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 rounded-full border-2 border-primary/30 ring-2 ring-primary/10">
                <AvatarFallback className="rounded-full bg-primary/15 text-primary text-lg font-medium">{initial}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                  employee.is_active ? "bg-green-500" : "bg-red-500"
                }`}
                aria-label={employee.is_active ? "Active" : "Inactive"}
              />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground">{displayName}</DialogTitle>
              <DialogDescription className="sr-only">Detailed information about {displayName}</DialogDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {getEmployeeTypeName() !== 'N/A' ? (
                  <Badge className="px-3 py-1 text-xs bg-primary/20 text-primary font-medium">
                    Type: {getEmployeeTypeName()}
                  </Badge>
                ) : null}
                {getRoleName() !== 'N/A' ? (
                  <Badge variant="outline" className="px-3 py-1 text-xs border-primary/30">
                    Role: {getRoleName()}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">ID:</span> {employee.id || "N/A"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Username:</span> {employee.username || "N/A"}
                  {employee?.username && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(employee.username, 'username')}
                      className="h-4 w-4 p-0 ml-1"
                      title="Copy username"
                    >
                      {copiedField === 'username' ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3" />
                      }
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Password:</span>
                  <span className="font-mono text-muted-foreground">
                    {showPassword ? (employee.plain_password || employee.password || "Not available") : "••••••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-primary/10"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {showPassword && (employee?.plain_password || employee?.password) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(employee?.plain_password || employee?.password || '', 'password')}
                      className="h-4 w-4 p-0"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3" />
                      }
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Shift:</span> {shiftText}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Section */}
          <section className="rounded-lg border bg-card shadow-sm p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Gender" value={employee.gender} />
                <Field
                  label="Birth Date"
                  value={employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : "N/A"}
                />
                <Field label="Marital Status" value={employee.marital_status} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Current Address" value={employee.current_address?.line1 || "N/A"} />
                <Field label="Permanent Address" value={employee.permanent_address?.line1 || "N/A"} />
              </div>
              <div className="mt-4">
                <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Bank Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <SmallField
                    label="Account Holder"
                    value={employee.employee_details?.bank_details?.account_holder || "N/A"}
                  />
                  <SmallField
                    label="Account Number"
                    value={employee.employee_details?.bank_details?.account_number || "N/A"}
                  />
                  <SmallField label="IFSC Code" value={employee.employee_details?.bank_details?.ifsc_code || "N/A"} />
                  <SmallField label="Branch" value={employee.employee_details?.bank_details?.branch || "N/A"} />
                </div>
              </div>
            </div>
          </section>

          {/* Professional Section */}
          <section className="rounded-lg border bg-card shadow-sm p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="grid grid-cols-1 gap-4">
                <Field label="Designations" value={getDesignationNames().join(", ") || "N/A"} className="sm:col-span-2" />
                <Field label="Technologies" value={technologiesText} className="sm:col-span-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email" value={employee.email} />
                <Field label="Phone" value={employee.phone} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Joined"
                  value={employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : "N/A"}
                />
                <Field label="Salary" value={employee.salary ? `$${employee.salary}` : "N/A"} />
              </div>
              <div className="mt-4">
                <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents
                </h4>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Document Link</span>
                  {employee.employee_details?.document_link ? (
                    <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs border-primary/30 hover:bg-primary/10">
                      <a
                        href={employee.employee_details.document_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View document"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <LinkIcon className="h-4 w-4" /> View Document
                        </span>
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">No document</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium truncate">{value || "N/A"}</div>
    </div>
  )
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string
  value?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-[auto,1fr] items-center gap-x-3 ${className}`}>
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-medium truncate">{value || "N/A"}</span>
    </div>
  )
}

function SmallField({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-xs font-medium truncate">{value || "N/A"}</span>
    </div>
  )
}
