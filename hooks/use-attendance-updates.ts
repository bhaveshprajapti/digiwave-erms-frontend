"use client"

import { useEffect, useCallback } from 'react'

// Custom event types for attendance updates
export const ATTENDANCE_EVENTS = {
  CHECK_IN: 'attendance:check-in',
  START_BREAK: 'attendance:start-break',
  END_BREAK: 'attendance:end-break',
  END_OF_DAY: 'attendance:end-of-day',
  STATUS_UPDATE: 'attendance:status-update',
  REFRESH_NEEDED: 'attendance:refresh-needed'
} as const

type AttendanceEventType = typeof ATTENDANCE_EVENTS[keyof typeof ATTENDANCE_EVENTS]

interface AttendanceEventDetail {
  userId?: number
  date?: string
  sessionCount?: number
  totalHours?: string
  dayStatus?: string
  type: 'check-in' | 'start-break' | 'end-break' | 'end-of-day' | 'status-update' | 'refresh'
}

// Custom hook for listening to attendance updates
export function useAttendanceUpdates(callback: () => void) {
  useEffect(() => {
    const handleAttendanceEvent = (event: CustomEvent<AttendanceEventDetail>) => {
      console.log('Attendance event received:', event.detail)
      // Add small delay to ensure backend has processed the data
      setTimeout(callback, 500)
    }

    // Listen to all attendance events
    window.addEventListener(ATTENDANCE_EVENTS.CHECK_IN, handleAttendanceEvent as EventListener)
    window.addEventListener(ATTENDANCE_EVENTS.START_BREAK, handleAttendanceEvent as EventListener)
    window.addEventListener(ATTENDANCE_EVENTS.END_BREAK, handleAttendanceEvent as EventListener)
    window.addEventListener(ATTENDANCE_EVENTS.END_OF_DAY, handleAttendanceEvent as EventListener)
    window.addEventListener(ATTENDANCE_EVENTS.STATUS_UPDATE, handleAttendanceEvent as EventListener)
    window.addEventListener(ATTENDANCE_EVENTS.REFRESH_NEEDED, handleAttendanceEvent as EventListener)

    return () => {
      window.removeEventListener(ATTENDANCE_EVENTS.CHECK_IN, handleAttendanceEvent as EventListener)
      window.removeEventListener(ATTENDANCE_EVENTS.START_BREAK, handleAttendanceEvent as EventListener)
      window.removeEventListener(ATTENDANCE_EVENTS.END_BREAK, handleAttendanceEvent as EventListener)
      window.removeEventListener(ATTENDANCE_EVENTS.END_OF_DAY, handleAttendanceEvent as EventListener)
      window.removeEventListener(ATTENDANCE_EVENTS.STATUS_UPDATE, handleAttendanceEvent as EventListener)
      window.removeEventListener(ATTENDANCE_EVENTS.REFRESH_NEEDED, handleAttendanceEvent as EventListener)
    }
  }, [callback])
}

// Helper function to dispatch attendance events
export function dispatchAttendanceEvent(
  type: AttendanceEventType, 
  detail: Partial<AttendanceEventDetail>
) {
  const event = new CustomEvent(type, {
    detail: { ...detail, type: type.split(':')[1] as any }
  })
  window.dispatchEvent(event)
}

// Convenience functions for specific events
export const attendanceEvents = {
  checkIn: (userId: number, sessionCount: number) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.CHECK_IN, { userId, sessionCount }),
  
  startBreak: (userId: number, sessionCount: number) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.START_BREAK, { userId, sessionCount }),
  
  endBreak: (userId: number, sessionCount: number) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.END_BREAK, { userId, sessionCount }),
  
  endOfDay: (userId: number, totalHours: string, dayStatus: string) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.END_OF_DAY, { userId, totalHours, dayStatus }),
  
  statusUpdate: (userId: number, date: string) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.STATUS_UPDATE, { userId, date }),
  
  refreshNeeded: () => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.REFRESH_NEEDED, {})
}