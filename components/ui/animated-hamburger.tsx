"use client"

import { cn } from "@/lib/utils"

interface AnimatedHamburgerProps {
  isOpen: boolean
  className?: string
  size?: number
}

export function AnimatedHamburger({ isOpen, className, size = 20 }: AnimatedHamburgerProps) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="transition-all duration-300"
      >
        {/* Top line */}
        <path
          d="M3 6h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300 origin-center",
            isOpen 
              ? "rotate-45 translate-y-[7px]" 
              : "rotate-0 translate-y-0"
          )}
        />
        
        {/* Middle line */}
        <path
          d="M3 12h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300",
            isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
          )}
        />
        
        {/* Bottom line */}
        <path
          d="M3 18h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300 origin-center",
            isOpen 
              ? "-rotate-45 -translate-y-[7px]" 
              : "rotate-0 translate-y-0"
          )}
        />
      </svg>
    </div>
  )
}