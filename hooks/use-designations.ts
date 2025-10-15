import useSWR from "swr"
import api from "@/lib/api"

export interface Designation {
  id: number
  title: string
  level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useDesignations() {
  const { data, error, isLoading, mutate } = useSWR<Designation[]>(
    "/common/designations/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    designations: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useDesignation(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/common/designations/${id}/` : null,
    async (url) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    designation: data,
    isLoading,
    error,
    mutate,
  }
}

export async function createDesignation(data: { title: string; level: number; is_active?: boolean }) {
  const response = await api.post("/common/designations/", data)
  return response.data
}

export async function updateDesignation(id: string, data: Partial<{ title: string; level: number; is_active: boolean }>) {
  const response = await api.patch(`/common/designations/${id}/`, data)
  return response.data
}

export async function deleteDesignation(id: string) {
  const response = await api.delete(`/common/designations/${id}/`)
  return response.data
}
