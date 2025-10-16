import api from './api'

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_DATA_KEY = 'user_data'

// Remember me storage keys
const REMEMBER_USERNAME_KEY = 'remember_username'
const REMEMBER_PASSWORD_KEY = 'remember_password'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
  phone?: string
  employee_type?: string
  organization?: {
    id: number
    name: string
  }
  role?: {
    id: number
    name: string
  }
  joining_date?: string
  profile_picture?: string
}

export interface LoginResponse {
  access: string
  refresh: string
  message: string
  user: User
}

class AuthService {
  // Token management
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY)
    }
    return null
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    }
    return null
  }

  removeTokens(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_DATA_KEY)
      // Also remove old token format for compatibility
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    }
  }

  // User data management
  setUserData(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
    }
  }

  getUserData(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_DATA_KEY)
      if (userData) {
        try {
          return JSON.parse(userData)
        } catch (error) {
          console.error('Error parsing user data:', error)
          return null
        }
      }
    }
    return null
  }

  // Remember me functionality
  setRememberMe(username: string, password: string, remember: boolean): void {
    if (typeof window !== 'undefined') {
      if (remember) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, username)
        // Note: In production, you might want to encrypt the password or use a different approach
        localStorage.setItem(REMEMBER_PASSWORD_KEY, password)
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY)
        localStorage.removeItem(REMEMBER_PASSWORD_KEY)
      }
    }
  }

  getRememberedCredentials(): { username: string; password: string } | null {
    if (typeof window !== 'undefined') {
      const username = localStorage.getItem(REMEMBER_USERNAME_KEY)
      const password = localStorage.getItem(REMEMBER_PASSWORD_KEY)
      if (username && password) {
        return { username, password }
      }
    }
    return null
  }

  clearRememberedCredentials(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REMEMBER_USERNAME_KEY)
      localStorage.removeItem(REMEMBER_PASSWORD_KEY)
    }
  }

  // Authentication methods
  async login(username: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    try {
      const response = await api.post('/accounts/login', {
        username,
        password
      })

      const data: LoginResponse = response.data

      // Clear data only if a different user is logging in
      this.clearOtherUsersData(data.user.id)
      
      // Store tokens and user data
      this.setTokens(data.access, data.refresh)
      this.setUserData(data.user)

      // Handle remember me
      this.setRememberMe(username, password, rememberMe)

      return data
    } catch (error) {
      throw error
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await api.post('/accounts/token/refresh', {
        refresh: refreshToken
      })

      const { access } = response.data
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, access)
      }

      return access
    } catch (error) {
      // If refresh fails, clear all auth data
      this.logout()
      throw error
    }
  }

  logout(): void {
    // Don't clear attendance data - user should be able to continue their session after re-login
    this.removeTokens()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // Clear other users' data when a different user logs in
  private clearOtherUsersData(newUserId: number): void {
    if (typeof window !== 'undefined') {
      // Get all localStorage keys
      const keys = Object.keys(localStorage)
      
      // Remove attendance data for other users (not the current user)
      keys.forEach(key => {
        if (key.includes('_user_') && key.includes('breakStartTime')) {
          // Extract user ID from key (e.g., "breakStartTime_user_123" -> "123")
          const match = key.match(/_user_(\d+)$/)
          if (match) {
            const keyUserId = parseInt(match[1])
            if (keyUserId !== newUserId) {
              localStorage.removeItem(key)
            }
          }
        }
      })
      
      // Also clear any old non-user-specific keys for cleanup
      localStorage.removeItem('breakStartTime')
    }
  }



  isAuthenticated(): boolean {
    return this.getAccessToken() !== null
  }

  // Get user display name
  getUserDisplayName(): string {
    const user = this.getUserData()
    if (!user) return 'User'
    
    if (user.first_name) {
      return user.first_name
    }
    
    return user.username || 'User'
  }

  // Get user full name
  getUserFullName(): string {
    const user = this.getUserData()
    if (!user) return 'User'
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    
    if (user.first_name) {
      return user.first_name
    }
    
    return user.username || 'User'
  }
}

export const authService = new AuthService()
export default authService