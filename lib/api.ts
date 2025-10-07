import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
})

// Token management
const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('access_token')
  }
  return null
}

const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token')
  }
  return null
}

const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('access_token', token)
  }
}

const clearTokens = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    // Also clear old tokens for compatibility
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }
}

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with auto token refresh
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config
    
    console.error('Error response:', error.response?.data);
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/accounts/token/refresh`, {
            refresh: refreshToken
          })
          
          const { access } = response.data
          setAccessToken(access)
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api
