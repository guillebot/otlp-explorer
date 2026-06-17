import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  impactItems?: string[]
  expectedConfirmation?: string
  danger?: boolean
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  impactItems,
  expectedConfirmation,
  danger,
  confirmLabel = 'Confirm',
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = React.useState(false)
  const [typed, setTyped] = React.useState('')

  const confirmDisabled =
    pending || (expectedConfirmation != null && typed.trim() !== expectedConfirmation)

  function handleOpenChange(next: boolean) {
    if (!next) setTyped('')
    onOpenChange(next)
  }

  async function handleConfirm() {
    setPending(true)
    try {
      await onConfirm()
      handleOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              {danger && <AlertTriangle className="h-4 w-4 text-danger" />}
              {title}
            </span>
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogBody className="space-y-3">
          {impactItems && impactItems.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {impactItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {expectedConfirmation != null && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted">
                Type <span className="font-mono text-fg">{expectedConfirmation}</span> to confirm
              </label>
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={expectedConfirmation}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'default'} onClick={handleConfirm} disabled={confirmDisabled}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
