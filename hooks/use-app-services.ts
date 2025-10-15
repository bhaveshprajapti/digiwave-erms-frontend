import useSWR from "swr"
import api from "@/lib/api"

export interface AppService {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useAppServices() {
  const { data, error, isLoading, mutate } = useSWR<AppService[]>(
    "/common/app-services/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    appServices: data,
    isLoading,
    error,
    mutate,
  }
}

export function useAppService(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/common/app-services/${id}/` : null,
    async (url) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    appService: data,
    isLoading,
    error,
    mutate,
  }
}

export async function createAppService(data: Partial<AppService>) {
  const response = await api.post("/common/app-services/", data)
  return response.data
}

export async function updateAppService(id: string, data: Partial<AppService>) {
  const response = await api.patch(`/common/app-services/${id}/`, data)
  return response.data
}

export async function deleteAppService(id: string) {
  const response = await api.delete(`/common/app-services/${id}/`)
  return response.data
}