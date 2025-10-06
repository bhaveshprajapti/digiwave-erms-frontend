"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, LogIn, LogOut } from "lucide-react"

export function AttendanceClockCard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [workHours, setWorkHours] = useState("00:00:00")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      if (clockInTime) {
        const diff = new Date().getTime() - clockInTime.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setWorkHours(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        )
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [clockInTime])

  const handleClockIn = () => {
    setIsClockedIn(true)
    setClockInTime(new Date())
  }

  const handleClockOut = () => {
    setIsClockedIn(false)
    setClockInTime(null)
    setWorkHours("00:00:00")
  }

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Attendance</CardTitle>
          <Badge variant={isClockedIn ? "default" : "secondary"} className="gap-1">
            <Clock className="h-3 w-3" />
            {isClockedIn ? "Clocked In" : "Not Clocked In"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Time</p>
            <p className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</p>
            <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString()}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Work Hours Today</p>
            <p className="text-2xl font-bold">{workHours}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Office - Main Building</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {!isClockedIn ? (
              <Button onClick={handleClockIn} size="lg" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Clock In
              </Button>
            ) : (
              <Button onClick={handleClockOut} size="lg" variant="outline" className="w-full bg-transparent">
                <LogOut className="mr-2 h-4 w-4" />
                Clock Out
              </Button>
            )}
          </div>
        </div>

        {isClockedIn && clockInTime && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Clocked in at:</span>
              <span className="font-medium">{clockInTime.toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
