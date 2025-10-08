import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { LeaveBalance } from "@/lib/schemas"

const base = "/policies/leave-balances/"

export const getLeaveBalances = async (): Promise<LeaveBalance[]> => {
  const res: AxiosResponse<LeaveBalance[]> = await api.get(base)
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
