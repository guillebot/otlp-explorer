import type {
  AnalyzeResponse,
  Cluster,
  CompareResult,
  DecodedMessage,
  ReplayRequest,
  ReplayResult,
} from './types'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed ${res.status}`)
  }
  return (await res.json()) as T
}

export function getHealth() {
  return api<{ status: string }>('/api/health')
}

export function getClusters() {
  return api<Cluster[]>('/api/clusters')
}

export function getTopics(cluster: string) {
  return api<string[]>(`/api/kafka/${encodeURIComponent(cluster)}/topics`)
}

export function consume(cluster: string, topic: string, n: number) {
  return api<DecodedMessage[]>(`/api/kafka/${encodeURIComponent(cluster)}/consume`, {
    method: 'POST',
    body: JSON.stringify({ topic, n }),
  })
}

export function analyze(payload: string, source = 'paste') {
  return api<AnalyzeResponse>('/api/otlp/analyze', {
    method: 'POST',
    body: JSON.stringify({ source, payload }),
  })
}

export function replay(req: ReplayRequest) {
  return api<ReplayResult>('/api/otlp/replay', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function compare(left: DecodedMessage, right: DecodedMessage) {
  return api<CompareResult>('/api/otlp/compare', {
    method: 'POST',
    body: JSON.stringify({ left, right }),
  })
}
