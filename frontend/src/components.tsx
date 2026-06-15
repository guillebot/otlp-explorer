import type { DecodedMessage, ValidationResult } from './types'

export function PayloadInput(props: { value: string; onChange: (v: string) => void }) {
  return <textarea rows={16} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder="Paste OTLP payload here" />
}

export function EncodingSelector(props: { value: string; onChange: (v: string) => void }) {
  return <select value={props.value} onChange={(e) => props.onChange(e.target.value)}><option value="auto">Auto</option><option value="json">JSON</option><option value="base64_protobuf">Base64 protobuf</option><option value="hex_protobuf">Hex protobuf</option><option value="protobuf">Raw protobuf</option></select>
}

export function SignalSelector(props: { value: string; onChange: (v: string) => void }) {
  return <select value={props.value} onChange={(e) => props.onChange(e.target.value)}><option value="auto">Auto</option><option value="traces">Traces</option><option value="metrics">Metrics</option><option value="logs">Logs</option></select>
}

export function ValidationPanel({ results }: { results: ValidationResult[] }) {
  return <div>{results.map((r) => <div key={`${r.ruleId}-${r.path}`}><strong>{r.severity}</strong> {r.title}: {r.message}</div>)}</div>
}

export function SummaryCards({ msg }: { msg: DecodedMessage }) {
  return <div className="grid"><div>Signal: {msg.signalType}</div><div>Items: {msg.summary.itemCount}</div><div>Resources: {msg.summary.resourceCount}</div><div>Warnings: {msg.summary.warningsCount}</div><div>Errors: {msg.summary.errorsCount}</div></div>
}

export function AttributeTable({ entries }: { entries: Array<[string, string]> }) {
  return <table><tbody>{entries.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
}

export function RawJsonViewer({ value }: { value: string }) { return <pre>{value}</pre> }
export function ParsedTree({ value }: { value: unknown }) { return <pre>{JSON.stringify(value, null, 2)}</pre> }
export function KafkaTopicBrowser({ topics }: { topics: string[] }) { return <ul>{topics.map((t) => <li key={t}>{t}</li>)}</ul> }
export function ReplayDialog({ onReplay }: { onReplay: () => void }) { return <button onClick={onReplay}>Replay (confirm required)</button> }
export function CompareView({ left, right }: { left?: DecodedMessage; right?: DecodedMessage }) { return <pre>{JSON.stringify({ left: left?.summary, right: right?.summary }, null, 2)}</pre> }
