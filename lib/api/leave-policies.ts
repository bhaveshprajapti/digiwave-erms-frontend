import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"
import { LeavePolicy } from "@/lib/schemas"

const base = "/api/v1/policies/leave-policies/"

export const getLeavePolicies = async (): Promise<LeavePolicy[]> => {
  const res: AxiosResponse<LeavePolicy[]> = await axiosInstance.get(base)
  return res.data
}

export const createLeavePolicy = async (data: Omit<LeavePolicy, "id" | "created_at">): Promise<LeavePolicy> => {
  const res: AxiosResponse<LeavePolicy> = await axiosInstance.post(base, data)
  return res.data
}

export const updateLeavePolicy = async (id: number, data: Partial<Omit<LeavePolicy, "id">>): Promise<LeavePolicy> => {
  const res: AxiosResponse<LeavePolicy> = await axiosInstance.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteLeavePolicy = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${base}${id}/`)
}
