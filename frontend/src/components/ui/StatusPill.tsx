import { cn } from '@/lib/cn'
import { healthLabel, healthTone, toneChip, toneDot, toneRing, type Health } from '@/lib/health'

export interface StatusPillProps {
  health: Health
  label?: string
  pulse?: boolean
  compact?: boolean
  className?: string
}

export function StatusPill({ health, label, pulse, compact, className }: StatusPillProps) {
  const tone = healthTone[health]
  return (
    <span className={cn('chip', toneChip[tone], pulse && cn('ring-2 animate-pulse-ring', toneRing[tone]), className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', toneDot[tone])} />
      {!compact && <span>{label ?? healthLabel[health]}</span>}
    </span>
  )
}
