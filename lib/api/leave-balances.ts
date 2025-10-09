import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { LeaveBalance } from "@/lib/schemas"

const base = "/leave/api/v1/balances/"

export const getLeaveBalances = async (params?: { user?: number; leave_type?: number; year?: number }): Promise<LeaveBalance[]> => {
  const res: AxiosResponse<LeaveBalance[]> = await api.get(base, { params })
  return res.data
}

export const getMyLeaveBalances = async (): Promise<LeaveBalance[]> => {
  const res: AxiosResponse<LeaveBalance[]> = await api.get(`${base}my_balances/`)
  return res.data
}

export const createLeaveBalance = async (data: Omit<LeaveBalance, "id" | "updated_at">): Promise<LeaveBalance> => {
  const res: AxiosResponse<LeaveBalance> = await api.post(base, data)
  return res.data
}

export const updateLeaveBalance = async (id: number, data: Partial<Omit<LeaveBalance, "id">>): Promise<LeaveBalance> => {
  const res: AxiosResponse<LeaveBalance> = await api.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteLeaveBalance = async (id: number): Promise<void> => {
  await api.delete(`${base}${id}/`)
}

export const bulkUpdateLeaveBalances = async (data: {
  user_ids: number[]
  leave_type: number
  year: number
  opening_balance?: number
  adjustment?: number
}): Promise<{ message: string; updated_count: number }> => {
  const res: AxiosResponse<{ message: string; updated_count: number }> = await api.post(`${base}bulk_update/`, data)
  return res.data
}

export const assignLeaveBalances = async (data: {
  year: number
  user_ids: number[]
  force_reset: boolean
}): Promise<{ message: string; summary: { balances_created: number; balances_updated: number; total_users: number; errors: string[] } }> => {
  const res: AxiosResponse<{ message: string; summary: { balances_created: number; balances_updated: number; total_users: number; errors: string[] } }> = await api.post(`${base}assign_balances/`, data)
  return res.data
}

export const getLeaveBalanceSummary = async (userId: number, year?: number): Promise<any> => {
  const params = year ? { year } : {}
  console.log(`Calling getLeaveBalanceSummary for user ${userId} with params:`, params)
  
  try {
    const res: AxiosResponse<any> = await api.get(`${base}${userId}/summary/`, { params })
    console.log(`Summary API response for user ${userId}:`, res.data)
    return res.data
  } catch (error: any) {
    console.error(`Failed to fetch summary for user ${userId}:`, error?.response?.data || error?.message || error)
    throw error
  }
}

export const initializeBalancesForYear = async (year: number): Promise<{ message: string; created_count: number }> => {
  const res: AxiosResponse<{ message: string; created_count: number }> = await api.post(`${base}initialize_for_year/`, { year })
  return res.data
}
