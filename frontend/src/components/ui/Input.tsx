import * as React from 'react'
import { cn } from '@/lib/cn'

const base =
  'w-full rounded-md border border-border bg-surface/60 text-fg placeholder:text-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring/60 disabled:cursor-not-allowed disabled:opacity-50'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, 'h-9 px-3 text-sm', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, 'min-h-20 px-3 py-2 text-sm', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'
