import { Holiday } from "@/lib/schemas"
import { apiService } from "@/lib/api"

export const getHolidays = async (): Promise<Holiday[]> => {
  const res = await apiService.get<Holiday[]>('/common/holidays/')
  return res.data
}

export const createHoliday = async (data: Omit<Holiday, 'id'>): Promise<Holiday> => {
  const res = await apiService.post<Holiday>('/common/holidays/', data)
  return res.data
}

export const updateHoliday = async (id: number, data: Partial<Omit<Holiday, 'id'>>): Promise<Holiday> => {
  const res = await apiService.patch<Holiday>(`/common/holidays/${id}/`, data)
  return res.data
}

export const deleteHoliday = async (id: number): Promise<void> => {
  await apiService.delete(`/common/holidays/${id}/`)
}
