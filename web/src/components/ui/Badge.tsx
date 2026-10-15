import React from "react"

export interface BadgeProps {
  children: React.ReactNode
  variant?: "primary" | "accent" | "success" | "warning" | "danger" | "neutral" | "info"
  size?: "sm" | "md"
  dot?: boolean
  className?: string
}

export function Badge({
  children,
  variant = "primary",
  size = "sm",
  dot = false,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800",
    accent: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    danger: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    neutral: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
    info: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  }

  const dotStyles = {
    primary: "bg-brand-600",
    accent: "bg-amber-600",
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-rose-600",
    neutral: "bg-zinc-500",
    info: "bg-sky-600",
  }

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium leading-none",
    md: "text-xs px-2.5 py-1 font-medium leading-none",
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border tracking-tight select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />}
      {children}
    </span>
  )
}
