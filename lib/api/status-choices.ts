import api from "@/lib/api"

export interface StatusChoiceDTO {
  id: number
  category: string
  name: string
  color_code?: string | null
  is_active: boolean
}

export async function listStatusChoices(): Promise<StatusChoiceDTO[]> {
  const res = await api.get("/common/status-choices/")
  return res.data
}
