import { useEffect, useState, type ReactNode } from 'react'
import { FlaskConical, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getClusters, replay } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Cluster, Encoding, ReplayResult } from '@/types'

const encodingOptions: Array<{ value: Encoding; label: string }> = [
  { value: 'json', label: 'JSON' },
  { value: 'base64_protobuf', label: 'Base64 protobuf' },
  { value: 'hex_protobuf', label: 'Hex protobuf' },
  { value: 'protobuf', label: 'Raw protobuf' },
]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

export function ReplayPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [cluster, setCluster] = useState('')
  const [topic, setTopic] = useState('otlp.logs')
  const [sourceEncoding, setSourceEncoding] = useState<Encoding>('json')
  const [targetEncoding, setTargetEncoding] = useState<Encoding>('json')
  const [count, setCount] = useState(1)
  const [delayMs, setDelayMs] = useState(0)
  const [payload, setPayload] = useState('{"resourceLogs":[]}')
  const [result, setResult] = useState<ReplayResult>()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    getClusters()
      .then((cs) => {
        setClusters(cs)
        if (cs[0]) setCluster(cs[0].name)
      })
      .catch((e) => toast.error('Could not load clusters', { description: String(e) }))
  }, [])

  function baseRequest(dryRun: boolean, confirm: boolean) {
    return { cluster, topic, payload, sourceEncoding, targetEncoding, count, delayMs, dryRun, confirm }
  }

  async function onDryRun() {
    try {
      setResult(await replay(baseRequest(true, false)))
    } catch (e) {
      toast.error('Dry run failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  async function onConfirmedReplay() {
    const res = await replay(baseRequest(false, true))
    setResult(res)
    toast.success('Replay completed', { description: `${res.plannedCount} message(s) to ${res.targetTopic}` })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producer"
        title="Replay"
        description="Re-emit a payload to a Kafka topic. Dry-run is the default; writing requires explicit confirmation."
        actions={
          <>
            <Button variant="secondary" onClick={onDryRun} disabled={!cluster}>
              <FlaskConical className="h-3.5 w-3.5" />
              Dry run
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={!cluster}>
              <Send className="h-3.5 w-3.5" />
              Replay for real
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Replay request</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Cluster">
              <Select value={cluster} onValueChange={setCluster}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Topic">
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Count">
              <Input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </Field>
            <Field label="Source encoding">
              <Select value={sourceEncoding} onValueChange={(v) => setSourceEncoding(v as Encoding)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {encodingOptions.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target encoding">
              <Select value={targetEncoding} onValueChange={(v) => setTargetEncoding(v as Encoding)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {encodingOptions.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Delay (ms)">
              <Input type="number" min={0} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Payload">
            <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="min-h-32 font-mono" spellCheck={false} />
          </Field>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <Badge tone={result.dryRun ? 'info' : 'ok'}>{result.dryRun ? 'dry run' : 'produced'}</Badge>
          </CardHeader>
          <CardBody className="space-y-1 text-sm">
            <p className="text-muted">{result.message}</p>
            <p>
              Target topic: <span className="font-mono text-fg">{result.targetTopic}</span> · planned{' '}
              <span className="tabular-nums">{result.plannedCount}</span>
            </p>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replay to Kafka"
        description="This produces real messages to the target topic. This cannot be undone."
        impactItems={[
          `${count} message(s) produced to "${topic}" on cluster "${cluster}".`,
          'Downstream consumers and collectors will receive the payload.',
        ]}
        expectedConfirmation={topic}
        danger
        confirmLabel="Replay now"
        onConfirm={onConfirmedReplay}
      />
    </div>
  )
}
