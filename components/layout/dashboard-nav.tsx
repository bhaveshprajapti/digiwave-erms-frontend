"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

// Navigation structure imported to keep mobile and desktop in sync
import { navigationSections } from "@/components/layout/navigation"

// Navigation item component for items with children
function NavItem({ item, pathname, level = 0 }: { item: any, pathname: string, level?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon
  const isActive = pathname === item.href
  const hasActiveChild = hasChildren && item.children.some((child: any) => pathname === child.href)

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            hasActiveChild
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            level > 0 && "ml-4"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{item.label}</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child: any, index: number) => (
              <Link
                key={child.href || index}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === child.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="h-1 w-1 rounded-full bg-current opacity-60" />
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        level > 0 && "ml-4"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  )
}

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform md:translate-x-0 hidden md:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <img src="/digiwave-logo.png" alt="Digiwave" className="h-8 w-auto" />
        <span className="font-semibold text-lg">Digiwave</span>
      </div>
      
      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <div className="space-y-6">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Title */}
              <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </div>
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <NavItem 
                    key={item.href || `${sectionIndex}-${itemIndex}`} 
                    item={item} 
                    pathname={pathname} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}
