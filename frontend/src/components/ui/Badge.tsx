import * as React from 'react'
import { cn } from '@/lib/cn'
import { toneChip, type Tone } from '@/lib/health'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'muted', ...props }: BadgeProps) {
  return <span className={cn('chip', toneChip[tone], className)} {...props} />
}
