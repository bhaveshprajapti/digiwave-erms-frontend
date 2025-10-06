import { EmployeeType } from "@/lib/schemas"
import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"

export const getEmployeeTypes = async (): Promise<EmployeeType[]> => {
  const response: AxiosResponse<EmployeeType[]> = await axiosInstance.get('/api/v1/common/employee-types/')
  return response.data
}

export const createEmployeeType = async (data: Omit<EmployeeType, 'id'>): Promise<EmployeeType> => {
  const response: AxiosResponse<EmployeeType> = await axiosInstance.post('/api/v1/common/employee-types/', data)
  return response.data
}

export const updateEmployeeType = async (id: number, data: Partial<EmployeeType>): Promise<EmployeeType> => {
  const response: AxiosResponse<EmployeeType> = await axiosInstance.patch(`/api/v1/common/employee-types/${id}/`, data)
  return response.data
}

export const deleteEmployeeType = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/common/employee-types/${id}/`)
}