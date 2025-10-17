"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut, Timer, Users, Coffee, CheckCircle, Calendar } from "lucide-react"
import { formatUTCtoISTTime, formatUTCtoISTDate } from "@/lib/timezone"

interface SessionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendance: any
}

export function SessionDetailsModal({ open, onOpenChange, attendance }: SessionDetailsModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!attendance) return null

  const sessions = attendance.sessions || []
  
  // Calculate total break time from sessions if backend value is 0 or missing
  const calculateTotalBreakTime = () => {
    if (attendance.total_break_time && attendance.total_break_time !== '0:00:00') {
      return attendance.total_break_time
    }
    
    // Fallback: calculate from sessions
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
  const formatTime = (utcTimeString: string) => {
    if (!isMounted) return "--:--:--"
    return formatUTCtoISTTime(utcTimeString, false, true) // 24-hour format with seconds
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-[90vw] max-h-[90vh] overflow-y-auto sm:!max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Details - {isMounted ? formatUTCtoISTDate(attendance.date + 'T00:00:00Z', 'DD/MM/YYYY') : attendance.date}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Leave Information (if applicable) */}
          {attendance.leave_info && (
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Leave Application
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge 
                    className={
                      (attendance.leave_info.status === 2 || attendance.leave_info.status === 'approved')
                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                        : (attendance.leave_info.status === 3 || attendance.leave_info.status === 'rejected')
                        ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                    }
                  >
                    {(attendance.leave_info.status === 2 || attendance.leave_info.status === 'approved') ? 'Approved' : 
                     (attendance.leave_info.status === 3 || attendance.leave_info.status === 'rejected') ? 'Rejected' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Leave Type:</span>
                  <span className="text-sm text-muted-foreground">
                    {attendance.leave_info.leave_type_name || `Leave Type ${attendance.leave_info.leave_type}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reason:</span>
                  <span className="text-sm text-muted-foreground">{attendance.leave_info.reason}</span>
                </div>
                {attendance.leave_info.half_day_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {attendance.leave_info.half_day_type === 'morning' ? 'Morning Half Day' : 'Afternoon Half Day'}
                    </Badge>
                  </div>
                )}
                {attendance.leave_info.status === 3 && attendance.leave_info.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {attendance.leave_info.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Stats Cards - Compact */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Working Hours Card */}
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">Total Working Hours</CardTitle>
                <Timer className="h-3 w-3 text-blue-600" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-lg font-bold text-blue-600 font-mono">{attendance.total_hours || '0:00:00'}</div>
                <p className="text-xs text-muted-foreground">
                  Total time worked
                </p>
              </CardContent>
            </Card>

            {/* Total Sessions Card */}
            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">Total Sessions</CardTitle>
                <Users className="h-3 w-3 text-purple-600" />
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

            {/* Break Time Card - Shows Total Break Time from Backend */}
            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium">Total Break Time</CardTitle>
                <Coffee className="h-3 w-3 text-orange-600" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-lg font-bold text-orange-600 font-mono">{calculateTotalBreakTime()}</div>
                <p className="text-xs text-muted-foreground">
                  All sessions combined
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sessions Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Session Details</h3>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}