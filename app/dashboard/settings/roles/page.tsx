"use client"
import { ManagementTable } from "@/components/common/management-table"
import { Card, CardContent } from "@/components/ui/card"
import { Role } from "@/lib/schemas"
import { getRoles, createRole, updateRole, deleteRole } from "@/lib/api/roles"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function RolesPage() {
  const queryClient = useQueryClient()

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: getRoles,
  })

  const addRole = useMutation({
    mutationFn: (data: Partial<Role>) => {
      const payload: any = {
        name: data.name,
        display_name: data.name,
        description: data.description,
        is_active: data.is_active,
      }
      return createRole(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const editRole = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Role> }) => {
      const payload: any = {
        ...data,
      }
      if (data.name) {
        payload.display_name = data.name
      }
      return updateRole(id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const removeRole = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  return (
    <Card>
      <CardContent className="pt-6">
        <ManagementTable<Role>
          title="Roles"
          description=""
          items={roles ?? []}
          isLoading={isLoading}
          fields={[
            { key: "name", label: "Name", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "is_active", label: "Status", type: "switch" },
          ]}
          onAdd={async (data) => addRole.mutate(data)}
          onEdit={async (id, data) => editRole.mutate({ id, data })}
          onDelete={async (id) => removeRole.mutate(id)}
        />
      </CardContent>
    </Card>
  )
}
