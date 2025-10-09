import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { Employee } from "@/lib/schemas"

export const getUsers = async (): Promise<Employee[]> => {
  const res: AxiosResponse<Employee[]> = await api.get('/accounts/users/')
  return res.data
}

export const getUser = async (id: number): Promise<Employee> => {
  const res: AxiosResponse<Employee> = await api.get(`/accounts/users/${id}/`)
  return res.data
}

export const createUser = async (data: Partial<Employee>): Promise<Employee> => {
  const res: AxiosResponse<Employee> = await api.post('/accounts/users/', data)
  return res.data
}

export const updateUser = async (id: number, data: Partial<Employee>): Promise<Employee> => {
  const res: AxiosResponse<Employee> = await api.patch(`/accounts/users/${id}/`, data)
  return res.data
}

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/accounts/users/${id}/`)
}
