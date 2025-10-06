"use client"
import { ManagementTable } from "@/components/common/management-table"
import { Card, CardContent } from "@/components/ui/card"
import { Role } from "@/lib/schemas"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function RolesPage() {
  const queryClient = useQueryClient()
  const API_BASE_URL = "http://127.0.0.1:8000/api/v1/accounts"

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/roles/`)
      if (!response.ok) throw new Error('Failed to fetch roles')
      return response.json()
    },
  })

  const addRole = useMutation({
    mutationFn: (data: Partial<Role>) =>
      fetch(`${API_BASE_URL}/roles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const editRole = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Role> }) =>
      fetch(`${API_BASE_URL}/roles/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const deleteRole = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API_BASE_URL}/roles/${id}/`, {
        method: 'DELETE',
      }).then(res => res),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  return (
    <Card>
      <CardContent className="pt-6">
        <ManagementTable<Role>
          title="Roles"
          description="Manage employee roles like Admin, Manager, Employee, etc."
          items={roles ?? []}
          isLoading={isLoading}
          fields={[
            { key: "name", label: "Name", type: "text" },
            { key: "display_name", label: "Display Name", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "is_active", label: "Status", type: "switch" },
          ]}
          onAdd={async (data) => addRole.mutate(data)}
          onEdit={async (id, data) => editRole.mutate({ id, data })}
          onDelete={async (id) => deleteRole.mutate(id)}
        />
      </CardContent>
    </Card>
  )
}