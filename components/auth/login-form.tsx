"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import authService from "@/lib/auth"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Load remembered credentials on component mount
  useEffect(() => {
    const remembered = authService.getRememberedCredentials()
    if (remembered) {
      setUsername(remembered.username)
      setPassword(remembered.password)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("") // Clear any previous errors

    try {
      const response = await authService.login(username, password, rememberMe)
      
      // Show success message
      toast({
        title: "Login Successful",
        description: response.message || "Welcome back!",
      })
      
      // Redirect based on user role
      if (response.user.is_superuser || response.user.is_staff) {
        // Admin/Staff users go to admin dashboard
        router.push("/dashboard")
      } else {
        // Regular employees go to employee dashboard
        router.push("/employee-dashboard")
      }
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred."
      let errorTitle = "Login Failed"
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorData = err.response.data
        const statusCode = err.response.status
        
        if (statusCode === 400) {
          // Bad request - usually invalid credentials
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.details) {
            errorMessage = errorData.details
          } else if (errorData.non_field_errors?.[0]) {
            errorMessage = errorData.non_field_errors[0]
          } else if (errorData.username) {
            errorMessage = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username
          } else if (errorData.password) {
            errorMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
          } else {
            errorMessage = "Invalid username or password. Please check your credentials and try again."
          }
        } else if (statusCode === 401) {
          errorMessage = errorData.error || errorData.details || "Authentication failed. Please check your credentials."
        } else if (statusCode === 403) {
          errorMessage = errorData.error || errorData.details || "Access denied. Your account may be inactive or suspended."
        } else if (statusCode === 404) {
          errorMessage = errorData.error || errorData.details || "User account not found. Please check your username or contact support."
        } else if (statusCode >= 500) {
          errorMessage = errorData.error || errorData.details || "Server error. Please try again later or contact support."
          errorTitle = "Server Error"
        } else {
          errorMessage = errorData.error || errorData.details || errorData.detail || errorData.message || "Login failed. Please try again."
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "Unable to connect to server. Please check your internet connection and try again."
        errorTitle = "Connection Error"
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || "An unexpected error occurred while logging in."
      }

      // Set error state for form display
      setError(errorMessage)
      
      // Show the toast with the error
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      })
      
      // Log the full error for debugging
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-transparent">
          <img src="/digiwave-logo.png" alt="Digiwave" className="h-12 w-12" />
        </div>
        <CardTitle className="text-2xl">Digiwave</CardTitle>
        <CardDescription>Sign in to your Digiwave workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={error ? "border-red-500 focus-visible:ring-red-500 pr-9" : "pr-9"}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-2.28-2.28a12.73 12.73 0 0 0 3.2-4.65.75.75 0 0 0 0-.56C20.92 7.07 16.7 4.5 12 4.5c-1.64 0-3.2.33-4.62.95L3.53 2.47ZM12 6c3.9 0 7.59 2.18 9.94 6-1.04 1.73-2.36 3.1-3.87 4.07l-2.03-2.03a4.5 4.5 0 0 0-6.08-6.08L7.9 6.9C9.2 6.32 10.57 6 12 6Zm0 12a9.72 9.72 0 0 0 3.53-.65l-1.67-1.67a4.5 4.5 0 0 1-6.54-6.54L5.4 7.71C3.5 8.96 1.91 10.68 1.06 12c1.95 3.22 6.17 6 10.94 6Z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 5c-5 0-9 3.5-10.94 7 1.94 3.5 5.94 7 10.94 7s9-3.5 10.94-7C21 8.5 17 5 12 5Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember-me"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>
            {/* Forgot password temporarily disabled */}
            {/* <a href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</a> */}
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
