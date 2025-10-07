import { Holiday } from "@/lib/schemas"
import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"

export const getHolidays = async (): Promise<Holiday[]> => {
  const res: AxiosResponse<Holiday[]> = await axiosInstance.get('/api/v1/common/holidays/')
  return res.data
}

export const createHoliday = async (data: Omit<Holiday, 'id'>): Promise<Holiday> => {
  const res: AxiosResponse<Holiday> = await axiosInstance.post('/api/v1/common/holidays/', data)
  return res.data
}

export const updateHoliday = async (id: number, data: Partial<Omit<Holiday, 'id'>>): Promise<Holiday> => {
  const res: AxiosResponse<Holiday> = await axiosInstance.patch(`/api/v1/common/holidays/${id}/`, data)
  return res.data
}

export const deleteHoliday = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/common/holidays/${id}/`)
}
