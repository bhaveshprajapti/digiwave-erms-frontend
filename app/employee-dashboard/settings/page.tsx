"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Settings, Bell, Shield, Palette, Moon, Sun } from "lucide-react"
import authService from "@/lib/auth"

export default function EmployeeSettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    leaveReminders: true,
    attendanceAlerts: true,
    profileVisibility: 'organization',
    darkMode: false,
    autoClockOut: true,
  })
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = authService.getUserData()
    if (userData) {
      setUser(userData)
    }
  }, [])

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // API call would go here
      // await api.post('/accounts/change-password/', { old_password: oldPassword, new_password: newPassword })
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // API call would go here
      // await api.patch('/accounts/user-settings/', settings)
      
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <Switch
                id="sms-notifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="leave-reminders">Leave Reminders</Label>
              <Switch
                id="leave-reminders"
                checked={settings.leaveReminders}
                onCheckedChange={(checked) => handleSettingChange('leaveReminders', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="attendance-alerts">Attendance Alerts</Label>
              <Switch
                id="attendance-alerts"
                checked={settings.attendanceAlerts}
                onCheckedChange={(checked) => handleSettingChange('attendanceAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-clock-out">Auto Clock Out (8 hours)</Label>
              <Switch
                id="auto-clock-out"
                checked={settings.autoClockOut}
                onCheckedChange={(checked) => handleSettingChange('autoClockOut', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <select 
                id="profile-visibility"
                className="w-full h-9 rounded-md border px-2"
                value={settings.profileVisibility}
                onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
              >
                <option value="organization">Organization Only</option>
                <option value="team">Team Only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={saving}>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}