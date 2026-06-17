import { useState } from 'react'
import { Play } from 'lucide-react'
import { toast } from 'sonner'
import { analyze } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { CodeBlock, SignalBadge, SummaryStats, ValidationList } from '@/components'
import type { DecodedMessage } from '@/types'

const encodings = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'json', label: 'OTLP JSON' },
  { value: 'base64_protobuf', label: 'Base64 protobuf' },
  { value: 'hex_protobuf', label: 'Hex protobuf' },
  { value: 'protobuf', label: 'Raw protobuf' },
]

export function PastePage() {
  const [payload, setPayload] = useState('')
  const [encoding, setEncoding] = useState('auto')
  const [message, setMessage] = useState<DecodedMessage>()
  const [problems, setProblems] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  async function onAnalyze() {
    if (!payload.trim()) {
      toast.error('Nothing to analyze', { description: 'Paste an OTLP payload first.' })
      return
    }
    setBusy(true)
    try {
      const res = await analyze(payload, 'paste')
      setMessage(res.message)
      setProblems(res.problems)
    } catch (e) {
      toast.error('Could not analyze payload', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Debugger"
        title="Paste analyzer"
        description="Decode and validate a raw OTLP payload."
        actions={
          <>
            <Select value={encoding} onValueChange={setEncoding}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {encodings.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onAnalyze} disabled={busy}>
              <Play className="h-3.5 w-3.5" />
              {busy ? 'Analyzing…' : 'Analyze'}
            </Button>
          </>
        }
      />

      <Card>
        <CardBody>
          <Textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Paste OTLP payload here"
            className="min-h-48 font-mono"
            spellCheck={false}
          />
        </CardBody>
      </Card>

      {message && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Signal:</span>
              <SignalBadge signal={message.signalType} />
              <Badge>{message.encoding}</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <SummaryStats msg={message} />
            <Tabs defaultValue="validation">
              <TabsList>
                <TabsTrigger value="validation">Validation ({message.validationResults.length})</TabsTrigger>
                <TabsTrigger value="problems">Problems ({problems.length})</TabsTrigger>
                <TabsTrigger value="canonical">Canonical JSON</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>
              <TabsContent value="validation">
                <ValidationList results={message.validationResults} />
              </TabsContent>
              <TabsContent value="problems">
                {problems.length === 0 ? (
                  <p className="text-sm text-muted">No problems reported.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                    {problems.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="canonical">
                <CodeBlock value={message.canonicalJson || '{}'} label="canonical JSON" />
              </TabsContent>
              <TabsContent value="raw">
                <CodeBlock value={message.rawPayload || ''} label="raw payload" />
              </TabsContent>
            </Tabs>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
