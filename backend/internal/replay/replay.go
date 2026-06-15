package replay

import (
	"context"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"github.com/otlp-viewer/otlp-viewer/internal/kafka"
	"github.com/otlp-viewer/otlp-viewer/internal/model"
)

type Request struct {
	Cluster        string            `json:"cluster"`
	Topic          string            `json:"topic"`
	Key            string            `json:"key"`
	Headers        map[string]string `json:"headers"`
	Payload        string            `json:"payload"`
	SourceEncoding model.Encoding    `json:"sourceEncoding"`
	TargetEncoding model.Encoding    `json:"targetEncoding"`
	Count          int               `json:"count"`
	DelayMS        int               `json:"delayMs"`
	DryRun         bool              `json:"dryRun"`
	Confirm        bool              `json:"confirm"`
}

type Result struct {
	DryRun       bool   `json:"dryRun"`
	TargetTopic  string `json:"targetTopic"`
	PlannedCount int    `json:"plannedCount"`
	Message      string `json:"message"`
}

func Execute(ctx context.Context, producer *kafka.Client, req Request) (Result, error) {
	if req.Count <= 0 {
		req.Count = 1
	}
	if req.DryRun {
		return Result{DryRun: true, TargetTopic: req.Topic, PlannedCount: req.Count, Message: "Dry run only. No messages produced."}, nil
	}
	if !req.Confirm {
		return Result{}, errors.New("replay confirmation required: set confirm=true")
	}

	data, err := decodeByEncoding(req.Payload, req.SourceEncoding)
	if err != nil {
		return Result{}, err
	}
	outPayload, err := encodeByEncoding(data, req.TargetEncoding)
	if err != nil {
		return Result{}, err
	}
	for i := 0; i < req.Count; i++ {
		if err := producer.Produce(ctx, req.Cluster, req.Topic, req.Key, req.Headers, outPayload); err != nil {
			return Result{}, err
		}
		if req.DelayMS > 0 {
			time.Sleep(time.Duration(req.DelayMS) * time.Millisecond)
		}
	}
	return Result{DryRun: false, TargetTopic: req.Topic, PlannedCount: req.Count, Message: "Replay completed"}, nil
}

func decodeByEncoding(payload string, enc model.Encoding) ([]byte, error) {
	switch enc {
	case model.EncodingBase64:
		return base64.StdEncoding.DecodeString(payload)
	case model.EncodingHex:
		return hex.DecodeString(payload)
	default:
		return []byte(payload), nil
	}
}

func encodeByEncoding(payload []byte, enc model.Encoding) ([]byte, error) {
	switch enc {
	case model.EncodingBase64:
		return []byte(base64.StdEncoding.EncodeToString(payload)), nil
	case model.EncodingHex:
		return []byte(hex.EncodeToString(payload)), nil
	default:
		return payload, nil
	}
}
