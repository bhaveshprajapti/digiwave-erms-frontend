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
import { DatePicker } from "@/components/ui/date-picker"
import { Clock, Coffee, Play, User, Calendar, RefreshCw, LogIn, LogOut, Timer, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminResetDay, listAttendances, AttendanceDTO } from "@/lib/api/attendances"
import { attendanceEvents } from "@/hooks/use-attendance-updates"

interface Session {
  check_in: string
  check_out?: string
}

interface EmployeeSessionModalProps {
  isOpen: boolean
  onClose: () => void
  employeeName: string
  employeeId: number
  selectedDate: string
  onDateChange?: (date: string) => void
}

export function EmployeeSessionModal({
  isOpen,
  onClose,
  employeeName,
  employeeId,
  selectedDate,
  onDateChange,
}: EmployeeSessionModalProps) {
  const [attendance, setAttendance] = useState<AttendanceDTO | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [totalWorkTime, setTotalWorkTime] = useState("0:00:00")
  const [totalBreakTime, setTotalBreakTime] = useState("0:00:00")
  const [isResetting, setIsResetting] = useState(false)
  const [dayEnded, setDayEnded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load actual session data from API
  const loadSessionData = async () => {
    setLoading(true)
    try {
      // Fetch attendance data for the specific employee and date
      const response = await listAttendances({
        user: employeeId,
        start_date: selectedDate,
        end_date: selectedDate,
        page_size: 1
      })

      if (response.results.length > 0) {
        const attendanceData = response.results[0]
        setAttendance(attendanceData)
        setSessions(attendanceData.sessions || [])
        setTotalWorkTime(attendanceData.total_hours || "0:00:00")
        
        // Calculate total break time from sessions if backend value is 0 or missing
        const calculateTotalBreakTime = () => {
          if (attendanceData.total_break_time && attendanceData.total_break_time !== '0:00:00') {
            return attendanceData.total_break_time
          }
          
          // Fallback: calculate from sessions
          const sessions = attendanceData.sessions || []
          let totalBreakMs = 0
          for (let i = 0; i < sessions.length - 1; i++) {
            const currentSession = sessions[i]
            const nextSession = sessions[i + 1]
            
            if (currentSession.check_out && nextSession.check_in) {
              const breakStart = new Date(currentSession.check_out)
              const breakEnd = new Date(nextSession.check_in)
              totalBreakMs += breakEnd.getTime() - breakStart.getTime()
            }
          }
          
          const hours = Math.floor(totalBreakMs / (1000 * 60 * 60))
          const minutes = Math.floor((totalBreakMs % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((totalBreakMs % (1000 * 60)) / 1000)
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        
        setTotalBreakTime(calculateTotalBreakTime())
        
        // CRITICAL: Check day_ended from database, not just session state
        // The day_ended field is the authoritative source of truth
        setDayEnded(attendanceData.day_ended || false)
      } else {
        // No attendance data for this date
        setAttendance(null)
        setSessions([])
        setTotalWorkTime("0:00:00")
        setTotalBreakTime("0:00:00")
        setDayEnded(false)
      }
    } catch (error) {
      console.error("Error loading session data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && employeeId && selectedDate) {
      loadSessionData()
    }
  }, [isOpen, employeeId, selectedDate])

  const formatTime = (timeString: string) => {
    if (!isMounted) return "--:--:--"
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return "Ongoing"
    
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const duration = end.getTime() - start.getTime()
    
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    if (!isMounted) return dateStr
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0]
      if (onDateChange) {
        onDateChange(dateStr)
      }
    }
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
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {employeeName} - Session Details
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(selectedDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Select Date:</span>
                  <DatePicker
                    value={new Date(selectedDate)}
                    onChange={handleDateChange}
                    className="w-40"
                  />
                </div>
              </div>
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

            {/* Summary Cards - Same style as employee attendance page */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Working Hours Card */}
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Total Working Hours</CardTitle>
                  <Timer className="h-3 w-3 text-blue-600" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-lg font-bold text-blue-600 font-mono">{totalWorkTime}</div>
                  <p className="text-xs text-muted-foreground">
                    Total time worked
                  </p>
                </CardContent>
              </Card>

              {/* Total Sessions Card */}
              <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Total Sessions</CardTitle>
                  <User className="h-3 w-3 text-purple-600" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-lg font-bold text-purple-600">{sessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Check-in sessions
                  </p>
                </CardContent>
              </Card>

              {/* Completed Sessions Card */}
              <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Completed Sessions</CardTitle>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-lg font-bold text-green-600">{sessions.filter((s: any) => s.check_out).length}</div>
                  <p className="text-xs text-muted-foreground">
                    {sessions.length > 0 
                      ? `${Math.round((sessions.filter((s: any) => s.check_out).length / sessions.length) * 100)}% completed`
                      : "No sessions"
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Break Time Card */}
              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Total Break Time</CardTitle>
                  <Coffee className="h-3 w-3 text-orange-600" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-lg font-bold text-orange-600 font-mono">{totalBreakTime}</div>
                  <p className="text-xs text-muted-foreground">
                    All sessions combined
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Session Details - Same format as employee attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sessions recorded for this date
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session: any, index: number) => (
                      <div key={`session-${index}`}>
                        {/* Session Card - White Background with Labels and Larger Font */}
                        <div className="border rounded-md px-4 py-3 bg-white shadow-sm">
                          <div className="flex items-center justify-between">
                            {/* Session Info with Labels */}
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-muted-foreground text-sm">#{index + 1}</span>
                              </div>
                              
                              {/* Check In */}
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-1 mb-1">
                                  <LogIn className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Check In</span>
                                </div>
                                <span className="font-mono text-sm font-medium">{formatTime(session.check_in)}</span>
                              </div>
                              
                              {/* Check Out */}
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-1 mb-1">
                                  <LogOut className="h-3 w-3 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">Check Out</span>
                                </div>
                                <span className="font-mono text-sm font-medium">
                                  {session.check_out ? formatTime(session.check_out) : "Active"}
                                </span>
                              </div>
                              
                              {/* Duration */}
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-1 mb-1">
                                  <Timer className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-blue-600 font-medium">Duration</span>
                                </div>
                                <span className="font-mono text-sm font-medium">
                                  {formatDuration(session.check_in, session.check_out)}
                                </span>
                              </div>

                              {/* Break After Session */}
                              {index < sessions.length - 1 && (
                                <div className="flex flex-col items-start">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Coffee className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs text-orange-600 font-medium">Break After</span>
                                  </div>
                                  <span className="font-mono text-sm font-medium text-orange-600">
                                    {(() => {
                                      const currentCheckOut = session.check_out
                                      const nextCheckIn = sessions[index + 1]?.check_in
                                      if (currentCheckOut && nextCheckIn) {
                                        const breakStart = new Date(currentCheckOut)
                                        const breakEnd = new Date(nextCheckIn)
                                        const breakDuration = breakEnd.getTime() - breakStart.getTime()
                                        const hours = Math.floor(breakDuration / (1000 * 60 * 60))
                                        const minutes = Math.floor((breakDuration % (1000 * 60 * 60)) / (1000 * 60))
                                        const seconds = Math.floor((breakDuration % (1000 * 60)) / 1000)
                                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                                      }
                                      return "0:00:00"
                                    })()}
                                  </span>
                                </div>
                              )}

                            </div>

                            {/* Status Badge */}
                            <Badge variant={session.check_out ? "secondary" : "default"} className="text-sm">
                              {session.check_out ? "Completed" : "Active"}
                            </Badge>
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
                        {(() => {
                          // Convert time strings to seconds for calculation
                          const workSeconds = totalWorkTime.split(':').reduce((acc, time, i) => acc + parseInt(time) * Math.pow(60, 2 - i), 0)
                          const breakSeconds = totalBreakTime.split(':').reduce((acc, time, i) => acc + parseInt(time) * Math.pow(60, 2 - i), 0)
                          
                          if (workSeconds > 0 && breakSeconds > 0) {
                            return `${Math.round((workSeconds / breakSeconds) * 10) / 10}:1`
                          }
                          return 'N/A'
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Work time per break time
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Average Session Length</div>
                      <div className="text-lg font-semibold">
                        {sessions.length > 0
                          ? (() => {
                              const totalSessionTime = sessions.reduce((total, session) => {
                                if (session.check_out) {
                                  const duration = new Date(session.check_out).getTime() - new Date(session.check_in).getTime()
                                  return total + duration
                                }
                                return total
                              }, 0)
                              const avgMs = totalSessionTime / sessions.filter(s => s.check_out).length
                              const hours = Math.floor(avgMs / (1000 * 60 * 60))
                              const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60))
                              const seconds = Math.floor((avgMs % (1000 * 60)) / 1000)
                              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                            })()
                          : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Per completed session
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