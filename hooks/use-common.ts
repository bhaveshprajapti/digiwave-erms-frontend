import useSWR from "swr"
import api from "@/lib/api"

export interface EmployeeType {
  id: number
  name: string
  is_active: boolean
}

export interface Role {
  id: number
  name: string
  display_name: string
  is_active: boolean
}

export function useEmployeeTypes() {
  const { data, error, isLoading } = useSWR<EmployeeType[]>(
    "/common/employee-types/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    employeeTypes: data,
    isLoading,
    error,
  }
}

export function useRoles() {
  const { data, error, isLoading } = useSWR<Role[]>(
    "/accounts/roles/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    roles: data,
    isLoading,
    error,
  }
}

export interface Shift {
  id: number
  name: string
  start_time: string
  end_time: string
  is_active: boolean
}

export function useShifts() {
  const { data, error, isLoading } = useSWR<Shift[]>(
    "/common/shifts/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    shifts: data,
    isLoading,
    error,
  }
}

export interface Designation {
  id: number
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Technology {
  id: number
  name: string
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useTechnologies() {
  const { data, error, isLoading, mutate } = useSWR<Technology[]>(
    "/common/technologies/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  const createTechnology = async (technologyData: { name: string; description?: string; category?: string; is_active?: boolean }) => {
    const response = await api.post("/common/technologies/", technologyData)
    mutate()
    return response.data
  }

  const updateTechnology = async (id: number, technologyData: { name: string; description?: string; category?: string; is_active?: boolean }) => {
    const response = await api.put(`/common/technologies/${id}/`, technologyData)
    mutate()
    return response.data
  }

  const deleteTechnology = async (id: number) => {
    await api.delete(`/common/technologies/${id}/`)
    mutate()
  }

  return {
    technologies: data,
    isLoading,
    error,
    createTechnology,
    updateTechnology,
    deleteTechnology,
  }
}

export function useDesignations() {
  const { data, error, isLoading } = useSWR<Designation[]>(
    "/common/designations/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    }
  )

  return {
    designations: data,
    isLoading,
    error,
  }
}