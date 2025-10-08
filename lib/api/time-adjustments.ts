import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface TimeAdjustmentDTO {
  id: number
  user: number
  attendance?: number | null
  flex_type: number
  date: string // YYYY-MM-DD
  duration_minutes: number
  description?: string | null
  status?: number | null
  approved_by?: number | null
  created_at?: string
}

const base = "/attendance/time-adjustments/"

export interface TimeAdjustmentFilters {
  user?: number
  start_date?: string
  end_date?: string
  status?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface TimeAdjustmentListParams extends TimeAdjustmentFilters {
  page?: number
  page_size?: number
}

export const listTimeAdjustments = async (filters: TimeAdjustmentListParams = {}): Promise<PaginatedResponse<TimeAdjustmentDTO>> => {
  const params = new URLSearchParams()
  if (filters.user) params.set('user', String(filters.user))
  if (filters.start_date) params.set('start_date', filters.start_date)
  if (filters.end_date) params.set('end_date', filters.end_date)
  if (filters.status) params.set('status', String(filters.status))
  if (filters.page) params.set('page', String(filters.page))
  if (filters.page_size) params.set('page_size', String(filters.page_size))
  const url = params.toString() ? `${base}?${params.toString()}` : base
  const res: AxiosResponse<any> = await api.get(url)
  const data = res.data
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data as TimeAdjustmentDTO[] }
  }
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return data as PaginatedResponse<TimeAdjustmentDTO>
  }
  const results: TimeAdjustmentDTO[] = data ? [data as TimeAdjustmentDTO] : []
  return { count: results.length, next: null, previous: null, results }
}

export const createTimeAdjustment = async (data: Omit<TimeAdjustmentDTO, "id" | "created_at">): Promise<TimeAdjustmentDTO> => {
  const res: AxiosResponse<TimeAdjustmentDTO> = await api.post(base, data)
  return res.data
}

export const updateTimeAdjustment = async (id: number, data: Partial<TimeAdjustmentDTO>): Promise<TimeAdjustmentDTO> => {
  const res: AxiosResponse<TimeAdjustmentDTO> = await api.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteTimeAdjustment = async (id: number): Promise<void> => {
  await api.delete(`${base}${id}/`)
}
