"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true) // Default to open on desktop

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      // Auto-close on mobile, auto-open on desktop
      if (window.innerWidth < 768) {
        setIsOpen(false)
      } else {
        // Check if user has a saved preference
        const saved = localStorage.getItem('sidebar-open')
        if (saved !== null) {
          setIsOpen(JSON.parse(saved))
        } else {
          setIsOpen(true) // Default to open on desktop
        }
      }
    }

    // Set initial state
    handleResize()

    // Listen for window resize
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    // Save preference for desktop users
    if (window.innerWidth >= 768) {
      localStorage.setItem('sidebar-open', JSON.stringify(newState))
    }
  }

  const open = () => {
    setIsOpen(true)
    if (window.innerWidth >= 768) {
      localStorage.setItem('sidebar-open', 'true')
    }
  }

  const close = () => {
    setIsOpen(false)
    if (window.innerWidth >= 768) {
      localStorage.setItem('sidebar-open', 'false')
    }
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}