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

// New check-in/check-out endpoints
export interface CheckInData {
  location?: {
    lat: number
    lng: number
  }
}

export interface CheckInResponse {
  message: string
  check_in_time: string
  session_count: number
}

export interface CheckOutResponse {
  message: string
  check_out_time: string
  session_count: number
  total_hours: string
  break_time: string
}

export interface AttendanceStatus {
  date: string
  is_checked_in: boolean
  total_sessions: number
  completed_sessions: number
  total_hours: string
  last_check_in?: string
  last_check_out?: string
  break_time: string
  is_on_leave: boolean
  attendance_status: string
}

export const checkIn = async (data: CheckInData = {}): Promise<CheckInResponse> => {
  const res: AxiosResponse<CheckInResponse> = await api.post(`${base}check_in/`, data)
  return res.data
}

export const checkOut = async (data: CheckInData = {}): Promise<CheckOutResponse> => {
  const res: AxiosResponse<CheckOutResponse> = await api.post(`${base}check_out/`, data)
  return res.data
}

export const getAttendanceStatus = async (): Promise<AttendanceStatus> => {
  const res: AxiosResponse<AttendanceStatus> = await api.get(`${base}status/`)
  return res.data
}
