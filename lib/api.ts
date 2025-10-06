import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
})

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', response.data);
    return response;
  },
  error => {
    console.error('Error response:', error.response?.data);
    return Promise.reject(error);
  }
);

// Interceptor to add the auth token to every request if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
  }
  return config
})

export default api
