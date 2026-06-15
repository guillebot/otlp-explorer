package otlpdecode

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/otlp-viewer/otlp-viewer/internal/model"
	"go.opentelemetry.io/collector/pdata/plog"
	"go.opentelemetry.io/collector/pdata/pmetric"
	"go.opentelemetry.io/collector/pdata/ptrace"
)

type AnalyzeRequest struct {
	Source       string           `json:"source"`
	Payload      string           `json:"payload"`
	EncodingHint model.Encoding   `json:"encodingHint"`
	SignalHint   model.SignalType `json:"signalHint"`
}

func Analyze(req AnalyzeRequest) (model.DecodedMessage, error) {
	raw := []byte(req.Payload)
	enc, body := detectEncoding(req.Payload, req.EncodingHint)
	signal, canonical, summary, resources, err := decodeBody(body, enc, req.SignalHint)
	if err != nil {
		return model.DecodedMessage{}, err
	}

	return model.DecodedMessage{
		ID:            uuid.NewString(),
		Source:        req.Source,
		Encoding:      enc,
		SignalType:    signal,
		RawSizeBytes:  len(raw),
		Summary:       summary,
		Resources:     resources,
		RawPayload:    req.Payload,
		CanonicalJSON: canonical,
	}, nil
}

func detectEncoding(payload string, hint model.Encoding) (model.Encoding, []byte) {
	if hint != "" && hint != model.EncodingUnknown {
		switch hint {
		case model.EncodingJSON:
			return hint, []byte(payload)
		case model.EncodingBase64:
			if b, err := base64.StdEncoding.DecodeString(strings.TrimSpace(payload)); err == nil {
				return hint, b
			}
		case model.EncodingHex:
			if b, err := hex.DecodeString(strings.TrimSpace(payload)); err == nil {
				return hint, b
			}
		}
	}
	trim := strings.TrimSpace(payload)
	if strings.HasPrefix(trim, "{") || strings.HasPrefix(trim, "[") {
		return model.EncodingJSON, []byte(trim)
	}
	if b, err := base64.StdEncoding.DecodeString(trim); err == nil {
		return model.EncodingBase64, b
	}
	if b, err := hex.DecodeString(trim); err == nil {
		return model.EncodingHex, b
	}
	return model.EncodingProto, []byte(payload)
}

func decodeBody(body []byte, enc model.Encoding, signalHint model.SignalType) (model.SignalType, string, model.Summary, any, error) {
	if enc == model.EncodingJSON {
		return decodeJSON(body, signalHint)
	}
	return decodeProto(body, signalHint)
}

func decodeJSON(body []byte, signalHint model.SignalType) (model.SignalType, string, model.Summary, any, error) {
	var hintKeys map[string]any
	_ = json.Unmarshal(body, &hintKeys)
	if signalHint == model.SignalUnknown || signalHint == "" {
		switch {
		case hintKeys["resourceSpans"] != nil:
			signalHint = model.SignalTraces
		case hintKeys["resourceMetrics"] != nil:
			signalHint = model.SignalMetrics
		case hintKeys["resourceLogs"] != nil:
			signalHint = model.SignalLogs
		}
	}

	order := []model.SignalType{signalHint, model.SignalTraces, model.SignalMetrics, model.SignalLogs}
	for _, s := range dedupeSignals(order) {
		switch s {
		case model.SignalTraces:
			u := &ptrace.JSONUnmarshaler{}
			m := &ptrace.JSONMarshaler{}
			if td, err := u.UnmarshalTraces(body); err == nil {
				b, _ := m.MarshalTraces(td)
				return model.SignalTraces, string(b), summarizeTraces(td), map[string]any{"resourceSpans": td.ResourceSpans().Len()}, nil
			}
		case model.SignalMetrics:
			u := &pmetric.JSONUnmarshaler{}
			m := &pmetric.JSONMarshaler{}
			if md, err := u.UnmarshalMetrics(body); err == nil {
				b, _ := m.MarshalMetrics(md)
				return model.SignalMetrics, string(b), summarizeMetrics(md), map[string]any{"resourceMetrics": md.ResourceMetrics().Len()}, nil
			}
		case model.SignalLogs:
			u := &plog.JSONUnmarshaler{}
			m := &plog.JSONMarshaler{}
			if ld, err := u.UnmarshalLogs(body); err == nil {
				b, _ := m.MarshalLogs(ld)
				return model.SignalLogs, string(b), summarizeLogs(ld), map[string]any{"resourceLogs": ld.ResourceLogs().Len()}, nil
			}
		}
	}
	return model.SignalUnknown, "", model.Summary{}, nil, fmt.Errorf("unable to decode JSON payload as OTLP traces, metrics, or logs")
}

func decodeProto(body []byte, signalHint model.SignalType) (model.SignalType, string, model.Summary, any, error) {
	order := []model.SignalType{signalHint, model.SignalTraces, model.SignalMetrics, model.SignalLogs}
	for _, s := range dedupeSignals(order) {
		switch s {
		case model.SignalTraces:
			u := &ptrace.ProtoUnmarshaler{}
			m := &ptrace.JSONMarshaler{}
			if td, err := u.UnmarshalTraces(body); err == nil && td.ResourceSpans().Len() > 0 {
				b, _ := m.MarshalTraces(td)
				return model.SignalTraces, string(b), summarizeTraces(td), map[string]any{"resourceSpans": td.ResourceSpans().Len()}, nil
			}
		case model.SignalMetrics:
			u := &pmetric.ProtoUnmarshaler{}
			m := &pmetric.JSONMarshaler{}
			if md, err := u.UnmarshalMetrics(body); err == nil && md.ResourceMetrics().Len() > 0 {
				b, _ := m.MarshalMetrics(md)
				return model.SignalMetrics, string(b), summarizeMetrics(md), map[string]any{"resourceMetrics": md.ResourceMetrics().Len()}, nil
			}
		case model.SignalLogs:
			u := &plog.ProtoUnmarshaler{}
			m := &plog.JSONMarshaler{}
			if ld, err := u.UnmarshalLogs(body); err == nil && ld.ResourceLogs().Len() > 0 {
				b, _ := m.MarshalLogs(ld)
				return model.SignalLogs, string(b), summarizeLogs(ld), map[string]any{"resourceLogs": ld.ResourceLogs().Len()}, nil
			}
		}
	}
	return model.SignalUnknown, "", model.Summary{}, nil, fmt.Errorf("unable to decode protobuf payload as OTLP traces, metrics, or logs")
}

func summarizeTraces(td ptrace.Traces) model.Summary {
	serviceNames := map[string]struct{}{}
	traceIDs := map[string]struct{}{}
	scopeCount, spanCount := 0, 0
	rs := td.ResourceSpans()
	for i := 0; i < rs.Len(); i++ {
		r := rs.At(i)
		if s, ok := r.Resource().Attributes().Get("service.name"); ok {
			serviceNames[s.Str()] = struct{}{}
		}
		ss := r.ScopeSpans()
		scopeCount += ss.Len()
		for j := 0; j < ss.Len(); j++ {
			spans := ss.At(j).Spans()
			spanCount += spans.Len()
			for k := 0; k < spans.Len(); k++ {
				traceIDs[spans.At(k).TraceID().String()] = struct{}{}
			}
		}
	}
	return model.Summary{
		SignalType:    model.SignalTraces,
		ResourceCount: rs.Len(),
		ScopeCount:    scopeCount,
		ItemCount:     spanCount,
		ServiceNames:  mapKeys(serviceNames),
		TraceIDs:      mapKeys(traceIDs),
		Severities:    map[model.Severity]int{},
	}
}

func summarizeLogs(ld plog.Logs) model.Summary {
	serviceNames := map[string]struct{}{}
	scopeCount, logCount := 0, 0
	rl := ld.ResourceLogs()
	for i := 0; i < rl.Len(); i++ {
		r := rl.At(i)
		if s, ok := r.Resource().Attributes().Get("service.name"); ok {
			serviceNames[s.Str()] = struct{}{}
		}
		sl := r.ScopeLogs()
		scopeCount += sl.Len()
		for j := 0; j < sl.Len(); j++ {
			logCount += sl.At(j).LogRecords().Len()
		}
	}
	return model.Summary{
		SignalType:    model.SignalLogs,
		ResourceCount: rl.Len(),
		ScopeCount:    scopeCount,
		ItemCount:     logCount,
		ServiceNames:  mapKeys(serviceNames),
		Severities:    map[model.Severity]int{},
	}
}

func summarizeMetrics(md pmetric.Metrics) model.Summary {
	serviceNames := map[string]struct{}{}
	metricNames := map[string]struct{}{}
	scopeCount, metricCount := 0, 0
	rm := md.ResourceMetrics()
	for i := 0; i < rm.Len(); i++ {
		r := rm.At(i)
		if s, ok := r.Resource().Attributes().Get("service.name"); ok {
			serviceNames[s.Str()] = struct{}{}
		}
		sm := r.ScopeMetrics()
		scopeCount += sm.Len()
		for j := 0; j < sm.Len(); j++ {
			ms := sm.At(j).Metrics()
			metricCount += ms.Len()
			for k := 0; k < ms.Len(); k++ {
				metricNames[ms.At(k).Name()] = struct{}{}
			}
		}
	}
	return model.Summary{
		SignalType:    model.SignalMetrics,
		ResourceCount: rm.Len(),
		ScopeCount:    scopeCount,
		ItemCount:     metricCount,
		ServiceNames:  mapKeys(serviceNames),
		MetricNames:   mapKeys(metricNames),
		Severities:    map[model.Severity]int{},
	}
}

func dedupeSignals(in []model.SignalType) []model.SignalType {
	seen := map[model.SignalType]struct{}{}
	out := make([]model.SignalType, 0, len(in))
	for _, v := range in {
		if v == "" || v == model.SignalUnknown {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}

func mapKeys(m map[string]struct{}) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Slice(out, func(i, j int) bool { return bytes.Compare([]byte(out[i]), []byte(out[j])) < 0 })
	return out
}
