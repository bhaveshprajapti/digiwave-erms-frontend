"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, MapPin, Timer, Coffee, Calendar, Users } from "lucide-react"
import { listAttendances, AttendanceDTO } from "@/lib/api/attendances"

interface SessionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  userId?: number
}

interface SessionData {
  check_in: string
  check_out?: string
  location_in?: { lat: number; lng: number }
  location_out?: { lat: number; lng: number }
}

export function SessionDetailsModal({ isOpen, onClose, selectedDate, userId }: SessionDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceDTO | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])

  useEffect(() => {
    if (isOpen && selectedDate && userId) {
      loadSessionData()
    }
  }, [isOpen, selectedDate, userId])

  const loadSessionData = async () => {
    if (!selectedDate || !userId) return
    
    setLoading(true)
    try {
      const data = await listAttendances({
        user: userId,
        start_date: selectedDate,
        end_date: selectedDate,
      })
      
      if (data.results.length > 0) {
        const attendance = data.results[0]
        setAttendanceData(attendance)
        setSessions(attendance.sessions || [])
      } else {
        setAttendanceData(null)
        setSessions([])
      }
    } catch (error) {
      console.error('Error loading session data:', error)
      setAttendanceData(null)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "In Progress"
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diff = end.getTime() - start.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const calculateBreakTime = (sessions: SessionData[], sessionIndex: number) => {
    if (sessionIndex === 0) return null
    
    const prevSession = sessions[sessionIndex - 1]
    const currentSession = sessions[sessionIndex]
    
    if (!prevSession.check_out || !currentSession.check_in) return null
    
    const prevCheckOut = new Date(prevSession.check_out)
    const currentCheckIn = new Date(currentSession.check_in)
    const diff = currentCheckIn.getTime() - prevCheckOut.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const getSessionStatus = (session: SessionData) => {
    if (!session.check_out) {
      return { status: "Active", variant: "default" as const, icon: Clock }
    }
    return { status: "Completed", variant: "secondary" as const, icon: Timer }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6" />
            Session Details
            {selectedDate && (
              <span className="text-muted-foreground font-normal text-lg">
                - {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Attendance session details for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'selected date'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground text-lg">Loading session data...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">No attendance data found for this date</div>
            </div>
          ) : (
            <>
              {/* Dashboard Style Summary Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-muted/20 rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                        <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-muted/20 rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {sessions.filter(s => s.check_out).length}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Timer className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-muted/20 rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                        <p className="text-2xl font-bold text-purple-600 font-mono">
                          {attendanceData?.total_hours?.split('.')[0] || "0:00:00"}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`border-l-4 ${
                  sessions.some(s => !s.check_out) 
                    ? 'border-l-orange-500' 
                    : 'border-l-slate-500'
                } bg-gradient-to-br from-card to-muted/20 rounded-lg`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p className={`text-2xl font-bold ${
                          sessions.some(s => !s.check_out) 
                            ? 'text-orange-600' 
                            : 'text-slate-600'
                        }`}>
                          {sessions.some(s => !s.check_out) ? "Active" : "Completed"}
                        </p>
                      </div>
                      <div className={`h-12 w-12 ${
                        sessions.some(s => !s.check_out) 
                          ? 'bg-orange-100' 
                          : 'bg-slate-100'
                      } rounded-lg flex items-center justify-center`}>
                        <MapPin className={`h-6 w-6 ${
                          sessions.some(s => !s.check_out) 
                            ? 'text-orange-600' 
                            : 'text-slate-600'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Details
                </h3>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Session
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Check In
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Check Out
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Break Time
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sessions.map((session, index) => {
                          const breakTime = calculateBreakTime(sessions, index)
                          const { status, variant } = getSessionStatus(session)
                          
                          return (
                            <tr key={index} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                                  </div>
                                  <span className="font-medium">Session {index + 1}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  <div className="font-mono font-semibold text-green-700">
                                    {formatTime(session.check_in)}
                                  </div>
                                  {session.location_in && (
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {session.location_in.lat.toFixed(4)}, {session.location_in.lng.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  <div className={`font-mono font-semibold ${
                                    session.check_out ? 'text-red-700' : 'text-orange-600'
                                  }`}>
                                    {session.check_out ? formatTime(session.check_out) : "In Progress"}
                                  </div>
                                  {session.location_out && (
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {session.location_out.lat.toFixed(4)}, {session.location_out.lng.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono font-semibold text-purple-600">
                                  {formatDuration(session.check_in, session.check_out)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {breakTime ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Coffee className="h-3 w-3 text-amber-500" />
                                      <span className="font-mono text-amber-600 text-sm">{breakTime}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      After Session {index}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    {session.location_in ? 'Tracked' : 'No location'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  variant === 'default' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {status}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {attendanceData?.notes && (
                <div className="border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-muted/20 rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      <h4 className="font-semibold text-lg">Additional Notes</h4>
                    </div>
                    <div className="text-muted-foreground leading-relaxed">{attendanceData.notes}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}