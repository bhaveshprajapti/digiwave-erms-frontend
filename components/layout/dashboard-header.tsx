"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { useEffect, useState } from "react"
import { MobileNav } from "./mobile-nav"
import authService, { type User as AuthUser } from "@/lib/auth"

export function DashboardHeader() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  // Keep display strings in state to avoid SSR/client hydration mismatches
  const [displayName, setDisplayName] = useState<string>('User')
  const [fullName, setFullName] = useState<string>('User')

  useEffect(() => {
    const userData = authService.getUserData()
    setUser(userData)
    // Update names on client after mount only
    const dn = authService.getUserDisplayName()
    const fn = authService.getUserFullName()
    setDisplayName(dn)
    setFullName(fn)
  }, [])

  const handleLogout = () => {
    authService.logout()
  }

  // Names are derived in useEffect to keep server and first client render consistent
  const userInitial = user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <MobileNav />
        <div>
          <h1 className="text-base font-semibold md:text-lg">Welcome back, {displayName}</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">{user?.organization?.name || user?.role?.name || 'Employee'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email || user?.username}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
