import * as React from 'react'
import { cn } from '@/lib/cn'

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="space-y-1">
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
