import { apiClient } from '@/lib/api'

// Types
export interface Client {
  id: number
  name: string
  email: string
  phone: string
  gst_number: string
  website: string
  rating: number
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  country: string
  postal_code: string
  created_at: string
  updated_at: string
}

export interface Quotation {
  id: number
  client?: number
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  quotation_number: string
  title: string
  description: string
  status: string
  issue_date: string
  expiry_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes: string
  terms_conditions: string
  created_at: string
  updated_at: string
}

export interface ListResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

// Client Service
export const clientService = {
  async list(params?: Record<string, any>) {
    const queryParams = new URLSearchParams(params)
    return apiClient.get<ListResponse<Client>>(`/clients/?${queryParams}`)
  },

  async retrieve(id: number) {
    return apiClient.get<Client>(`/clients/${id}/`)
  },

  async create(data: Partial<Client>) {
    return apiClient.post<Client>('/clients/', data)
  },

  async update(id: number, data: Partial<Client>) {
    return apiClient.put<Client>(`/clients/${id}/`, data)
  },

  async partialUpdate(id: number, data: Partial<Client>) {
    return apiClient.patch<Client>(`/clients/${id}/`, data)
  },

  async delete(id: number) {
    return apiClient.delete(`/clients/${id}/`)
  }
}

// Quotation Service
export const quotationService = {
  async list(params?: Record<string, any>) {
    const queryParams = new URLSearchParams(params)
    return apiClient.get<ListResponse<Quotation>>(`/quotations/?${queryParams}`)
  },

  async retrieve(id: number) {
    return apiClient.get<Quotation>(`/quotations/${id}/`)
  },

  async create(data: Partial<Quotation>) {
    return apiClient.post<Quotation>('/quotations/', data)
  },

  async update(id: number, data: Partial<Quotation>) {
    return apiClient.put<Quotation>(`/quotations/${id}/`, data)
  },

  async partialUpdate(id: number, data: Partial<Quotation>) {
    return apiClient.patch<Quotation>(`/quotations/${id}/`, data)
  },

  async delete(id: number) {
    return apiClient.delete(`/quotations/${id}/`)
  },

  // Additional quotation-specific methods
  async generatePDF(id: number) {
    return apiClient.get(`/quotations/${id}/pdf/`, {
      responseType: 'blob'
    })
  },

  async sendToClient(id: number, emailData?: any) {
    return apiClient.post(`/quotations/${id}/send/`, emailData)
  },

  async changeStatus(id: number, status: string) {
    return apiClient.patch(`/quotations/${id}/`, { status })
  }
}

// Employee Service (if needed)
export const employeeService = {
  async list(params?: Record<string, any>) {
    const queryParams = new URLSearchParams(params)
    return apiClient.get<ListResponse<any>>(`/accounts/users/?${queryParams}`)
  },

  async retrieve(id: number) {
    return apiClient.get<any>(`/accounts/users/${id}/`)
  },

  async create(data: any) {
    return apiClient.post<any>('/accounts/users/', data)
  },

  async update(id: number, data: any) {
    return apiClient.put<any>(`/accounts/users/${id}/`, data)
  },

  async partialUpdate(id: number, data: any) {
    return apiClient.patch<any>(`/accounts/users/${id}/`, data)
  },

  async delete(id: number) {
    return apiClient.delete(`/accounts/users/${id}/`)
  }
}

// Auth Service
export const authService = {
  async login(email: string, password: string) {
    return apiClient.post('/accounts/token/', { email, password })
  },

  async register(data: any) {
    return apiClient.post('/accounts/register/', data)
  },

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await apiClient.post('/accounts/logout/', { refresh_token: refreshToken })
      } catch (error) {
        console.error('Logout API call failed:', error)
      }
    }
    
    // Clear tokens regardless of API call result
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
  },

  async refreshToken(refresh: string) {
    return apiClient.post('/accounts/token/refresh/', { refresh })
  },

  async getCurrentUser() {
    return apiClient.get('/accounts/profile/')
  },

  async updateProfile(data: any) {
    return apiClient.patch('/accounts/profile/', data)
  }
}

// Export all services
export default {
  client: clientService,
  quotation: quotationService,
  employee: employeeService,
  auth: authService
}