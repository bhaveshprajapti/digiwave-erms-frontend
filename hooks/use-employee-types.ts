import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmployeeType } from "@/lib/schemas"
import { createEmployeeType, deleteEmployeeType, getEmployeeTypes, updateEmployeeType } from "@/lib/api/employee-types"

const useEmployeeTypes = () => {
  const queryClient = useQueryClient()

  const employeeTypesQuery = useQuery<EmployeeType[]>({
    queryKey: ['employee-types'],
    queryFn: getEmployeeTypes
  })

  const createEmployeeTypeMutation = useMutation({
    mutationFn: createEmployeeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-types'] })
    }
  })

  const updateEmployeeTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<EmployeeType> }) => 
      updateEmployeeType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-types'] })
    }
  })

  const deleteEmployeeTypeMutation = useMutation({
    mutationFn: deleteEmployeeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-types'] })
    }
  })

  return {
    employeeTypes: employeeTypesQuery.data || [],
    isLoading: employeeTypesQuery.isLoading,
    createEmployeeType: createEmployeeTypeMutation.mutate,
    updateEmployeeType: updateEmployeeTypeMutation.mutate,
    deleteEmployeeType: deleteEmployeeTypeMutation.mutate
  }
}

export default useEmployeeTypes