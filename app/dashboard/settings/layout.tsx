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
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          </div>
          {children}
        </div>
      </div>
    </Providers>
  )
}