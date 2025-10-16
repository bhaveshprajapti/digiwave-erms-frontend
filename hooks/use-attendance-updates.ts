"use client"

import { useEffect, useCallback } from 'react'

// Custom event types for attendance updates
export const ATTENDANCE_EVENTS = {
  CHECK_IN: 'attendance:check-in',
  CHECK_OUT: 'attendance:check-out',
  STATUS_UPDATE: 'attendance:status-update',
  REFRESH_NEEDED: 'attendance:refresh-needed'
} as const

type AttendanceEventType = typeof ATTENDANCE_EVENTS[keyof typeof ATTENDANCE_EVENTS]

interface AttendanceEventDetail {
  userId?: number
  date?: string
  sessionCount?: number
  totalHours?: string
  type: 'check-in' | 'check-out' | 'status-update' | 'refresh'
}

// Custom hook for listening to attendance updates
export function useAttendanceUpdates(callback: () => void) {
  useEffect(() => {
    const handleCheckIn = (event: CustomEvent<AttendanceEventDetail>) => {
      console.log('Check-in event received:', event.detail)
      // Add small delay to ensure backend has processed the data
      setTimeout(callback, 500)
    }

    const handleCheckOut = (event: CustomEvent<AttendanceEventDetail>) => {
      console.log('Check-out event received:', event.detail)
      // Add small delay to ensure backend has processed the data
      setTimeout(callback, 500)
    }

    // Only listen to check-in and check-out events
    window.addEventListener(ATTENDANCE_EVENTS.CHECK_IN, handleCheckIn as EventListener)
    window.addEventListener(ATTENDANCE_EVENTS.CHECK_OUT, handleCheckOut as EventListener)

    return () => {
      window.removeEventListener(ATTENDANCE_EVENTS.CHECK_IN, handleCheckIn as EventListener)
      window.removeEventListener(ATTENDANCE_EVENTS.CHECK_OUT, handleCheckOut as EventListener)
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
  
  checkOut: (userId: number, sessionCount: number, totalHours: string) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.CHECK_OUT, { userId, sessionCount, totalHours }),
  
  statusUpdate: (userId: number, date: string) => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.STATUS_UPDATE, { userId, date }),
  
  refreshNeeded: () => 
    dispatchAttendanceEvent(ATTENDANCE_EVENTS.REFRESH_NEEDED, {})
}