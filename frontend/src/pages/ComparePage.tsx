import { useState } from 'react'
import { GitCompareArrows } from 'lucide-react'
import { toast } from 'sonner'
import { analyze, compare } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/Table'
import { SignalBadge } from '@/components'
import type { CompareResult } from '@/types'

export function ComparePage() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [result, setResult] = useState<CompareResult>()
  const [busy, setBusy] = useState(false)

  async function onCompare() {
    if (!left.trim() || !right.trim()) {
      toast.error('Two payloads required', { description: 'Paste a payload into both panels.' })
      return
    }
    setBusy(true)
    try {
      const [l, r] = await Promise.all([analyze(left, 'compare'), analyze(right, 'compare')])
      setResult(await compare(l.message, r.message))
    } catch (e) {
      toast.error('Compare failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Diff"
        title="Compare"
        description="Decode two OTLP payloads and compare their summaries."
        actions={
          <Button onClick={onCompare} disabled={busy}>
            <GitCompareArrows className="h-3.5 w-3.5" />
            {busy ? 'Comparing…' : 'Compare'}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Left</CardTitle>
          </CardHeader>
          <CardBody>
            <Textarea value={left} onChange={(e) => setLeft(e.target.value)} placeholder="Paste payload A" className="min-h-40 font-mono" spellCheck={false} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Right</CardTitle>
          </CardHeader>
          <CardBody>
            <Textarea value={right} onChange={(e) => setRight(e.target.value)} placeholder="Paste payload B" className="min-h-40 font-mono" spellCheck={false} />
          </CardBody>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
          </CardHeader>
          <CardBody>
            <Table>
              <THead>
                <Tr>
                  <Th>Field</Th>
                  <Th>Left</Th>
                  <Th>Right</Th>
                </Tr>
              </THead>
              <TBody>
                <Tr>
                  <Td className="text-muted">Signal</Td>
                  <Td><SignalBadge signal={result.leftSignal} /></Td>
                  <Td><SignalBadge signal={result.rightSignal} /></Td>
                </Tr>
                <Tr>
                  <Td className="text-muted">Services</Td>
                  <Td>{result.leftServices?.join(', ') || '—'}</Td>
                  <Td>{result.rightServices?.join(', ') || '—'}</Td>
                </Tr>
                <Tr>
                  <Td className="text-muted">Metric names</Td>
                  <Td>{result.leftMetricNames?.join(', ') || '—'}</Td>
                  <Td>{result.rightMetricNames?.join(', ') || '—'}</Td>
                </Tr>
                <Tr>
                  <Td className="text-muted">Errors</Td>
                  <Td className="tabular-nums">{result.leftErrors}</Td>
                  <Td className="tabular-nums">{result.rightErrors}</Td>
                </Tr>
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
