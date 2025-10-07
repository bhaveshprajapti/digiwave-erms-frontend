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
import { employeeNavigationSections } from "@/components/layout/employee-navigation"

export function EmployeeHeader() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [displayName, setDisplayName] = useState<string>('User')
  const [fullName, setFullName] = useState<string>('User')

  useEffect(() => {
    const userData = authService.getUserData()
    setUser(userData)
    setDisplayName(authService.getUserDisplayName())
    setFullName(authService.getUserFullName())
  }, [])

  const handleLogout = () => {
    authService.logout()
  }

  const userInitial = user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#001f3f] via-[#0a2540] to-[#0074d9] px-4 text-white shadow-sm md:px-6">
      <div className="flex items-center gap-4">
        <MobileNav sections={employeeNavigationSections} />
        <div>
          <h1 className="text-base font-semibold md:text-lg">Welcome, {displayName}</h1>
          <p className="hidden text-sm text-white/70 sm:block">{user?.organization?.name || 'Employee'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="text-white/90 hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full text-white/90 hover:bg-white/10">
              <Avatar>
                <AvatarFallback className="bg-white/10 text-white">{userInitial}</AvatarFallback>
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
