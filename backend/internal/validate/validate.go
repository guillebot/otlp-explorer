package validate

import (
	"regexp"
	"strings"
	"time"

	"github.com/otlp-viewer/otlp-viewer/backend/internal/model"
)

var (
	uuidLike = regexp.MustCompile(`(?i)^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$`)
	ipLike   = regexp.MustCompile(`^\d{1,3}(\.\d{1,3}){3}$`)
)

func Run(msg model.DecodedMessage, maxPayload, kafkaWarn int) []model.ValidationResult {
	var out []model.ValidationResult
	if len(msg.Summary.ServiceNames) == 0 {
		out = append(out, vr("missing_service_name", model.SeverityWarning, "Missing service.name", "Resource attribute service.name was not found", "$.resource.attributes.service.name", "Set service.name in your SDK/resource detector"))
	}
	if msg.RawSizeBytes > maxPayload {
		out = append(out, vr("payload_too_large", model.SeverityError, "Payload too large", "Payload exceeds configured MAX_PAYLOAD_BYTES", "$", "Split or compress payload before ingest"))
	}
	if msg.RawSizeBytes > kafkaWarn {
		out = append(out, vr("kafka_message_warn_bytes", model.SeverityWarning, "Large Kafka message", "Message exceeds warning threshold and may hit broker/client limits", "$", "Reduce batch size or compression ratio"))
	}
	if strings.Contains(msg.CanonicalJSON, "\"name\":\"\"") {
		out = append(out, vr("metric_name_empty", model.SeverityError, "Metric name empty", "Detected metric with empty name", "$.resourceMetrics[*].scopeMetrics[*].metrics[*].name", "Provide a non-empty metric name"))
	}
	if strings.Contains(msg.CanonicalJSON, " ") && strings.Contains(msg.CanonicalJSON, "\"name\"") {
		out = append(out, vr("metric_name_contains_spaces", model.SeverityWarning, "Metric name may contain spaces", "Metric names with spaces are discouraged", "$.resourceMetrics[*].scopeMetrics[*].metrics[*].name", "Use dot/underscore separated names"))
	}
	if strings.Contains(msg.CanonicalJSON, "\"traceId\":\"") && strings.Contains(msg.CanonicalJSON, "\"traceId\":\"0000000000000000\"") {
		out = append(out, vr("invalid_trace_id_length", model.SeverityError, "Invalid trace_id", "Trace ID looks invalid or zeroed", "$.resourceSpans[*].scopeSpans[*].spans[*].traceId", "Emit valid 16-byte trace IDs"))
	}
	if strings.Contains(msg.CanonicalJSON, "\"spanId\":\"0000000000000000\"") {
		out = append(out, vr("invalid_span_id_length", model.SeverityError, "Invalid span_id", "Span ID looks invalid or zeroed", "$.resourceSpans[*].scopeSpans[*].spans[*].spanId", "Emit valid 8-byte span IDs"))
	}
	if strings.Contains(msg.CanonicalJSON, "\"request.id\"") || strings.Contains(msg.CanonicalJSON, "\"session.id\"") || strings.Contains(msg.CanonicalJSON, "\"user.id\"") {
		out = append(out, vr("high_cardinality_candidate", model.SeverityWarning, "High-cardinality attribute candidate", "Potentially unique identifiers found in attributes/labels", "$", "Avoid high-cardinality labels on metrics"))
	}
	if uuidLike.MatchString(msg.RawPayload) || ipLike.MatchString(msg.RawPayload) {
		out = append(out, vr("high_cardinality_value_pattern", model.SeverityInfo, "Potential high-cardinality values", "UUID/IP-like values may explode label cardinality", "$", "Keep high-cardinality values in logs/traces, not metric labels"))
	}
	if strings.Contains(msg.CanonicalJSON, "\"timeUnixNano\":\"0\"") {
		out = append(out, vr("missing_timestamp", model.SeverityWarning, "Missing timestamp", "Found records/datapoints with missing timestamps", "$", "Set explicit event and observed timestamps"))
	}
	if strings.Contains(msg.CanonicalJSON, "0001-01-01") || strings.Contains(msg.CanonicalJSON, "1970-01-01") {
		out = append(out, vr("suspicious_timestamp", model.SeverityWarning, "Suspicious timestamp", "Detected timestamp that appears too old", "$", "Ensure nanoseconds are in Unix epoch ns"))
	}
	if time.Now().Year() >= 2000 && strings.Contains(msg.CanonicalJSON, "Loki") {
		out = append(out, vr("loki_label_risk", model.SeverityInfo, "Loki label risk", "Large or many resource labels may be rejected by Loki pipelines", "$.resource.attributes", "Restrict labels and keep high-cardinality fields in body"))
	}
	return out
}

func Explain(results []model.ValidationResult) []string {
	out := make([]string, 0, len(results))
	for _, r := range results {
		switch r.RuleID {
		case "payload_too_large":
			out = append(out, "This message is likely rejected by collectors or backends due to payload size.")
		case "high_cardinality_candidate", "high_cardinality_value_pattern":
			out = append(out, "This message likely causes high cardinality issues due to unique-like attributes.")
		default:
			out = append(out, r.Title+": "+r.Message)
		}
	}
	return out
}

func vr(id string, severity model.Severity, title, msg, path, suggestion string) model.ValidationResult {
	return model.ValidationResult{
		RuleID:     id,
		Severity:   severity,
		Title:      title,
		Message:    msg,
		Path:       path,
		Suggestion: suggestion,
	}
}
