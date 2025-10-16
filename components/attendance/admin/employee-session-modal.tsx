"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Coffee, Play, User, Calendar, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminResetDay } from "@/lib/api/attendances"
import { attendanceEvents } from "@/hooks/use-attendance-updates"

interface Session {
  id: string
  clockIn: Date
  clockOut?: Date
  type: "work" | "break"
  duration: number // in minutes
}

interface EmployeeSessionModalProps {
  isOpen: boolean
  onClose: () => void
  employeeName: string
  employeeId: number
  selectedDate: string
}

export function EmployeeSessionModal({
  isOpen,
  onClose,
  employeeName,
  employeeId,
  selectedDate,
}: EmployeeSessionModalProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [totalBreakTime, setTotalBreakTime] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [dayEnded, setDayEnded] = useState(false)
  const { toast } = useToast()

  // Mock data generator for now - replace with actual API call
  const loadSessionData = async () => {
    setLoading(true)
    try {
      // This would be replaced with actual API call
      // const sessionsData = await getEmployeeDaySessionsAPI(employeeId, date)
      // For now, we'll simulate checking if day ended
      // In real implementation, this would come from the API response
      
      // Mock check for day ended status (you would get this from API)
      const mockDayEnded = Math.random() > 0.5 // 50% chance for demo
      setDayEnded(mockDayEnded)

      // Mock data for demonstration
      const mockSessions: Session[] = [
        {
          id: "1",
          clockIn: new Date(`${selectedDate} 09:00:00`),
          clockOut: new Date(`${selectedDate} 12:30:00`),
          type: "work",
          duration: 210, // 3.5 hours
        },
        {
          id: "2",
          clockIn: new Date(`${selectedDate} 12:30:00`),
          clockOut: new Date(`${selectedDate} 13:30:00`),
          type: "break",
          duration: 60, // 1 hour lunch
        },
        {
          id: "3",
          clockIn: new Date(`${selectedDate} 13:30:00`),
          clockOut: new Date(`${selectedDate} 17:00:00`),
          type: "work",
          duration: 210, // 3.5 hours
        },
        {
          id: "4",
          clockIn: new Date(`${selectedDate} 17:00:00`),
          clockOut: new Date(`${selectedDate} 17:15:00`),
          type: "break",
          duration: 15, // 15 min break
        },
        {
          id: "5",
          clockIn: new Date(`${selectedDate} 17:15:00`),
          clockOut: new Date(`${selectedDate} 18:30:00`),
          type: "work",
          duration: 75, // 1.25 hours
        },
      ]

      setSessions(mockSessions)

      const workTime = mockSessions
        .filter(s => s.type === "work")
        .reduce((total, session) => total + session.duration, 0)

      const breakTime = mockSessions
        .filter(s => s.type === "break")
        .reduce((total, session) => total + session.duration, 0)

      setTotalWorkTime(workTime)
      setTotalBreakTime(breakTime)
    } catch (error) {
      console.error("Error loading session data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && employeeId && selectedDate) {
      loadSessionData()
    }
  }, [isOpen, employeeId, selectedDate])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    const secs = Math.floor((minutes % 1) * 60) // Extract seconds from decimal part

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleResetDay = async () => {
    if (!employeeId || !selectedDate) return
    
    setIsResetting(true)
    try {
      await adminResetDay({
        user_id: employeeId,
        date: selectedDate
      })
      
      toast({
        title: "Success",
        description: "Day status reset successfully. Employee can check in again.",
      })
      
      // Dispatch event to refresh all attendance components
      attendanceEvents.statusUpdate(employeeId, selectedDate)
      
      setDayEnded(false)
      // Reload session data
      await loadSessionData()
      
    } catch (error: any) {
      console.error('Error resetting day:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to reset day status",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-none !w-[75vw] !h-[85vh] max-h-none overflow-y-auto p-6 sm:!max-w-none"
        style={{
          width: '85vw',
          height: '85vh',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {employeeName} - Session Details
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedDate)}
              </DialogDescription>
            </div>
            {dayEnded && (
              <Button
                onClick={handleResetDay}
                disabled={isResetting}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? "Resetting..." : "Reset Day"}
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Day Status Alert */}
            {dayEnded && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-800">
                    <Clock className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Day has ended for this employee</p>
                      <p className="text-sm">Use the "Reset Day" button to allow them to check in again.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards - Same style as attendance page */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Work Time</p>
                      <p className="text-2xl font-bold text-blue-600">{formatDuration(totalWorkTime)}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Break Time</p>
                      <p className="text-2xl font-bold text-orange-600">{formatDuration(totalBreakTime)}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Coffee className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                      <p className="text-2xl font-bold text-green-600">{formatDuration(totalWorkTime + totalBreakTime)}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Session Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No session data available for this date.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <div key={session.id} className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${session.type === 'work'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-orange-100 text-orange-600'
                            }`}>
                            {session.type === 'work' ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Coffee className="h-4 w-4" />
                            )}
                          </div>
                          {index < sessions.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2"></div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={session.type === 'work' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {session.type === 'work' ? 'Work Session' : 'Break Time'}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {formatDuration(session.duration)}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(session.clockIn)} - {session.clockOut ? formatTime(session.clockOut) : 'Ongoing'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Efficiency Stats */}
            {sessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Efficiency Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Work vs Break Ratio</div>
                      <div className="text-lg font-semibold">
                        {totalWorkTime > 0 && totalBreakTime > 0
                          ? `${Math.round(totalWorkTime / totalBreakTime * 10) / 10}:1`
                          : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Work minutes per break minute
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Average Session Length</div>
                      <div className="text-lg font-semibold">
                        {sessions.length > 0
                          ? formatDuration(Math.round((totalWorkTime + totalBreakTime) / sessions.length))
                          : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Per session
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}