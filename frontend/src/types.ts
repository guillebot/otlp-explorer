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
  docsUrl?: string
}

export interface Summary {
  signalType: SignalType
  resourceCount: number
  scopeCount: number
  itemCount: number
  serviceNames: string[]
  metricNames: string[]
  traceIds?: string[]
  warningsCount: number
  errorsCount: number
}

export interface KafkaMetadata {
  cluster?: string
  topic?: string
  partition?: number
  offset?: number
  timestamp?: number
  key?: string
  headers?: Record<string, string>
}

export interface DecodedMessage {
  id: string
  source: string
  encoding: Encoding
  signalType: SignalType
  rawSizeBytes: number
  kafkaMetadata?: KafkaMetadata
  summary: Summary
  validationResults: ValidationResult[]
  rawPayload: string
  canonicalJson: string
}

export interface AnalyzeResponse {
  message: DecodedMessage
  problems: string[]
}

export interface Cluster {
  name: string
  bootstrapServers: string
  securityProtocol: string
  saslMechanism?: string
}

export interface ReplayRequest {
  cluster: string
  topic: string
  key?: string
  payload: string
  sourceEncoding: Encoding
  targetEncoding: Encoding
  count: number
  delayMs?: number
  dryRun: boolean
  confirm?: boolean
}

export interface ReplayResult {
  dryRun: boolean
  targetTopic: string
  plannedCount: number
  message: string
}

export interface CompareResult {
  leftSignal: SignalType
  rightSignal: SignalType
  leftServices: string[] | null
  rightServices: string[] | null
  leftMetricNames: string[] | null
  rightMetricNames: string[] | null
  leftErrors: number
  rightErrors: number
}
