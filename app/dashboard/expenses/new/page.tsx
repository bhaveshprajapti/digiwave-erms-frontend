import { ExpenseForm } from "@/components/expenses/expense-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Expense</h2>
          <p className="text-muted-foreground">Submit a new expense for approval</p>
        </div>
      </div>
      <ExpenseForm />
    </div>
  )
}
