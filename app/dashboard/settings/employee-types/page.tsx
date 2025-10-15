"use client"

import { ManagementTable } from "@/components/common/management-table"
import { Card, CardContent } from "@/components/ui/card"
import { EmployeeType } from "@/hooks/use-common"
import api from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function EmployeeTypesPage() {
  const queryClient = useQueryClient()

  const { data: employeeTypes, isLoading } = useQuery<EmployeeType[]>({
    queryKey: ["employeeTypes"],
    queryFn: async () => {
      const response = await api.get("/common/employee-types/")
      return response.data
    },
  })

  const addMutation = useMutation({
    mutationFn: (data: Partial<EmployeeType>) => 
      api.post("/common/employee-types/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeTypes"] })
      toast.success("Employee type added successfully")
    },
    onError: (error) => {
      toast.error("Failed to add employee type")
      console.error("Error adding employee type:", error)
    }
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmployeeType> }) =>
      api.put(`/common/employee-types/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeTypes"] })
      toast.success("Employee type updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update employee type")
      console.error("Error updating employee type:", error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/common/employee-types/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeTypes"] })
      toast.success("Employee type deleted successfully")
    },
    onError: (error) => {
      toast.error("Failed to delete employee type")
      console.error("Error deleting employee type:", error)
    }
  })

  const handleAdd = async (data: Partial<EmployeeType>) => {
    addMutation.mutate(data)
  }

  const handleEdit = async (id: number, data: Partial<EmployeeType>) => {
    editMutation.mutate({ id, data })
  }

  const handleDelete = async (id: number) => {
    deleteMutation.mutate(id)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ManagementTable<EmployeeType>
          title="Employee Types"
          description=""
          items={employeeTypes ?? []}
          isLoading={isLoading}
          fields={[
            { key: "name", label: "Name", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "is_active", label: "Status", type: "switch" },
          ]}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  )
}