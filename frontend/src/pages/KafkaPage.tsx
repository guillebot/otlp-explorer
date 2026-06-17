import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { consume, getClusters, getTopics } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SignalBadge } from '@/components'
import type { Cluster, DecodedMessage } from '@/types'

export function KafkaPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [cluster, setCluster] = useState<string>('')
  const [topics, setTopics] = useState<string[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [messages, setMessages] = useState<DecodedMessage[]>([])
  const [activeTopic, setActiveTopic] = useState<string>('')

  useEffect(() => {
    getClusters()
      .then((cs) => {
        setClusters(cs)
        if (cs[0]) setCluster(cs[0].name)
      })
      .catch((e) => toast.error('Could not load clusters', { description: String(e) }))
  }, [])

  async function loadTopics() {
    if (!cluster) return
    setLoadingTopics(true)
    setTopics([])
    try {
      setTopics(await getTopics(cluster))
    } catch (e) {
      toast.error('Could not list topics', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setLoadingTopics(false)
    }
  }

  async function consumeTopic(topic: string) {
    setActiveTopic(topic)
    setMessages([])
    try {
      setMessages(await consume(cluster, topic, 10))
    } catch (e) {
      toast.error('Could not consume topic', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kafka"
        title="Kafka browser"
        description="List topics and consume the latest messages from a configured cluster."
        actions={
          <>
            <Select value={cluster} onValueChange={setCluster}>
              <SelectTrigger className="w-44">
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
            <Button onClick={loadTopics} disabled={!cluster || loadingTopics}>
              <RefreshCw className="h-3.5 w-3.5" />
              Load topics
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardBody>
          {loadingTopics ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <EmptyState
              title="No topics loaded"
              description="Pick a cluster and load topics. The demo Kafka stack ships under the compose 'demo' profile."
            />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Topic</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {topics.map((t) => (
                  <Tr key={t}>
                    <Td className="font-mono text-xs">{t}</Td>
                    <Td className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => consumeTopic(t)}>
                        <Download className="h-3 w-3" />
                        Consume 10
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {activeTopic && (
        <Card>
          <CardHeader>
            <CardTitle>
              Messages from <span className="font-mono">{activeTopic}</span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {messages.length === 0 ? (
              <EmptyState title="No messages" description="The topic returned no decodable messages." />
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Offset</Th>
                    <Th>Signal</Th>
                    <Th>Items</Th>
                    <Th>Services</Th>
                  </Tr>
                </THead>
                <TBody>
                  {messages.map((m) => (
                    <Tr key={m.id}>
                      <Td className="font-mono text-xs">{m.kafkaMetadata?.offset ?? '—'}</Td>
                      <Td>
                        <SignalBadge signal={m.signalType} />
                      </Td>
                      <Td className="tabular-nums">{m.summary.itemCount}</Td>
                      <Td className="text-muted">{m.summary.serviceNames?.join(', ') || '—'}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
