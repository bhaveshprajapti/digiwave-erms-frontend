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
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Clock, Coffee, Play, Pause, User, Calendar } from "lucide-react"
import api from "@/lib/api"

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
  onDateChange: (date: string) => void
}

export function EmployeeSessionModal({
  isOpen,
  onClose,
  employeeName,
  employeeId,
  selectedDate,
  onDateChange,
}: EmployeeSessionModalProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [totalBreakTime, setTotalBreakTime] = useState(0)

  // Mock data generator for now - replace with actual API call
  const loadSessionData = async () => {
    setLoading(true)
    try {
      // This would be replaced with actual API call
      // const sessionsData = await getEmployeeDaySessionsAPI(employeeId, date)
      
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
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {employeeName} - Session Details
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(selectedDate)}
          </DialogDescription>
        </DialogHeader>

        {/* Date Selection */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Select Date:</span>
          </div>
          <DatePicker
            value={new Date(selectedDate)}
            onChange={(date: Date | undefined) => {
              if (date) {
                onDateChange(date.toISOString().split('T')[0])
              }
            }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Total Work Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(totalWorkTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total work duration
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-orange-600" />
                    Total Break Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatDuration(totalBreakTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total break duration
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    Total Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(totalWorkTime + totalBreakTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined duration
                  </p>
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
                          <div className={`p-2 rounded-full ${
                            session.type === 'work' 
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