import type { DecodedMessage } from './types'

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

export async function analyze(payload: string, source = 'paste') {
  return api<{ message: DecodedMessage; problems: string[] }>('/api/otlp/analyze', {
    method: 'POST',
    body: JSON.stringify({ source, payload }),
  })
}
