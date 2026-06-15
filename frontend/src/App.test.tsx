import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import App from './App'

function renderApp() {
  return render(<BrowserRouter><App /></BrowserRouter>)
}

test('paste payload and show validation result area', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      message: {
        id: '1', source: 'paste', encoding: 'json', signalType: 'logs', rawSizeBytes: 10,
        summary: { signalType: 'logs', resourceCount: 1, scopeCount: 1, itemCount: 1, serviceNames: ['svc'], metricNames: [], warningsCount: 1, errorsCount: 0 },
        validationResults: [{ ruleId: 'missing_service_name', severity: 'warning', title: 'Missing', message: 'msg' }],
        rawPayload: '{}', canonicalJson: '{}',
      },
      problems: ['problem'],
    }),
  }) as unknown as typeof fetch

  renderApp()
  fireEvent.click(screen.getByText('Paste'))
  fireEvent.change(screen.getByPlaceholderText('Paste OTLP payload here'), { target: { value: '{"resourceLogs":[]}' } })
  fireEvent.click(screen.getByText('Analyze'))
  await waitFor(() => screen.getByText(/Signal:/))
})

test('topic browser renders mock data', () => {
  renderApp()
  fireEvent.click(screen.getByText('Kafka'))
  expect(screen.getByText('otel-logs')).toBeTruthy()
})
