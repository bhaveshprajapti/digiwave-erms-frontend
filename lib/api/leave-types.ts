import { axiosInstance } from "../axios"
import { AxiosResponse } from "axios"
import { LeaveType } from "@/lib/schemas"

const base = "/api/v1/policies/leave-types/"

export const getLeaveTypes = async (): Promise<LeaveType[]> => {
  const res: AxiosResponse<LeaveType[]> = await axiosInstance.get(base)
  return res.data
}

export const createLeaveType = async (data: Omit<LeaveType, "id" | "created_at">): Promise<LeaveType> => {
  const res: AxiosResponse<LeaveType> = await axiosInstance.post(base, data)
  return res.data
}

export const updateLeaveType = async (id: number, data: Partial<Omit<LeaveType, "id">>): Promise<LeaveType> => {
  const res: AxiosResponse<LeaveType> = await axiosInstance.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteLeaveType = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${base}${id}/`)
}
