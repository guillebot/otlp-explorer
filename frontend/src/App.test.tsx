import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi, beforeEach } from 'vitest'
import { TooltipProvider } from '@/components/ui/Tooltip'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
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
})

test('paste payload and show the decoded result', async () => {
  renderAt('/paste')
  fireEvent.change(screen.getByPlaceholderText('Paste OTLP payload here'), {
    target: { value: '{"resourceLogs":[]}' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Analyze/i }))
  await waitFor(() => screen.getByText(/Signal:/))
})

test('home dashboard renders quick actions', () => {
  renderAt('/')
  expect(screen.getAllByText('Paste analyzer').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Kafka browser').length).toBeGreaterThan(0)
})
