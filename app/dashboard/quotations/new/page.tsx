import { QuotationForm } from "@/components/quotations/quotation-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewQuotationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/quotations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Quotation</h2>
          <p className="text-muted-foreground">Generate a new quote for your client</p>
        </div>
      </div>
      <QuotationForm />
    </div>
  )
}
