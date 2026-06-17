import { Link } from 'react-router-dom'
import { Activity, ClipboardPaste, GitCompareArrows, Repeat, Settings } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const actions = [
  { to: '/paste', icon: ClipboardPaste, title: 'Paste analyzer', desc: 'Decode & validate OTLP JSON, base64, or hex protobuf.' },
  { to: '/kafka', icon: Activity, title: 'Kafka browser', desc: 'List topics and consume the latest messages.' },
  { to: '/replay', icon: Repeat, title: 'Replay', desc: 'Re-emit a payload to Kafka with dry-run safety.' },
  { to: '/compare', icon: GitCompareArrows, title: 'Compare', desc: 'Diff two decoded messages side by side.' },
  { to: '/settings', icon: Settings, title: 'Settings', desc: 'Review configured Kafka clusters and limits.' },
]

export function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="OTLP Viewer"
        description="Inspect, validate, decode, search, and replay OpenTelemetry OTLP payloads."
        actions={<Badge tone="info">self-hosted</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full transition-colors group-hover:border-accent/40">
              <CardBody className="space-y-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-fg">{title}</p>
                <p className="text-xs text-muted">{desc}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
