"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Clock, MapPin, LogIn, LogOut } from "lucide-react"

export function AttendanceClockCard() {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [workHours, setWorkHours] = useState("00:00:00")
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [existingAttendanceId, setExistingAttendanceId] = useState<number | null>(null)

  // Check for existing attendance record for today
  const checkExistingAttendance = async () => {
    try {
      const { listAttendances } = await import("@/lib/api/attendances")
      const { authService } = await import("@/lib/auth")
      const user = authService.getUserData()
      if (user?.id) {
        const today = new Date().toISOString().slice(0,10)
        const data = await listAttendances({ user: user.id, start_date: today, end_date: today })
        if (data.results && data.results.length > 0) {
          setExistingAttendanceId(data.results[0].id)
        }
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error)
    }
  }

  useEffect(() => {
    // Set client flag and initial time
    setIsClient(true)
    setCurrentTime(new Date())
    
    // Check for existing attendance on component mount
    checkExistingAttendance()
    
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
    if (isLoading) return
    setIsClockedIn(true)
    setClockInTime(new Date())
  }

  const handleClockOut = async () => {
    if (isLoading) return
    setIsLoading(true)
    
    try {
      const today = new Date()
      const date = today.toISOString().slice(0,10)
      const total_hours = workHours
      
      const { createAttendance, updateAttendance } = await import("@/lib/api/attendances")
      const { authService } = await import("@/lib/auth")
      const user = authService.getUserData()
      
      if (user?.id) {
        if (existingAttendanceId) {
          // Update existing record
          await updateAttendance(existingAttendanceId, { total_hours, notes: null })
        } else {
          // Create new record
          const newAttendance = await createAttendance({ user: user.id, date, total_hours, notes: null } as any)
          setExistingAttendanceId(newAttendance.id)
        }
      }
      
      setIsClockedIn(false)
      setClockInTime(null)
      setWorkHours("00:00:00")
      
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      })
    } catch (error: any) {
      console.error('Clock out error:', error)
      // If it's a duplicate error, try to update instead
      if (error?.response?.data?.non_field_errors?.some((msg: string) => msg.includes('unique set'))) {
        try {
          await checkExistingAttendance()
          // Retry with update if we found the existing record
          if (existingAttendanceId) {
            const { updateAttendance } = await import("@/lib/api/attendances")
            await updateAttendance(existingAttendanceId, { total_hours: workHours, notes: null })
            setIsClockedIn(false)
            setClockInTime(null)
            setWorkHours("00:00:00")
            toast({
              title: "Success",
              description: "Attendance updated successfully",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to record attendance",
              variant: "destructive",
            })
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError)
          toast({
            title: "Error",
            description: "Failed to record attendance",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: error?.response?.data?.message || "Failed to record attendance",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
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
            <p className="text-2xl font-bold">
              {isClient && currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isClient && currentTime ? currentTime.toLocaleDateString() : "Loading..."}
            </p>
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
              <Button onClick={handleClockIn} size="lg" className="w-full" disabled={isLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                Clock In
              </Button>
            ) : (
              <Button onClick={handleClockOut} size="lg" variant="outline" className="w-full bg-transparent" disabled={isLoading}>
                <LogOut className="mr-2 h-4 w-4" />
                {isLoading ? "Processing..." : "Clock Out"}
              </Button>
            )}
          </div>
        </div>

        {isClockedIn && clockInTime && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Clocked in at:</span>
              <span className="font-medium">
                {isClient ? clockInTime.toLocaleTimeString() : "--:--:--"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
