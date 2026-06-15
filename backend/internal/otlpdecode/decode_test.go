package otlpdecode

import (
	"encoding/base64"
	"testing"

	"github.com/otlp-viewer/otlp-viewer/internal/model"
)

const logsJSON = `{"resourceLogs":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"checkout"}}]},"scopeLogs":[{"logRecords":[{"timeUnixNano":"1700000000000000000","body":{"stringValue":"ok"}}]}]}]}`
const tracesJSON = `{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"api"}}]},"scopeSpans":[{"spans":[{"traceId":"11111111111111111111111111111111","spanId":"1111111111111111","name":"op","startTimeUnixNano":"1700000000000000000","endTimeUnixNano":"1700000001000000000"}]}]}]}`
const metricsJSON = `{"resourceMetrics":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"api"}}]},"scopeMetrics":[{"metrics":[{"name":"http.server.duration","unit":"ms","gauge":{"dataPoints":[{"timeUnixNano":"1700000000000000000","asDouble":1.23}]}}]}]}]}`

func TestDecodeLogsJSON(t *testing.T) {
	msg, err := Analyze(AnalyzeRequest{Source: "test", Payload: logsJSON})
	if err != nil || msg.SignalType != model.SignalLogs {
		t.Fatalf("expected logs decode success, got %v %v", msg.SignalType, err)
	}
}

func TestDecodeTracesJSON(t *testing.T) {
	msg, err := Analyze(AnalyzeRequest{Source: "test", Payload: tracesJSON})
	if err != nil || msg.SignalType != model.SignalTraces {
		t.Fatalf("expected traces decode success, got %v %v", msg.SignalType, err)
	}
}

func TestDecodeMetricsJSON(t *testing.T) {
	msg, err := Analyze(AnalyzeRequest{Source: "test", Payload: metricsJSON})
	if err != nil || msg.SignalType != model.SignalMetrics {
		t.Fatalf("expected metrics decode success, got %v %v", msg.SignalType, err)
	}
}

func TestDecodeBase64ProtobufFailureHandled(t *testing.T) {
	b := base64.StdEncoding.EncodeToString([]byte("not-otlp-binary"))
	_, err := Analyze(AnalyzeRequest{Source: "test", Payload: b})
	if err == nil {
		t.Fatalf("expected decode error for invalid proto payload")
	}
}
