import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Role } from "@/lib/schemas"
import { createRole, deleteRole, getRoles, updateRole } from "@/lib/api/roles"

const useRoles = () => {
  const queryClient = useQueryClient()

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: getRoles
  })

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Role> }) => 
      updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
  })

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
  })

  return {
    roles: rolesQuery.data || [],
    isLoading: rolesQuery.isLoading,
    createRole: createRoleMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate
  }
}

export default useRoles