import React from "react"

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  trendLabel?: string
  accent?: "primary" | "emerald" | "amber" | "rose"
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  accent,
  className = "",
}: StatCardProps) {
  const accentLeftBorder =
    accent === "primary"
      ? "border-l-2 border-l-brand-600"
      : accent === "emerald"
      ? "border-l-2 border-l-emerald-600"
      : accent === "amber"
      ? "border-l-2 border-l-amber-600"
      : accent === "rose"
      ? "border-l-2 border-l-rose-600"
      : ""

  return (
    <div className={`p-4 sm:p-5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-container shadow-down-hover ${accentLeftBorder} ${className}`}>
      <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-200 uppercase tracking-wider">{title}</div>
      <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1 tracking-tight font-heading">{value}</div>
      {(subtitle || trendLabel) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          {trend === "up" && <span className="text-emerald-700 dark:text-emerald-300 font-bold">↑</span>}
          {trend === "down" && <span className="text-rose-700 dark:text-rose-300 font-bold">↓</span>}
          {trend === "neutral" && <span className="text-zinc-500 dark:text-zinc-300 font-bold">→</span>}
          <span className="text-zinc-600 dark:text-zinc-100 font-medium">{trendLabel || subtitle}</span>
        </div>
      )}
    </div>
  )
}
