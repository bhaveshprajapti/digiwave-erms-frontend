import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface ApprovalDTO {
  id: number
  content_type: number
  object_id: number
  approver: number
  level: number
  status?: number | null
  comments?: string | null
  decided_at?: string | null
  is_escalated?: boolean
  created_at?: string
}

const base = "/attendance/approvals/"

export const listApprovals = async (): Promise<ApprovalDTO[]> => {
  const res: AxiosResponse<ApprovalDTO[]> = await api.get(base)
  return res.data
}

export const updateApproval = async (id: number, data: Partial<ApprovalDTO>): Promise<ApprovalDTO> => {
  const res: AxiosResponse<ApprovalDTO> = await api.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteApproval = async (id: number): Promise<void> => {
  await api.delete(`${base}${id}/`)
}
