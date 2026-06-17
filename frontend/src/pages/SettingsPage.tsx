import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getClusters } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Cluster } from '@/types'

export function SettingsPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClusters()
      .then(setClusters)
      .catch((e) => toast.error('Could not load clusters', { description: String(e) }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Kafka clusters are configured via environment variables on the backend."
      />

      <Card>
        <CardHeader>
          <CardTitle>Configured clusters</CardTitle>
          <Badge tone="muted">{clusters.length}</Badge>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : clusters.length === 0 ? (
            <EmptyState title="No clusters configured" description="Set KAFKA_CLUSTERS and the per-cluster bootstrap env vars." />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Bootstrap servers</Th>
                  <Th>Security</Th>
                </Tr>
              </THead>
              <TBody>
                {clusters.map((c) => (
                  <Tr key={c.name}>
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="font-mono text-xs text-muted">{c.bootstrapServers}</Td>
                    <Td>
                      <Badge tone={c.securityProtocol === 'PLAINTEXT' ? 'warn' : 'ok'}>{c.securityProtocol}</Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
