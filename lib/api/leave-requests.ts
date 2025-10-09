import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { LeaveRequest } from "@/lib/schemas"

const base = "/leave/api/v1/applications/"

export interface LeaveRequestFilters {
  status?: string
  user?: number
  leave_type?: number
  start_date?: string
  end_date?: string
}

export const getLeaveRequests = async (filters: LeaveRequestFilters = {}): Promise<LeaveRequest[]> => {
  const res: AxiosResponse<LeaveRequest[]> = await api.get(base, { params: filters })
  return res.data
}

export const getMyLeaveApplications = async (filters?: { status?: string }): Promise<LeaveRequest[]> => {
  const res: AxiosResponse<LeaveRequest[]> = await api.get(`${base}my_applications/`, { params: filters })
  return res.data
}

export const getPendingApprovals = async (): Promise<LeaveRequest[]> => {
  const res: AxiosResponse<LeaveRequest[]> = await api.get(`${base}pending_approvals/`)
  return res.data
}

export const createLeaveRequest = async (data: {
  leave_type: number
  start_date: string
  end_date: string
  is_half_day?: boolean
  half_day_period?: 'morning' | 'afternoon'
  reason: string
  emergency_contact?: string
  emergency_phone?: string
  work_handover?: string
  attachment?: File
}): Promise<LeaveRequest> => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value)
      } else {
        formData.append(key, String(value))
      }
    }
  })
  
  const res: AxiosResponse<LeaveRequest> = await api.post(base, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

export const updateLeaveRequest = async (id: number, data: Partial<Omit<LeaveRequest, "id">>): Promise<LeaveRequest> => {
  const res: AxiosResponse<LeaveRequest> = await api.patch(`${base}${id}/`, data)
  return res.data
}

export const deleteLeaveRequest = async (id: number): Promise<void> => {
  await api.delete(`${base}${id}/`)
}

export const approveLeaveRequest = async (id: number, comments?: string): Promise<{ message: string }> => {
  const res: AxiosResponse<{ message: string }> = await api.post(`${base}${id}/approve/`, {
    action: 'approve',
    comments
  })
  return res.data
}

export const rejectLeaveRequest = async (id: number, rejection_reason: string, comments?: string): Promise<{ message: string }> => {
  const res: AxiosResponse<{ message: string }> = await api.post(`${base}${id}/approve/`, {
    action: 'reject',
    rejection_reason,
    comments
  })
  return res.data
}

export const cancelLeaveRequest = async (id: number): Promise<{ message: string }> => {
  const res: AxiosResponse<{ message: string }> = await api.post(`${base}${id}/cancel/`)
  return res.data
}

export const getLeaveApplicationComments = async (id: number): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await api.get(`${base}${id}/comments/`)
  return res.data
}

export const addLeaveApplicationComment = async (id: number, comment: string, is_internal?: boolean): Promise<any> => {
  // Import authService dynamically to avoid circular imports
  const { authService } = await import('@/lib/auth')
  
  // Try to get user ID from authService
  let userId = null
  
  try {
    const userData = authService.getUserData()
    userId = userData?.id
  } catch (e) {
    console.warn('Could not get user from authService:', e)
  }
  
  // If no user ID from authService, try localStorage as fallback
  if (!userId) {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        userId = user.id || user.user_id
      }
    } catch (e) {
      console.warn('Could not parse user from localStorage:', e)
    }
  }
  
  // If still no user ID, let the backend handle it (it might get it from the session/token)
  const payload: any = {
    comment,
    is_internal: is_internal || false
  }
  
  // Only add user ID if we have it
  if (userId) {
    payload.user = userId
  }
  
  console.log('Adding comment with payload:', payload)
  
  try {
    const res: AxiosResponse<any> = await api.post(`${base}${id}/add_comment/`, payload)
    return res.data
  } catch (error: any) {
    console.error('Comment API error:', error.response?.data)
    
    // If user field is required but not provided, try without it (let backend handle from token)
    if (error.response?.status === 400 && error.response?.data?.user) {
      console.log('Retrying without user field...')
      const { user, ...payloadWithoutUser } = payload
      const retryRes: AxiosResponse<any> = await api.post(`${base}${id}/add_comment/`, payloadWithoutUser)
      return retryRes.data
    }
    
    throw error
  }
}
