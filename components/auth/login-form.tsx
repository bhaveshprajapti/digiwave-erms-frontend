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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Employee Resource Management</CardTitle>
        <CardDescription>Sign in to access your workspace</CardDescription>
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </div>
          
          {/* Remember Me Checkbox */}
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
