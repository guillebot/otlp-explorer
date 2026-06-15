export type Severity = 'info' | 'warning' | 'error'
export type SignalType = 'traces' | 'metrics' | 'logs' | 'unknown'
export type Encoding = 'json' | 'base64_protobuf' | 'hex_protobuf' | 'protobuf' | 'unknown'

export interface ValidationResult {
  ruleId: string
  severity: Severity
  title: string
  message: string
  path?: string
  suggestion?: string
}

export interface Summary {
  signalType: SignalType
  resourceCount: number
  scopeCount: number
  itemCount: number
  serviceNames: string[]
  metricNames: string[]
  warningsCount: number
  errorsCount: number
}

export interface DecodedMessage {
  id: string
  source: string
  encoding: Encoding
  signalType: SignalType
  rawSizeBytes: number
  summary: Summary
  validationResults: ValidationResult[]
  rawPayload: string
  canonicalJson: string
}
