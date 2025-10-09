import api from '@/lib/api'

export interface FlexibleTimingType {
  id: number
  name: string
  code: string
  description?: string
  max_duration_minutes: number
  max_per_month: number
  requires_approval: boolean
  advance_notice_hours: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FlexibleTimingRequest {
  id: number
  user: number
  user_name: string
  timing_type: number
  timing_type_name: string
  request_type: 'late_arrival' | 'early_departure' | 'extended_break' | 'custom'
  request_type_display: string
  requested_date: string
  duration_minutes: number
  start_time?: string
  end_time?: string
  reason: string
  is_emergency: boolean
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'used' | 'expired'
  status_display: string
  approved_by?: number
  approved_by_name?: string
  approved_at?: string
  rejection_reason?: string
  admin_comments?: string
  used_at?: string
  actual_duration_minutes?: number
  applied_at: string
  updated_at: string
  can_cancel: boolean
  can_use: boolean
  monthly_usage_count: number
}

export interface FlexibleTimingBalance {
  id: number
  user: number
  user_name: string
  timing_type: number
  timing_type_name: string
  timing_type_code: string
  year: number
  month: number
  total_allowed: number
  used_count: number
  pending_count: number
  remaining_count: number
  can_request_more: boolean
  total_duration_used: number
  total_duration_pending: number
  created_at: string
  updated_at: string
}

export interface CreateFlexibleTimingRequest {
  timing_type: number
  requested_date: string
  duration_minutes: number
  start_time?: string
  end_time?: string
  reason: string
  is_emergency?: boolean
}

// Flexible Timing Types
export const getFlexibleTimingTypes = async (): Promise<FlexibleTimingType[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-types/')
  return response.data
}

// Flexible Timing Requests
export const getFlexibleTimingRequests = async (params?: {
  status?: string
  start_date?: string
  end_date?: string
}): Promise<FlexibleTimingRequest[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-requests/', { params })
  return response.data
}

export const getMyFlexibleTimingRequests = async (params?: {
  status?: string
  start_date?: string
  end_date?: string
}): Promise<FlexibleTimingRequest[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-requests/my_requests/', { params })
  return response.data
}

export const createFlexibleTimingRequest = async (data: CreateFlexibleTimingRequest): Promise<FlexibleTimingRequest> => {
  const response = await api.post('/leave/api/v1/flexible-timing-requests/', data)
  return response.data
}

export const updateFlexibleTimingRequest = async (id: number, data: Partial<CreateFlexibleTimingRequest>): Promise<FlexibleTimingRequest> => {
  const response = await api.patch(`/leave/api/v1/flexible-timing-requests/${id}/`, data)
  return response.data
}

export const deleteFlexibleTimingRequest = async (id: number): Promise<void> => {
  await api.delete(`/leave/api/v1/flexible-timing-requests/${id}/`)
}

export const approveFlexibleTimingRequest = async (id: number, comments?: string): Promise<FlexibleTimingRequest> => {
  const response = await api.post(`/leave/api/v1/flexible-timing-requests/${id}/approve/`, { comments })
  return response.data
}

export const rejectFlexibleTimingRequest = async (id: number, reason: string, comments?: string): Promise<FlexibleTimingRequest> => {
  const response = await api.post(`/leave/api/v1/flexible-timing-requests/${id}/reject/`, { reason, comments })
  return response.data
}

export const cancelFlexibleTimingRequest = async (id: number): Promise<FlexibleTimingRequest> => {
  const response = await api.post(`/leave/api/v1/flexible-timing-requests/${id}/cancel/`)
  return response.data
}

export const markFlexibleTimingRequestAsUsed = async (id: number, actualDurationMinutes?: number): Promise<FlexibleTimingRequest> => {
  const response = await api.post(`/leave/api/v1/flexible-timing-requests/${id}/mark_used/`, {
    actual_duration_minutes: actualDurationMinutes
  })
  return response.data
}

export const getPendingFlexibleTimingRequests = async (): Promise<FlexibleTimingRequest[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-requests/pending_requests/')
  return response.data
}

export const getTodayApprovedFlexibleTimingRequests = async (): Promise<FlexibleTimingRequest[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-requests/today_approved/')
  return response.data
}

// Flexible Timing Balances
export const getMyFlexibleTimingBalance = async (params?: {
  year?: number
  month?: number
}): Promise<FlexibleTimingBalance[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-requests/my_balance/', { params })
  return response.data
}

export const getFlexibleTimingBalances = async (): Promise<FlexibleTimingBalance[]> => {
  const response = await api.get('/leave/api/v1/flexible-timing-balances/')
  return response.data
}

export const refreshFlexibleTimingBalances = async (): Promise<{ message: string }> => {
  const response = await api.post('/leave/api/v1/flexible-timing-balances/refresh_balances/')
  return response.data
}

// Flexible Timing Type Management
export const createFlexibleTimingType = async (data: Omit<FlexibleTimingType, 'id' | 'created_at' | 'updated_at'>): Promise<FlexibleTimingType> => {
  const response = await api.post('/leave/api/v1/flexible-timing-types/', data)
  return response.data
}

export const updateFlexibleTimingType = async (id: number, data: Partial<Omit<FlexibleTimingType, 'id' | 'created_at' | 'updated_at'>>): Promise<FlexibleTimingType> => {
  const response = await api.patch(`/leave/api/v1/flexible-timing-types/${id}/`, data)
  return response.data
}

export const deleteFlexibleTimingType = async (id: number): Promise<void> => {
  await api.delete(`/leave/api/v1/flexible-timing-types/${id}/`)
}
