import React from "react"
import Link from "next/link"

export interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs ${className}`}>
      {icon && <div className="mb-2 flex justify-center text-zinc-400 dark:text-zinc-300 text-lg">{icon}</div>}
      <h3 className="text-sm font-bold text-zinc-800 dark:text-white font-heading">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-200 max-w-sm mx-auto mt-1 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-4">
          <Link href={actionHref} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
            {actionLabel}
          </Link>
        </div>
      )}
      {actionLabel && onAction && !actionHref && (
        <div className="mt-4">
          <button onClick={onAction} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
