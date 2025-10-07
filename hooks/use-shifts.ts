import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shift } from "@/lib/schemas"
import { createShift, deleteShift, getShifts, updateShift } from "@/lib/api/shifts"

const useShifts = () => {
  const queryClient = useQueryClient()

  const shiftsQuery = useQuery<Shift[]>({
    queryKey: ['shifts'],
    queryFn: getShifts
  })

  const createShiftMutation = useMutation({
    mutationFn: createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    }
  })

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Shift> }) => 
      updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    }
  })

  const deleteShiftMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    }
  })

  return {
    shifts: shiftsQuery.data || [],
    isLoading: shiftsQuery.isLoading,
    createShift: createShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync
  }
}

export default useShifts