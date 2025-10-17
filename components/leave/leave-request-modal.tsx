"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Timer } from "lucide-react"
import { LeaveRequestForm } from "./leave-request-form"
import { FlexibleTimingForm } from "./flexible-timing-form"

interface LeaveRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeaveRequestModal({ open, onOpenChange }: LeaveRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Request Leave</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="full-day" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="full-day" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Full Day
            </TabsTrigger>
            <TabsTrigger value="half-day" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Half Day
            </TabsTrigger>
            {/* <TabsTrigger value="hourly" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hourly
            </TabsTrigger> */}
            <TabsTrigger value="flexible" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Flexible
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full-day" className="mt-0">
            <LeaveRequestForm
              defaultRequestType="full-day"
              onSuccess={() => onOpenChange(false)}
              showTabs={false}
            />
          </TabsContent>

          <TabsContent value="half-day" className="mt-0">
            <LeaveRequestForm
              defaultRequestType="half-day"
              onSuccess={() => onOpenChange(false)}
              showTabs={false}
            />
          </TabsContent>

          {/* Hourly leave commented out - use Flexible Timing instead */}
          {/* <TabsContent value="hourly" className="mt-0">
            <LeaveRequestForm
              defaultRequestType="hourly"
              onSuccess={() => onOpenChange(false)}
              showTabs={false}
            />
          </TabsContent> */}

          <TabsContent value="flexible" className="mt-0">
            <FlexibleTimingForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
