"use client"

import { ManagementTable } from "@/components/common/management-table"
import { Card, CardContent } from "@/components/ui/card"
import { Shift } from "@/lib/schemas"
import useShifts from "@/hooks/use-shifts"
import { TimePicker } from "@/components/ui/time-picker"

export default function ShiftsPage() {
  const { shifts, isLoading, createShift, updateShift, deleteShift } = useShifts()
  
  const handleAdd = async (data: Partial<Shift>) => {
    const newShift = {
      name: data.name?.toString().trim() || '',
      start_time: data.start_time?.toString().trim() || '',
      end_time: data.end_time?.toString().trim() || '',
      is_overnight: Boolean(data.is_overnight),
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
            { key: "is_overnight" as keyof Shift, label: "Night Shift", type: "switch" as const },
            { key: "is_active" as keyof Shift, label: "Status", type: "switch" as const },
          ]}
          onAdd={handleAdd}
          onEdit={async (id, data) => {
            await updateShift({ id, data: data as Partial<Shift> })
          }}
          onDelete={async (id) => {
            await deleteShift(id)
          }}
        />
      </CardContent>
    </Card>
  )
}