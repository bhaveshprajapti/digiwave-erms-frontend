"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDesignations, createDesignation, updateDesignation, deleteDesignation, type Designation } from "@/hooks/use-designations"
import { ManagementTable } from "@/components/common/management-table"

export default function DesignationsPage() {
  const { designations, isLoading, error, mutate } = useDesignations()

  const handleAdd = async (data: Partial<Designation>) => {
    await createDesignation({ title: String(data.title || '').trim(), is_active: Boolean(data.is_active ?? true) })
    mutate()
  }





  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[300px]">Loading...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <ManagementTable<Designation>
          title="Designation"
          description="Manage employee designations"
          items={(designations || []) as any}
          isLoading={isLoading}
          labelKey={'title'}
          fields={[
            { key: 'title' as keyof Designation, label: 'Title', type: 'text' },
            { key: 'is_active' as keyof Designation, label: 'Status', type: 'switch' },
          ]}
          onAdd={handleAdd}
          onEdit={async (id, data) => {
            await updateDesignation(String(id), { title: String((data as any).title || '').trim(), is_active: (data as any).is_active })
            mutate()
          }}
          onDelete={async (id) => {
            await deleteDesignation(String(id))
            mutate()
          }}
        />
      </CardContent>
    </Card>
  )
}
