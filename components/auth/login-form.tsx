"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api" // Import the new api instance

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const resp = await api.post("/accounts/login", {
        username,
        password
      })

      const token = resp.data.token
      if (!token) throw new Error("No token returned from server.")

      // Store token for authenticated requests
      localStorage.setItem("authToken", token)

      // The interceptor in `lib/api.ts` will now automatically add the token
      // to subsequent requests.
      const userResp = await api.get("/accounts/users/me/")

      if (userResp.data) {
        localStorage.setItem("user", JSON.stringify(userResp.data))
      } else {
        console.error("Failed to fetch user data after login.")
      }

      router.push("/dashboard")
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred."
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorData = err.response.data
        errorMessage = errorData.non_field_errors?.[0] || "Invalid credentials."
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection."
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      })
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
