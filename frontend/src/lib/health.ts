import type { Severity } from '@/types'

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'updating' | 'muted'

export const toneChip: Record<Tone, string> = {
  ok: 'bg-ok/10 text-ok border-ok/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-info/10 text-info border-info/30',
  updating: 'bg-updating/10 text-updating border-updating/30',
  muted: 'bg-surface text-muted border-border',
}

export const toneDot: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  updating: 'bg-updating',
  muted: 'bg-muted',
}

export const toneRing: Record<Tone, string> = {
  ok: 'ring-ok/30',
  warn: 'ring-warn/30',
  danger: 'ring-danger/30',
  info: 'ring-info/30',
  updating: 'ring-updating/30',
  muted: 'ring-border',
}

export function severityTone(severity: Severity): Tone {
  switch (severity) {
    case 'error':
      return 'danger'
    case 'warning':
      return 'warn'
    case 'info':
    default:
      return 'info'
  }
}

export type Health = 'healthy' | 'degraded' | 'error' | 'checking' | 'unknown'

export const healthTone: Record<Health, Tone> = {
  healthy: 'ok',
  degraded: 'warn',
  error: 'danger',
  checking: 'updating',
  unknown: 'muted',
}

export const healthLabel: Record<Health, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  error: 'Unreachable',
  checking: 'Checking',
  unknown: 'Unknown',
}
