import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface AttendanceDTO {
  id: number
  user: number
  date: string // YYYY-MM-DD
  sessions?: any
  total_hours?: string | null // HH:MM:SS
  location?: any
  notes?: string | null
  created_at?: string
}

const base = "/attendance/attendances/"

export interface AttendanceFilters {
  user?: number
  start_date?: string
  end_date?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AttendanceListParams extends AttendanceFilters {
  page?: number
  page_size?: number
}

export const listAttendances = async (filters: AttendanceListParams = {}): Promise<PaginatedResponse<AttendanceDTO>> => {
  const params = new URLSearchParams()
  if (filters.user) params.set('user', String(filters.user))
  if (filters.start_date) params.set('start_date', filters.start_date)
  if (filters.end_date) params.set('end_date', filters.end_date)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.page_size) params.set('page_size', String(filters.page_size))
  const url = params.toString() ? `${base}?${params.toString()}` : base
  const res: AxiosResponse<any> = await api.get(url)
  const data = res.data
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data as AttendanceDTO[] }
  }
  // If backend returns DRF-style envelope
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return data as PaginatedResponse<AttendanceDTO>
  }
  // Fallback: single object or unknown shape
  const results: AttendanceDTO[] = data ? [data as AttendanceDTO] : []
  return { count: results.length, next: null, previous: null, results }
}

export const createAttendance = async (data: Omit<AttendanceDTO, "id" | "created_at">): Promise<AttendanceDTO> => {
  const res: AxiosResponse<AttendanceDTO> = await api.post(base, data)
  return res.data
}

export const updateAttendance = async (id: number, data: Partial<AttendanceDTO>): Promise<AttendanceDTO> => {
  const res: AxiosResponse<AttendanceDTO> = await api.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteAttendance = async (id: number): Promise<void> => {
  await api.delete(`${base}${id}/`)
}
