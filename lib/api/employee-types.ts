import { EmployeeType } from "@/lib/schemas"
import { apiService } from "@/lib/api"

export const getEmployeeTypes = async (): Promise<EmployeeType[]> => {
  const response = await apiService.get<EmployeeType[]>('/common/employee-types/')
  return response.data
}

export const createEmployeeType = async (data: Omit<EmployeeType, 'id'>): Promise<EmployeeType> => {
  const response = await apiService.post<EmployeeType>('/common/employee-types/', data)
  return response.data
}

export const updateEmployeeType = async (id: number, data: Partial<EmployeeType>): Promise<EmployeeType> => {
  const response = await apiService.patch<EmployeeType>(`/common/employee-types/${id}/`, data)
  return response.data
}

export const deleteEmployeeType = async (id: number): Promise<void> => {
  await apiService.delete(`/common/employee-types/${id}/`)
}
