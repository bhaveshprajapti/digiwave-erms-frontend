import useSWR from "swr"
import api from "@/lib/api"
import { Employee } from "@/lib/schemas"

export function useEmployees() {
  const { data, error, isLoading, mutate } = useSWR<Employee[]>(
    "/accounts/users/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    employees: data,
    isLoading,
    error,
    mutate,
  }
}

export function useEmployee(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/accounts/users/${id}/` : null,
    async (url) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    employee: data,
    isLoading,
    error,
    mutate,
  }
}

export async function createEmployee(data: FormData | Partial<Employee>) {
  const isFormData = data instanceof FormData
  const response = await api.post("/accounts/users/", data, {
    headers: isFormData ? {
      'Content-Type': 'multipart/form-data',
    } : undefined,
  })
  return response.data
}

export async function updateEmployee(id: string, data: FormData | Partial<Employee>) {
  const isFormData = data instanceof FormData
  const response = await api.put(`/accounts/users/${id}/`, data, {
    headers: isFormData ? {
      'Content-Type': 'multipart/form-data',
    } : undefined,
  })
  return response.data
}

export async function deleteEmployee(id: string) {
  const response = await api.delete(`/accounts/users/${id}/`)
  return response.data
}