import * as React from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 p-10 text-center',
        className,
      )}
      {...props}
    >
      <Icon className="h-6 w-6 text-muted" />
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
