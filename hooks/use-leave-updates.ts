"use client"

import { useEffect, useCallback } from 'react'

// Custom event types for leave updates
export const LEAVE_EVENTS = {
  REQUEST_CREATED: 'leave:request-created',
  REQUEST_UPDATED: 'leave:request-updated',
  REQUEST_DELETED: 'leave:request-deleted',
  STATUS_CHANGED: 'leave:status-changed',
  REFRESH_NEEDED: 'leave:refresh-needed'
} as const

type LeaveEventType = typeof LEAVE_EVENTS[keyof typeof LEAVE_EVENTS]

interface LeaveEventDetail {
  requestId?: number
  userId?: number
  status?: string
  type: 'created' | 'updated' | 'deleted' | 'status-changed' | 'refresh'
}

// Custom hook for listening to leave updates
export function useLeaveUpdates(callback: () => void) {
  useEffect(() => {
    const handleLeaveEvent = (event: CustomEvent<LeaveEventDetail>) => {
      console.log('Leave event received:', event.detail)
      // Add small delay to ensure backend has processed the data
      setTimeout(callback, 300)
    }

    // Listen to all leave events
    window.addEventListener(LEAVE_EVENTS.REQUEST_CREATED, handleLeaveEvent as EventListener)
    window.addEventListener(LEAVE_EVENTS.REQUEST_UPDATED, handleLeaveEvent as EventListener)
    window.addEventListener(LEAVE_EVENTS.REQUEST_DELETED, handleLeaveEvent as EventListener)
    window.addEventListener(LEAVE_EVENTS.STATUS_CHANGED, handleLeaveEvent as EventListener)
    window.addEventListener(LEAVE_EVENTS.REFRESH_NEEDED, handleLeaveEvent as EventListener)

    return () => {
      window.removeEventListener(LEAVE_EVENTS.REQUEST_CREATED, handleLeaveEvent as EventListener)
      window.removeEventListener(LEAVE_EVENTS.REQUEST_UPDATED, handleLeaveEvent as EventListener)
      window.removeEventListener(LEAVE_EVENTS.REQUEST_DELETED, handleLeaveEvent as EventListener)
      window.removeEventListener(LEAVE_EVENTS.STATUS_CHANGED, handleLeaveEvent as EventListener)
      window.removeEventListener(LEAVE_EVENTS.REFRESH_NEEDED, handleLeaveEvent as EventListener)
    }
  }, [callback])
}

// Helper function to dispatch leave events
export function dispatchLeaveEvent(
  type: LeaveEventType, 
  detail: Partial<LeaveEventDetail>
) {
  const event = new CustomEvent(type, {
    detail: { ...detail, type: type.split(':')[1] as any }
  })
  window.dispatchEvent(event)
}

// Convenience functions for specific events
export const leaveEvents = {
  requestCreated: (requestId: number, userId: number) => 
    dispatchLeaveEvent(LEAVE_EVENTS.REQUEST_CREATED, { requestId, userId }),
  
  requestUpdated: (requestId: number, userId: number) => 
    dispatchLeaveEvent(LEAVE_EVENTS.REQUEST_UPDATED, { requestId, userId }),
  
  requestDeleted: (requestId: number, userId: number) => 
    dispatchLeaveEvent(LEAVE_EVENTS.REQUEST_DELETED, { requestId, userId }),
  
  statusChanged: (requestId: number, userId: number, status: string) => 
    dispatchLeaveEvent(LEAVE_EVENTS.STATUS_CHANGED, { requestId, userId, status }),
  
  refreshNeeded: () => 
    dispatchLeaveEvent(LEAVE_EVENTS.REFRESH_NEEDED, {})
}