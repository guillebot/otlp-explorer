package validate

import (
	"testing"

	"github.com/otlp-viewer/otlp-viewer/internal/model"
)

func TestMissingServiceName(t *testing.T) {
	msg := model.DecodedMessage{
		RawSizeBytes:   12,
		CanonicalJSON:  `{"resourceLogs":[]}`,
		Summary:        model.Summary{ServiceNames: nil},
		ValidationResults: nil,
	}
	results := Run(msg, 1024, 512)
	if len(results) == 0 || results[0].RuleID != "missing_service_name" {
		t.Fatalf("expected missing service.name rule")
	}
}

func TestInvalidSpanID(t *testing.T) {
	msg := model.DecodedMessage{
		RawSizeBytes:  12,
		CanonicalJSON: `{"spanId":"0000000000000000"}`,
		Summary:       model.Summary{ServiceNames: []string{"svc"}},
	}
	results := Run(msg, 1024, 512)
	found := false
	for _, r := range results {
		if r.RuleID == "invalid_span_id_length" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected invalid span id rule")
	}
}

func TestMetricHighCardinality(t *testing.T) {
	msg := model.DecodedMessage{
		RawSizeBytes:  12,
		CanonicalJSON: `{"attributes":{"request.id":"abc"}}`,
		Summary:       model.Summary{ServiceNames: []string{"svc"}},
	}
	results := Run(msg, 1024, 512)
	found := false
	for _, r := range results {
		if r.RuleID == "high_cardinality_candidate" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected high cardinality candidate rule")
	}
}
