"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

export function OrganizationSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic details about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="TechCorp Solutions" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select defaultValue="it">
                <SelectTrigger id="industry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">Information Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" defaultValue="123 Tech Street, Silicon Valley, CA 94025" rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="contact@techcorp.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Schedule</CardTitle>
          <CardDescription>Configure default working hours and shifts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="work-start">Work Start Time</Label>
              <Input id="work-start" type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-end">Work End Time</Label>
              <Input id="work-end" type="time" defaultValue="18:00" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="work-days">Working Days per Week</Label>
              <Select defaultValue="5">
                <SelectTrigger id="work-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="6">6 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="pst">
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  <SelectItem value="est">Eastern Time (EST)</SelectItem>
                  <SelectItem value="cst">Central Time (CST)</SelectItem>
                  <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Settings</CardTitle>
          <CardDescription>Configure attendance tracking rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace Period (minutes)</Label>
              <Input id="grace-period" type="number" defaultValue="15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="half-day">Half Day Hours</Label>
              <Input id="half-day" type="number" defaultValue="4" step="0.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
