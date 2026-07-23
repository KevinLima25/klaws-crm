"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { CrmSidebar } from "@/components/crm-sidebar"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function CrmLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#131520]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <CrmSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50">
            <CrmSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#131520] min-h-screen">
        {isMobile && (
          <div className="sticky top-0 z-30 flex items-center gap-3 bg-[#131520]/90 backdrop-blur-sm border-b border-[#1e2030] px-4 h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="h-8 w-8 text-slate-400"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-bold text-white text-sm">Klaws CRM</span>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
