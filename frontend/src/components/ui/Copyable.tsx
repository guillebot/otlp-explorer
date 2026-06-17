import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'

const MAX_COPY_BYTES = 64 * 1024

async function writeClipboard(value: string): Promise<boolean> {
  if (new Blob([value]).size > MAX_COPY_BYTES) {
    toast.error('Too large to copy', { description: 'Content exceeds the 64 KB copy limit.' })
    return false
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'value', className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  async function onCopy() {
    const ok = await writeClipboard(value)
    if (ok) {
      setCopied(true)
      toast.success(`Copied ${label}`)
      setTimeout(() => setCopied(false), 1200)
    } else {
      toast.error(`Could not copy ${label}`)
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export interface CopyableProps {
  value: string
  label?: string
  children: React.ReactNode
  className?: string
}

export function Copyable({ value, label, children, className }: CopyableProps) {
  return (
    <span className={cn('group/copy inline-flex items-center gap-1.5', className)}>
      {children}
      <span className="opacity-0 transition-opacity group-hover/copy:opacity-100">
        <CopyButton value={value} label={label} />
      </span>
    </span>
  )
}
