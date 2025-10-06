"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createEmployee } from "@/hooks/use-employees"
import { EmployeeForm } from "./employee-form"

type CreateEmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateEmployeeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true)
      await createEmployee(data)
      toast({
        title: "Success",
        description: "Employee created successfully",
      })
      onSuccess?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the employee details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
}