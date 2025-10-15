"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ManagementTable } from "@/components/common/management-table"
import { useTechnologies } from "@/hooks/use-common"

export default function TechnologiesPage() {
  const { technologies, isLoading, createTechnology, updateTechnology, deleteTechnology } = useTechnologies()

  return (
    <Card>
      <CardContent>
        <ManagementTable<any>
          title="Technologies"
          description=""
          items={(technologies || []) as any}
          isLoading={isLoading}
          fields={[
            { key: 'name' as any, label: 'Name', type: 'text' },
            { key: 'is_active' as any, label: 'Status', type: 'switch' },
          ]}
          onAdd={async (data) => {
            await createTechnology({ name: String((data as any).name || '').trim(), is_active: Boolean((data as any).is_active ?? true) })
          }}
          onEdit={async (id, data) => {
            await updateTechnology(id, { name: String((data as any).name || '').trim(), is_active: (data as any).is_active })
          }}
          onDelete={async (id) => {
            await deleteTechnology(id)
          }}
        />
      </CardContent>
    </Card>
  )
}
