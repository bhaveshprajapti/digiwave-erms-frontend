"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { getLeaveRequests, getMyLeaveApplications } from '@/lib/api/leave-requests'
import { getMyLeaveBalances } from '@/lib/api/leave-balances'
import { LeaveRequest } from '@/lib/schemas'
import { useLeaveUpdates } from '@/hooks/use-leave-updates'

interface LeaveRequestsContextType {
  // State
  requests: LeaveRequest[]
  balances: any[]
  loading: boolean
  
  // Actions
  refreshRequests: () => Promise<void>
  refreshBalances: () => Promise<void>
  refreshAll: () => Promise<void>
  addRequest: (request: LeaveRequest) => void
  updateRequest: (id: number, updates: Partial<LeaveRequest>) => void
  removeRequest: (id: number) => void
  setRequests: (requests: LeaveRequest[]) => void
  
  // Filters
  filteredRequests: LeaveRequest[]
  setFilters: (filters: RequestFilters) => void
}

interface RequestFilters {
  status?: string | number
  leaveType?: string | number
  startDate?: Date
  endDate?: Date
  userId?: number
}

const LeaveRequestsContext = createContext<LeaveRequestsContextType | undefined>(undefined)

interface LeaveRequestsProviderProps {
  children: ReactNode
}

export function LeaveRequestsProvider({ children }: LeaveRequestsProviderProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [balances, setBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<RequestFilters>({})

  const refreshRequests = useCallback(async () => {
    setLoading(true)
    try {
      // Use getMyLeaveApplications for employee's own requests to ensure latest status
      const data = await getMyLeaveApplications()
      setRequests(data)
    } catch (error) {
      console.error('Failed to refresh requests:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for leave events and auto-refresh
  useLeaveUpdates(refreshRequests)

  const refreshBalances = useCallback(async () => {
    try {
      const data = await getMyLeaveBalances()
      setBalances(data)
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [requestsData, balancesData] = await Promise.all([
        getMyLeaveApplications(), // Use employee-specific API for latest status
        getMyLeaveBalances().catch(() => [])
      ])
      setRequests(requestsData)
      setBalances(balancesData)
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const addRequest = useCallback((request: LeaveRequest) => {
    setRequests(prev => [request, ...prev])
  }, [])

  const updateRequest = useCallback((id: number, updates: Partial<LeaveRequest>) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ))
  }, [])

  const removeRequest = useCallback((id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id))
  }, [])

  // Apply filters to requests
  const filteredRequests = React.useMemo(() => {
    return requests.filter(request => {
      if (filters.status && request.status !== filters.status) return false
      if (filters.leaveType && request.leave_type.toString() !== filters.leaveType) return false
      if (filters.userId && request.user !== filters.userId) return false
      
      if (filters.startDate) {
        const requestDate = new Date(request.start_date)
        if (requestDate < filters.startDate) return false
      }
      
      if (filters.endDate) {
        const requestDate = new Date(request.start_date)
        if (requestDate > filters.endDate) return false
      }
      
      return true
    })
  }, [requests, filters])

  const value: LeaveRequestsContextType = {
    requests,
    balances,
    loading,
    refreshRequests,
    refreshBalances,
    refreshAll,
    addRequest,
    updateRequest,
    removeRequest,
    setRequests,
    filteredRequests,
    setFilters
  }

  return (
    <LeaveRequestsContext.Provider value={value}>
      {children}
    </LeaveRequestsContext.Provider>
  )
}

export function useLeaveRequestsContext() {
  const context = useContext(LeaveRequestsContext)
  if (context === undefined) {
    throw new Error('useLeaveRequestsContext must be used within a LeaveRequestsProvider')
  }
  return context
}

// Hook for admin to get all requests with additional filters
export function useAdminLeaveRequests() {
  const context = useLeaveRequestsContext()
  
  const refreshAdminRequests = useCallback(async () => {
    // Admin should use the full API to see all requests
    try {
      const data = await getLeaveRequests()
      context.setRequests(data)
    } catch (error) {
      console.error('Failed to refresh admin requests:', error)
    }
  }, [context])

  return {
    ...context,
    refreshAdminRequests,
    // Override refresh for admin to use full API
    refreshRequests: refreshAdminRequests
  }
}
