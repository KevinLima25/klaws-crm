"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type StatCardProps = {
  label: string
  value: string | number
  icon?: ReactNode
  description?: string
  trend?: { value: string; positive: boolean }
  color?: "emerald" | "sky" | "indigo" | "amber" | "orange" | "red" | "purple" | "rose" | "gray" | "slate"
  className?: string
}

const colorMap: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  red: "text-red-400 bg-red-500/10 border-red-500/20",
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  gray: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  slate: "text-slate-400 bg-slate-500/10 border-slate-500/20",
}

export function StatCard({ label, value, icon, description, trend, color = "slate", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border p-4 bg-[#1a1c30]" , className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && (
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn("text-2xl font-bold", color === "slate" ? "text-white" : colorMap[color].split(" ")[0])}>
        {value}
      </p>
      {description && (
        <p className="text-[11px] text-slate-500 mt-1">{description}</p>
      )}
      {trend && (
        <p className={cn("text-xs mt-1 flex items-center gap-1", trend.positive ? "text-emerald-400" : "text-rose-400")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  )
}
