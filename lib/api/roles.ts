import { CreateEmployeeData, Role } from "@/lib/schemas"
import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"

export const getRoles = async (): Promise<Role[]> => {
  const response: AxiosResponse<Role[]> = await axiosInstance.get('/api/v1/accounts/roles/')
  return response.data
}

export const createRole = async (data: Omit<Role, 'id'>): Promise<Role> => {
  const response: AxiosResponse<Role> = await axiosInstance.post('/api/v1/accounts/roles/', data)
  return response.data
}

export const updateRole = async (id: number, data: Partial<Role>): Promise<Role> => {
  const response: AxiosResponse<Role> = await axiosInstance.patch(`/api/v1/accounts/roles/${id}/`, data)
  return response.data
}

export const deleteRole = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/accounts/roles/${id}/`)
}