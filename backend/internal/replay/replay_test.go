package replay

import (
	"context"
	"testing"

	"github.com/otlp-viewer/otlp-viewer/internal/kafka"
)

func TestReplayDryRun(t *testing.T) {
	client := &kafka.Client{}
	res, err := Execute(context.Background(), client, Request{
		Cluster: "local",
		Topic:   "otel-logs",
		Payload: "{}",
		DryRun:  true,
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !res.DryRun || res.PlannedCount != 1 {
		t.Fatalf("unexpected dry-run result: %+v", res)
	}
}
