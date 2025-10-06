import useSWR from "swr"
import api from "@/lib/api"

export interface CurrentUser {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser?: boolean
  is_staff?: boolean
  is_active?: boolean
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<CurrentUser>(
    "/accounts/users/me/",
    async (url: string) => {
      const response = await api.get(url)
      return response.data
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    currentUser: data,
    isLoading,
    error,
    mutate,
  }
}
