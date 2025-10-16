"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, LogIn, LogOut, Timer, Users, Coffee, CheckCircle } from "lucide-react"

interface SessionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendance: any
}

export function SessionDetailsModal({ open, onOpenChange, attendance }: SessionDetailsModalProps) {
  if (!attendance) return null

  const sessions = attendance.sessions || []
  const formatTime = (timeString: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[95vw] max-h-[90vh] overflow-y-auto sm:!max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Details - {new Date(attendance.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Working Hours Card */}
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Working Hours</CardTitle>
                <Timer className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 font-mono">{attendance.total_hours || '0:00:00'}</div>
                <p className="text-xs text-muted-foreground">
                  Total time worked
                </p>
              </CardContent>
            </Card>

            {/* Total Sessions Card */}
            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{sessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Check-in sessions
                </p>
              </CardContent>
            </Card>

            {/* Completed Sessions Card */}
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{sessions.filter((s: any) => s.check_out).length}</div>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Break Time</CardTitle>
                <Coffee className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 font-mono">{attendance.break_time || '0:00:00'}</div>
                <p className="text-xs text-muted-foreground">
                  Total break duration
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
              <div className="space-y-4">
                {sessions.map((session: any, index: number) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Session {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(session.check_in).toLocaleDateString()}
                        </span>
                        <Badge variant={session.check_out ? "secondary" : "default"}>
                          {session.check_out ? "Completed" : "Active"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Check In */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                          <LogIn className="h-4 w-4" />
                          Check In
                        </div>
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatTime(session.check_in)}</span>
                          </div>
                          {session.location_in && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-mono">
                                {session.location_in.lat?.toFixed(6)}, {session.location_in.lng?.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Check Out */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                          <LogOut className="h-4 w-4" />
                          Check Out
                        </div>
                        <div className="pl-6 space-y-2">
                          {session.check_out ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{formatTime(session.check_out)}</span>
                              </div>
                              {session.location_out && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {session.location_out.lat?.toFixed(6)}, {session.location_out.lng?.toFixed(6)}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">Still active</div>
                          )}
                        </div>
                      </div>

                      {/* Duration & Status */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                          <Clock className="h-4 w-4" />
                          Duration & Status
                        </div>
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Duration:</span>
                            <span className="font-mono text-sm font-medium">
                              {formatDuration(session.check_in, session.check_out)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Badge variant={session.check_out ? "secondary" : "default"}>
                              {session.check_out ? "Completed" : "Active"}
                            </Badge>
                          </div>
                        </div>
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