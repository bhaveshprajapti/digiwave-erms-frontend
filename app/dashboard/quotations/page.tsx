'use client'

import { QuotationList } from '@/components/quotations/quotation-list'

export default function QuotationsPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto py-6 px-4">
      {/* <div className="mb-6">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <p className="text-muted-foreground">
          Manage your quotations and proposals
        </p>
      </div> */}
      
      <QuotationList />
    </div>
  )
}