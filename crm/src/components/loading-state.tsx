"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type LoadingStateProps = {
  message?: string
  className?: string
  variant?: "spinner" | "skeleton" | "overlay"
  rows?: number
}

export function LoadingState({ message, className, variant = "spinner", rows = 3 }: LoadingStateProps) {
  if (variant === "overlay") {
    return (
      <div className={cn("fixed inset-0 z-50 bg-black/50 flex items-center justify-center", className)}>
        <div className="bg-[#1a1c30] rounded-2xl p-8 border border-[#1e2030] shadow-xl flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          {message && <p className="text-sm text-slate-400">{message}</p>}
        </div>
      </div>
    )
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)} role="status" aria-label="Carregando">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-700/30 rounded w-1/2" />
          </div>
        ))}
        <span className="sr-only">{message || "Carregando..."}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-16", className)} role="status" aria-label="Carregando">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
      {message && <p className="text-sm text-slate-400">{message}</p>}
      <span className="sr-only">{message || "Carregando..."}</span>
    </div>
  )
}
