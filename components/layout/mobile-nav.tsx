"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import {
  Menu,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import { navigationSections } from "@/components/layout/navigation"

// Mobile navigation item component
function MobileNavItem({ item, pathname, onClose, level = 0 }: { item: any, pathname: string, onClose: () => void, level?: number }) {
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
                onClick={onClose}
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
      onClick={onClose}
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

export function MobileNav({ sections }: { sections?: any[] } = {}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sectionsToUse = sections || navigationSections

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        {/* Hidden accessibility components */}
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Main navigation menu for the application</SheetDescription>
        </VisuallyHidden>
        
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">ERMS</span>
        </div>
        
        {/* Navigation */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <div className="space-y-6">
            {sectionsToUse.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Title */}
                <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
                
                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <MobileNavItem 
                      key={item.href || `${sectionIndex}-${itemIndex}`} 
                      item={item} 
                      pathname={pathname}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
