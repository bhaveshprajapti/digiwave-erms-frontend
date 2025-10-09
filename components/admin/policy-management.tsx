"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaveTypesManager } from "@/components/leave/admin/leave-types-manager"
import { LeaveTypePoliciesManager } from "@/components/leave/admin/leave-type-policies-manager"
import { LeaveApplicationsManager } from "@/components/leave/admin/leave-applications-manager"
import { LeaveBalanceManager } from "@/components/leave/admin/leave-balance-manager"
import { FlexibleTimingTypesManager } from "@/components/leave/admin/flexible-timing-types-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calendar, 
  Settings, 
  Users, 
  FileText,
  Clock
} from "lucide-react"

export function PolicyManagement() {
  const [activeTab, setActiveTab] = useState("applications")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="leave-types" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Leave Types
          </TabsTrigger>
          <TabsTrigger value="flexible-timing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Flexible Timing
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Leave Policies
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-6">
          <LeaveApplicationsManager />
        </TabsContent>
        
        <TabsContent value="balances" className="space-y-6">
          <LeaveBalanceManager />
        </TabsContent>
        
        <TabsContent value="leave-types" className="space-y-6">
          <LeaveTypesManager />
        </TabsContent>
        
        <TabsContent value="flexible-timing" className="space-y-6">
          <FlexibleTimingTypesManager />
        </TabsContent>
        
        <TabsContent value="policies" className="space-y-6">
          <LeaveTypePoliciesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
