"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Edit, Trash2, Loader2, Plus, Briefcase, Clock, DollarSign } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteEmployee } from "@/hooks/use-employees"
import { EmployeeModal } from "./employee-modal"

import { useEmployees } from "@/hooks/use-employees"
import { useEmployeeTypes, useDesignations } from "@/hooks/use-common"

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
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || []

  const handleAddEmployee = () => {
    setModalMode('add')
    setSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const handleEditEmployee = (employee: EmployeeListItem) => {
    setModalMode('edit')
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  const handleRefresh = () => {
    // Use SWR's mutate to refresh the data without full page reload
    mutate()
  }

  const handleDeleteEmployee = async (employee: EmployeeListItem) => {
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


  if (isLoading || loadingTypes || loadingDesignations) {
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16 font-semibold">Sr No.</TableHead>
                  <TableHead className="font-semibold">Username</TableHead>
                  <TableHead className="font-semibold">Full Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee, index) => (
                  <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <a
                        href={`/dashboard/employees/${employee.id}`}
                        className="text-primary hover:text-primary/80 font-medium hover:underline"
                      >
                        {employee.username}
                      </a>
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell className="text-sm">{employee.email}</TableCell>
                    <TableCell className="text-sm">
                      {employee.phone || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {employee.designations && employee.designations.length > 0 ? (
                          employee.designations.map((designationId: number) => {
                            const designation = designations?.find(d => d.id === designationId)
                            return designation ? (
                              <Badge 
                                key={designation.id}
                                variant="outline" 
                                className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200"
                              >
                                {designation.title}
                              </Badge>
                            ) : null
                          })
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {getEmployeeTypeName(employee.employee_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={employee.is_active ? "default" : "secondary"}
                        className={employee.is_active ? 
                          "bg-green-100 text-green-800 border-green-200" : 
                          "bg-red-100 text-red-800 border-red-200"}
                      >
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/employees/${employee.id}`}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          className="h-8 w-8 p-0 hover:bg-yellow-100"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee)}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        
                        {getEmployeeTypeName(employee.employee_type).toLowerCase() === 'fixed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-100"
                            title="Add Fixed Details"
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        
                        {getEmployeeTypeName(employee.employee_type).toLowerCase() === 'hourly' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-purple-100"
                            title="Add Hourly Details"
                          >
                            <Clock className="h-4 w-4 text-purple-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
