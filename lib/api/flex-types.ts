import api from "@/lib/api"

export interface FlexTypeDTO {
  id: number
  name: string
  code: string
  duration_minutes: number
  max_per_month: number
  is_late: boolean
  is_early: boolean
  description?: string | null
  is_active: boolean
}

export async function listFlexTypes(): Promise<FlexTypeDTO[]> {
  const res = await api.get("/policies/flex-allowance-types/")
  return res.data
}
