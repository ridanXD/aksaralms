import React from "react"

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: "primary" | "success" | "warning" | "danger" | "dynamic"
  showLabel?: boolean
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  variant = "dynamic",
  showLabel = false,
  label,
  size = "md",
  className = "",
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)))

  const getDynamicColor = (pct: number) => {
    if (pct >= 75) return "bg-emerald-600"
    if (pct >= 55) return "bg-amber-600"
    return "bg-brand-600"
  }

  const fillClass =
    variant === "dynamic"
      ? getDynamicColor(percentage)
      : variant === "primary"
      ? "bg-brand-600"
      : variant === "success"
      ? "bg-emerald-600"
      : variant === "warning"
      ? "bg-amber-600"
      : "bg-brand-600"

  const heightClass = size === "sm" ? "h-1.5" : size === "md" ? "h-2" : "h-2.5"

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-200 mb-1 font-medium">
          <span>{label || "Progress"}</span>
          <span className="font-semibold text-zinc-800 dark:text-white">{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${heightClass} bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${fillClass} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
