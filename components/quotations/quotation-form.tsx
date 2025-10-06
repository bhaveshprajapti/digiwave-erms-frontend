"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export function QuotationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, rate: 0, amount: 0 }])

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, rate: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate
    }
    setLineItems(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mock submission
    setTimeout(() => {
      router.push("/dashboard/quotations")
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select required>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">TechMart Inc.</SelectItem>
                    <SelectItem value="2">FinanceHub</SelectItem>
                    <SelectItem value="3">SalesPro</SelectItem>
                    <SelectItem value="4">BrandCo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Quotation Title</Label>
              <Input id="title" placeholder="E-commerce Platform Development" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of the project scope" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes or special instructions" rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-5">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    placeholder="Service or product description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", Number.parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`rate-${index}`}>Rate</Label>
                  <Input
                    id={`rate-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateLineItem(index, "rate", Number.parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Amount</Label>
                  <div className="flex h-10 items-center font-medium">${item.amount.toFixed(2)}</div>
                </div>
                <div className="flex items-end md:col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter payment terms, delivery schedule, and other conditions"
              rows={5}
              defaultValue="Payment Terms: 50% upfront, 50% upon completion&#10;Delivery: Within agreed timeline&#10;Warranty: 90 days post-delivery"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Quotation"}
          </Button>
        </div>
      </div>
    </form>
  )
}
