import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export function MessagePage() {
  const { id } = useParams()
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Session" title="Message details" description={id ? `Session ${id}` : undefined} />
      <EmptyState
        title="Select a message"
        description="Open a message from the dashboard or the Kafka browser to inspect it here."
      />
    </div>
  )
}
