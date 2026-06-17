import { CopyButton } from '@/components/ui/Copyable'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { severityTone, type Tone } from '@/lib/health'
import type { DecodedMessage, SignalType, ValidationResult } from '@/types'

const signalTone: Record<SignalType, Tone> = {
  traces: 'info',
  metrics: 'updating',
  logs: 'ok',
  unknown: 'muted',
}

export function SignalBadge({ signal }: { signal: SignalType }) {
  return <Badge tone={signalTone[signal]}>{signal}</Badge>
}

export function CodeBlock({ value, label = 'JSON', className }: { value: string; label?: string; className?: string }) {
  return (
    <div className={cn('relative rounded-md border border-border bg-bg/60', className)}>
      <div className="absolute right-2 top-2 z-10">
        <CopyButton value={value} label={label} />
      </div>
      <pre className="max-h-[28rem] overflow-auto p-3 text-xs leading-relaxed">
        <code className="font-mono text-fg">{value}</code>
      </pre>
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number | string; tone?: Tone }) {
  return (
    <div className="rounded-md border border-border/70 bg-surface/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', tone === 'danger' && 'text-danger', tone === 'warn' && 'text-warn')}>
        {value}
      </p>
    </div>
  )
}

export function SummaryStats({ msg }: { msg: DecodedMessage }) {
  const s = msg.summary
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile label="Items" value={s.itemCount} />
      <StatTile label="Resources" value={s.resourceCount} />
      <StatTile label="Scopes" value={s.scopeCount} />
      <StatTile label="Size" value={formatBytes(msg.rawSizeBytes)} />
      <StatTile label="Warnings" value={s.warningsCount} tone={s.warningsCount > 0 ? 'warn' : undefined} />
      <StatTile label="Errors" value={s.errorsCount} tone={s.errorsCount > 0 ? 'danger' : undefined} />
    </div>
  )
}

export function ValidationList({ results }: { results: ValidationResult[] }) {
  if (results.length === 0) {
    return <EmptyState title="No validation findings" description="This payload passed every rule cleanly." />
  }
  return (
    <ul className="space-y-2">
      {results.map((r) => (
        <li key={`${r.ruleId}-${r.path ?? ''}`} className="rounded-md border border-border/70 bg-surface/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                <span className="text-sm font-medium text-fg">{r.title}</span>
              </div>
              <p className="text-sm text-muted">{r.message}</p>
              {r.suggestion && <p className="text-xs text-muted">Suggestion: {r.suggestion}</p>}
            </div>
            {r.path && <code className="shrink-0 font-mono text-[11px] text-muted">{r.path}</code>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
