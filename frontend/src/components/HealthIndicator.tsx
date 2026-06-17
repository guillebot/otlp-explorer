import { useEffect, useState } from 'react'
import { getHealth } from '@/api'
import { StatusPill } from '@/components/ui/StatusPill'
import type { Health } from '@/lib/health'

export function HealthIndicator() {
  const [health, setHealth] = useState<Health>('checking')

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const res = await getHealth()
        if (active) setHealth(res.status === 'ok' ? 'healthy' : 'degraded')
      } catch {
        if (active) setHealth('error')
      }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return <StatusPill health={health} label="API" pulse={health === 'healthy'} />
}
