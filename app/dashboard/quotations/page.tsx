import { QuotationList } from "@/components/quotations/quotation-list"
import { QuotationStats } from "@/components/quotations/quotation-stats"

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">Manage quotes and proposals</p>
        </div>
      </div>
      <QuotationStats />
      <QuotationList />
    </div>
  )
}
