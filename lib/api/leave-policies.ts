import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { LeavePolicy } from "@/lib/schemas"

const base = "/leave/api/v1/policies/"

export const getLeavePolicies = async (params?: { leave_type?: number }): Promise<LeavePolicy[]> => {
  const res: AxiosResponse<LeavePolicy[]> = await api.get(base, { params })
  return res.data
}

export const createLeavePolicy = async (data: Omit<LeavePolicy, "id" | "created_at">): Promise<LeavePolicy> => {
  const res: AxiosResponse<LeavePolicy> = await api.post(base, data)
  return res.data
}

export const updateLeavePolicy = async (id: number, data: Partial<Omit<LeavePolicy, "id">>): Promise<LeavePolicy> => {
  const res: AxiosResponse<LeavePolicy> = await api.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteLeavePolicy = async (id: number): Promise<void> => {
  await api.delete(`${base}${id}/`)
}

export const cloneLeavePolicy = async (id: number, name: string): Promise<LeavePolicy> => {
  const res: AxiosResponse<LeavePolicy> = await api.post(`${base}${id}/clone/`, { name })
  return res.data
}
