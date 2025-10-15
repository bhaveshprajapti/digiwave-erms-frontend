import { Role } from "@/lib/schemas"
import { apiService } from "@/lib/api"

export const getRoles = async (): Promise<Role[]> => {
  const response = await apiService.get<Role[]>('/accounts/roles/')
  return response.data
}

export const createRole = async (data: Omit<Role, 'id'>): Promise<Role> => {
  const response = await apiService.post<Role>('/accounts/roles/', data)
  return response.data
}

export const updateRole = async (id: number, data: Partial<Role>): Promise<Role> => {
  const response = await apiService.patch<Role>(`/accounts/roles/${id}/`, data)
  return response.data
}

export const deleteRole = async (id: number): Promise<void> => {
  await apiService.delete(`/accounts/roles/${id}/`)
}
