"use client"

import { ManagementTable } from "@/components/common/management-table"
import { Card, CardContent } from "@/components/ui/card"
import { Shift } from "@/lib/schemas"
import useShifts from "@/hooks/use-shifts"

export default function ShiftsPage() {
  const { shifts, isLoading, createShift, updateShift, deleteShift } = useShifts()
  
  const handleAdd = async (data: Partial<Shift>) => {
    const start = data.start_time?.toString().trim() || ''
    const end = data.end_time?.toString().trim() || ''
    const newShift: any = {
      name: data.name?.toString().trim() || '',
      start_time: start,
      end_time: end,
      is_active: Boolean(data.is_active ?? true),
    }
    await createShift(newShift as Omit<Shift, 'id'>)
  }

  return (
    <Card>
      <CardContent>
        <ManagementTable<Shift>
          title="Shifts"
          description="Manage work shifts in the system"
          items={shifts || []}
          isLoading={isLoading}
          fields={[
            { key: "name" as keyof Shift, label: "Name", type: "text" as const },
            { key: "start_time" as keyof Shift, label: "Start Time", type: "time" as const },
            { key: "end_time" as keyof Shift, label: "End Time", type: "time" as const },
            { key: "is_active" as keyof Shift, label: "Status", type: "switch" as const },
          ]}
          onAdd={handleAdd}
          onEdit={async (id, data) => {
            // Do not compute or send is_overnight; backend handles or defaults it
            const payload: Partial<Shift> = {
              name: typeof data.name !== 'undefined' ? String(data.name) : undefined,
              start_time: typeof data.start_time !== 'undefined' ? String(data.start_time) : undefined,
              end_time: typeof data.end_time !== 'undefined' ? String(data.end_time) : undefined,
              is_active: typeof data.is_active !== 'undefined' ? Boolean(data.is_active) : undefined,
            }
            await updateShift({ id, data: payload })
          }}
          onDelete={async (id) => {
            await deleteShift(id)
          }}
        />
      </CardContent>
    </Card>
  )
}
