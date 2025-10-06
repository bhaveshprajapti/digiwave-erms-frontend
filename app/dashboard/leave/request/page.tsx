import { LeaveRequestForm } from "@/components/leave/leave-request-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LeaveRequestPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leave">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Request Leave</h2>
          <p className="text-muted-foreground">Submit a new leave request</p>
        </div>
      </div>
      <LeaveRequestForm />
    </div>
  )
}
