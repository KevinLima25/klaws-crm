"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="mb-4 text-slate-600">
        {icon || <Inbox className="h-12 w-12 mx-auto" />}
      </div>
      <h3 className="text-base font-semibold text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
