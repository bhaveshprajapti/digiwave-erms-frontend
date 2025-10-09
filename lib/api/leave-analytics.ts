import api from "@/lib/api"
import { AxiosResponse } from "axios"

const base = "/leave/api/v1/"

export interface LeaveCalendarEntry {
  id: number
  user: number
  user_name: string
  date: string
  leave_type_name: string
  leave_type_color: string
  is_half_day: boolean
  half_day_period?: 'morning' | 'afternoon'
}

export interface LeaveStatistics {
  user_id?: number
  user_name?: string
  leave_type?: string
  leave_type_code?: string
  total_available?: number
  used_balance?: number
  remaining_balance?: number
  pending_applications?: number
  period?: string
  total_applications?: number
  approved_applications?: number
  rejected_applications?: number
  pending_applications_count?: number
  total_days_taken?: number
  by_leave_type?: Record<string, number>
  by_role?: Record<string, number>
}

export const getLeaveCalendar = async (startDate: string, endDate: string): Promise<LeaveCalendarEntry[]> => {
  const res: AxiosResponse<LeaveCalendarEntry[]> = await api.get(`${base}calendar/`, {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  })
  return res.data
}

export const getLeaveStatistics = async (year?: number): Promise<LeaveStatistics[] | LeaveStatistics> => {
  const params = year ? { year: year.toString() } : undefined
  const res: AxiosResponse<LeaveStatistics[] | LeaveStatistics> = await api.get(`${base}statistics/`, { params })
  return res.data
}

export interface LeaveAnalyticsData {
  overview: {
    total_applications: number
    pending_applications: number
    approved_applications: number
    rejected_applications: number
    total_days_requested: number
    total_days_approved: number
  }
  by_leave_type: Array<{
    leave_type: number
    leave_type_name: string
    total_applications: number
    total_days: number
    avg_days_per_application: number
  }>
  by_month: Array<{
    month: string
    total_applications: number
    total_days: number
  }>
  by_department: Array<{
    department: string
    total_applications: number
    total_days: number
    avg_days_per_employee: number
  }>
  top_users: Array<{
    user_id: number
    user_name: string
    total_applications: number
    total_days: number
  }>
  approval_stats: {
    avg_approval_time_hours: number
    pending_over_24h: number
    pending_over_week: number
  }
}

export const getLeaveAnalytics = async (filters?: { year?: number; leave_type?: number }): Promise<LeaveAnalyticsData> => {
  const res: AxiosResponse<LeaveAnalyticsData> = await api.get(`${base}analytics/`, { params: filters })
  return res.data
}