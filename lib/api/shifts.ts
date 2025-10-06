import { Shift } from "@/lib/schemas"
import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"

export const getShifts = async (): Promise<Shift[]> => {
  const response: AxiosResponse<Shift[]> = await axiosInstance.get('/api/v1/common/shifts/')
  return response.data
}

export const createShift = async (data: Omit<Shift, 'id'>): Promise<Shift> => {
  console.log('Sending shift data:', JSON.stringify(data, null, 2))
  try {
    const response: AxiosResponse<Shift> = await axiosInstance.post('/api/v1/common/shifts/', data)
    return response.data
  } catch (error: any) {
    console.error('API Error Response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestData: data
    })
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data))
    }
    throw error
  }
}

export const updateShift = async (id: number, data: Partial<Shift>): Promise<Shift> => {
  const response: AxiosResponse<Shift> = await axiosInstance.patch(`/api/v1/common/shifts/${id}/`, data)
  return response.data
}

export const deleteShift = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/common/shifts/${id}/`)
}