import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"
import { LeaveRequest } from "@/lib/schemas"

const base = "/api/v1/attendance/leave-requests/"

export interface LeaveRequestFilters {
  status?: string
  user?: number
  organization?: number
  search?: string
}

export const getLeaveRequests = async (filters: LeaveRequestFilters = {}): Promise<LeaveRequest[]> => {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.user) params.set('user', String(filters.user))
  if (filters.organization) params.set('organization', String(filters.organization))
  if (filters.search) params.set('search', filters.search)

  const url = params.toString() ? `${base}?${params.toString()}` : base
  const res: AxiosResponse<LeaveRequest[]> = await axiosInstance.get(url)
  return res.data
}

export const createLeaveRequest = async (data: Omit<LeaveRequest, "id" | "created_at" | "status" | "approver" | "rejection_reason">): Promise<LeaveRequest> => {
  const res: AxiosResponse<LeaveRequest> = await axiosInstance.post(base, data)
  return res.data
}

export const updateLeaveRequest = async (id: number, data: Partial<Omit<LeaveRequest, "id">>): Promise<LeaveRequest> => {
  const res: AxiosResponse<LeaveRequest> = await axiosInstance.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteLeaveRequest = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${base}${id}/`)
}

export const approveLeaveRequest = async (id: number): Promise<{ message: string }> => {
  const res: AxiosResponse<{ message: string }> = await axiosInstance.post(`${base}${id}/approve/`)
  return res.data
}

export const rejectLeaveRequest = async (id: number, reason?: string): Promise<{ message: string }> => {
  const res: AxiosResponse<{ message: string }> = await axiosInstance.post(`${base}${id}/reject/`, { reason })
  return res.data
}
