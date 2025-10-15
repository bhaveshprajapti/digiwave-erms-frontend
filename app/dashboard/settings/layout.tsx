"use client"

import { Providers } from "@/components/providers"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="flex flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          {children}
        </div>
      </div>
    </Providers>
  )
}