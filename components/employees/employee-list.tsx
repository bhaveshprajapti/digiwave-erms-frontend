"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Plus, Clock, DollarSign } from "lucide-react"
import { DataTable, Column } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteEmployee } from "@/hooks/use-employees"
import { EmployeeModal } from "./employee-modal"
import api from "@/lib/api"

import { useEmployees } from "@/hooks/use-employees"
import { useEmployeeTypes, useDesignations } from "@/hooks/use-common"
import { useCurrentUser } from "@/hooks/use-current-user"

interface EmployeeListItem {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  employee_type: number
  designations: number[]
  is_active: boolean
  is_superuser?: boolean
  joining_date: string | null
  gender?: string | null
  birth_date?: string | null
  marital_status?: string | null
  employee_details?: {
    document_link?: string
    bank_details?: {
      account_holder?: string
      account_number?: string
      ifsc_code?: string
      branch?: string
    }
  }
  current_address?: {
    line1?: string
  }
  permanent_address?: {
    line1?: string
  }
}

export function EmployeeList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { employees, isLoading, error, mutate } = useEmployees()
  const { employeeTypes, isLoading: loadingTypes } = useEmployeeTypes()
  const { designations, isLoading: loadingDesignations } = useDesignations()
  const { currentUser, isLoading: loadingCurrentUser } = useCurrentUser()
  const { toast } = useToast()

  const filteredEmployees = employees?.map(emp => {
    // Safely map the Employee type to EmployeeListItem
    const safeEmp = emp as any;
    
    return {
      id: safeEmp.id || '',
      username: safeEmp.username || '',
      first_name: safeEmp.first_name || safeEmp.name || '',
      last_name: safeEmp.last_name || '',
      email: safeEmp.email || '',
      phone: safeEmp.phone || null,
      employee_type: typeof safeEmp.employee_type === 'number' ? safeEmp.employee_type : 
                     typeof safeEmp.employee_type === 'object' && safeEmp.employee_type !== null ? 
                     safeEmp.employee_type.id : 0,
      designations: Array.isArray(safeEmp.designations) ? safeEmp.designations :
                   safeEmp.designation ? [typeof safeEmp.designation === 'number' ? safeEmp.designation : safeEmp.designation?.id].filter(Boolean) : [],
      is_active: Boolean(safeEmp.is_active),
      is_superuser: Boolean(safeEmp.is_superuser),
      joining_date: safeEmp.joining_date || null,
      gender: safeEmp.gender || null,
      birth_date: safeEmp.birth_date || null,
      marital_status: safeEmp.marital_status || null,
      employee_details: safeEmp.employee_details || null,
      current_address: safeEmp.current_address || { line1: '' },
      permanent_address: safeEmp.permanent_address || { line1: '' }
    };
  })?.filter(
    (emp) =>
      (currentUser?.id !== emp.id && !emp.is_superuser) &&
      (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase())),
  ) || []

  const handleAddEmployee = () => {
    setModalMode('add')
    setSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const handleEditEmployee = async (employee: EmployeeListItem) => {
    try {
      // Fetch complete employee details for editing using API utility
      const response = await api.get(`/accounts/users/${employee.id}/`)
      
      if (response.data) {
        console.log('🔍 Full employee data for edit:', response.data)
        setModalMode('edit')
        setSelectedEmployee(response.data)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      toast({
        title: "Error", 
        description: "Failed to fetch employee details",
        variant: "destructive",
      })
    }
  }
  const handleRefresh = () => {
    // Use SWR's mutate to refresh the data without full page reload
    mutate()
  }

  const handleDeleteEmployee = (employee: EmployeeListItem) => {
    setEmployeeToDelete(employee)
  }

  const confirmDelete = async () => {
    if (!employeeToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteEmployee(employeeToDelete.id)
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })
      handleRefresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete employee",
      })
    } finally {
      setIsDeleting(false)
      setEmployeeToDelete(null)
    }
  }

  const getEmployeeTypeName = (typeId: number | null) => {
    return typeId ? employeeTypes?.find(type => type.id === typeId)?.name || 'N/A' : 'N/A'
  }


  if (isLoading || loadingTypes || loadingDesignations || loadingCurrentUser) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-destructive">Error loading employees</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">All Employees</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddEmployee}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<EmployeeListItem>
            columns={[
              { key: 'sr', header: 'Sr No.', cell: (_e, i) => <span className="font-medium">{i + 1}</span>, className: 'w-16' },
              { key: 'username', header: 'Username', cell: (e) => (
                <a href={`/dashboard/employees/${e.id}`} className="text-primary hover:text-primary/80 font-medium hover:underline">{e.username}</a>
              )},
              { key: 'full_name', header: 'Full Name', cell: (e) => (
                <span className="font-medium">{e.first_name} {e.last_name}</span>
              )},
              { key: 'email', header: 'Email', cell: (e) => <span className="text-sm">{e.email}</span> },
              { key: 'phone', header: 'Phone', cell: (e) => <span className="text-sm">{e.phone || '-'}</span> },
              { key: 'designation', header: 'Designation', cell: (employee) => (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {employee.designations && employee.designations.length > 0 ? (
                    employee.designations.map((designationId: number) => {
                      const designation = designations?.find(d => d.id === designationId)
                      return designation ? (
                        <Badge key={designation.id} variant="outline" className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                          {designation.title}
                        </Badge>
                      ) : null
                    })
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              )},
              { key: 'type', header: 'Type', cell: (e) => (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{getEmployeeTypeName(e.employee_type)}</Badge>
              )},
              { key: 'status', header: 'Status', cell: (e) => (
                <Badge variant={e.is_active ? 'default' : 'secondary'} className={e.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                  {e.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )},
              { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (employee) => (
                <div className="flex items-center justify-center">
                  <ActionButtons
                    onEdit={() => handleEditEmployee(employee)}
                    onDelete={currentUser?.id !== employee.id && !employee.is_superuser ? () => handleDeleteEmployee(employee) : undefined}
                    extras={[
                      ...(getEmployeeTypeName(employee.employee_type).toLowerCase() === 'fixed'
                        ? [{ title: 'Add Fixed Details', onClick: () => {}, className: 'hover:bg-green-100', icon: <DollarSign className="h-4 w-4 text-green-600" /> }] as any
                        : []),
                      ...(getEmployeeTypeName(employee.employee_type).toLowerCase() === 'hourly'
                        ? [{ title: 'Add Hourly Details', onClick: () => {}, className: 'hover:bg-purple-100', icon: <Clock className="h-4 w-4 text-purple-600" /> }] as any
                        : []),
                    ]}
                  />
                </div>
              )},
            ]}
            data={filteredEmployees}
            getRowKey={(e) => e.id}
            striped
            emptyText="No employees found."
          />
        </CardContent>
      </Card>
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        mode={modalMode}
        onSuccess={handleRefresh}
      />

      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              <strong> {employeeToDelete?.first_name} {employeeToDelete?.last_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
