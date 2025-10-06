import { EmployeeForm } from "@/components/employees/employee-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Employee</h2>
          <p className="text-muted-foreground">Create a new employee profile</p>
        </div>
      </div>
      <EmployeeForm />
    </div>
  )
}
