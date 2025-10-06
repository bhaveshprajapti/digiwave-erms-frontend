import { ExpenseList } from "@/components/expenses/expense-list"
import { ExpenseStats } from "@/components/expenses/expense-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">Track and manage company expenses</p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>
      <ExpenseStats />
      <ExpenseList />
    </div>
  )
}
