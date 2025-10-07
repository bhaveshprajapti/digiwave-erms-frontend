import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Holiday } from "@/lib/schemas"
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from "@/lib/api/holidays"

export function useHolidays() {
  const qc = useQueryClient()

  const holidaysQuery = useQuery<Holiday[]>({
    queryKey: ["holidays"],
    queryFn: getHolidays,
  })

  const add = useMutation({
    mutationFn: (data: Omit<Holiday, 'id'>) => createHoliday(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  })

  const edit = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Holiday,'id'>> }) => updateHoliday(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  })

  return {
    holidays: holidaysQuery.data || [],
    isLoading: holidaysQuery.isLoading,
    addHoliday: add.mutateAsync,
    updateHoliday: edit.mutateAsync,
    deleteHoliday: remove.mutateAsync,
  }
}
