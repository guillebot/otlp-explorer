package model

type SignalType string

const (
	SignalTraces SignalType = "traces"
	SignalMetrics SignalType = "metrics"
	SignalLogs    SignalType = "logs"
	SignalUnknown SignalType = "unknown"
)

type Encoding string

const (
	EncodingJSON    Encoding = "json"
	EncodingBase64  Encoding = "base64_protobuf"
	EncodingHex     Encoding = "hex_protobuf"
	EncodingProto   Encoding = "protobuf"
	EncodingUnknown Encoding = "unknown"
)

type Severity string

const (
	SeverityInfo    Severity = "info"
	SeverityWarning Severity = "warning"
	SeverityError   Severity = "error"
)

type KafkaMetadata struct {
	Cluster   string            `json:"cluster,omitempty"`
	Topic     string            `json:"topic,omitempty"`
	Partition int32             `json:"partition,omitempty"`
	Offset    int64             `json:"offset,omitempty"`
	Timestamp int64             `json:"timestamp,omitempty"`
	Key       string            `json:"key,omitempty"`
	Headers   map[string]string `json:"headers,omitempty"`
}

type ValidationResult struct {
	RuleID     string   `json:"ruleId"`
	Severity   Severity `json:"severity"`
	Title      string   `json:"title"`
	Message    string   `json:"message"`
	Path       string   `json:"path,omitempty"`
	Suggestion string   `json:"suggestion,omitempty"`
	DocsURL    string   `json:"docsUrl,omitempty"`
}

type Summary struct {
	SignalType    SignalType        `json:"signalType"`
	ResourceCount int               `json:"resourceCount"`
	ScopeCount    int               `json:"scopeCount"`
	ItemCount     int               `json:"itemCount"`
	ServiceNames  []string          `json:"serviceNames"`
	MetricNames   []string          `json:"metricNames"`
	Severities    map[Severity]int  `json:"severities"`
	TraceIDs      []string          `json:"traceIds"`
	WarningsCount int               `json:"warningsCount"`
	ErrorsCount   int               `json:"errorsCount"`
}

type DecodedMessage struct {
	ID                string             `json:"id"`
	Source            string             `json:"source"`
	Encoding          Encoding           `json:"encoding"`
	SignalType        SignalType         `json:"signalType"`
	RawSizeBytes      int                `json:"rawSizeBytes"`
	KafkaMetadata     *KafkaMetadata     `json:"kafkaMetadata,omitempty"`
	Summary           Summary            `json:"summary"`
	Resources         any                `json:"resources,omitempty"`
	ValidationResults []ValidationResult `json:"validationResults"`
	RawPayload        string             `json:"rawPayload"`
	CanonicalJSON     string             `json:"canonicalJson"`
}
