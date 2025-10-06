import { EmployeeDetails } from "@/components/employees/employee-details"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Employee Details</h2>
            <p className="text-muted-foreground">View employee information and history</p>
          </div>
        </div>
        <Link href={`/dashboard/employees/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </Link>
      </div>
      <EmployeeDetails employeeId={id} />
    </div>
  )
}
