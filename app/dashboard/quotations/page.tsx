import { QuotationList } from "@/components/quotations/quotation-list"
import { QuotationStats } from "@/components/quotations/quotation-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">Manage quotes and proposals</p>
        </div>
        <Link href="/dashboard/quotations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>
      <QuotationStats />
      <QuotationList />
    </div>
  )
}
