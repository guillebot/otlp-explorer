package kafka

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/otlp-viewer/otlp-viewer/backend/internal/config"
	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
)

type Client struct {
	clients map[string]*kgo.Client
}

func New(clusters []config.KafkaCluster) (*Client, error) {
	out := &Client{clients: map[string]*kgo.Client{}}
	for _, c := range clusters {
		opts := []kgo.Opt{kgo.SeedBrokers(strings.Split(c.Bootstrap, ",")...)}
		cl, err := kgo.NewClient(opts...)
		if err != nil {
			return nil, fmt.Errorf("cluster %s: %w", c.Name, err)
		}
		out.clients[c.Name] = cl
	}
	return out, nil
}

func (c *Client) Close() {
	for _, cl := range c.clients {
		cl.Close()
	}
}

func (c *Client) ListTopics(ctx context.Context, cluster string) ([]string, error) {
	cl, ok := c.clients[cluster]
	if !ok {
		return nil, fmt.Errorf("unknown cluster %q", cluster)
	}
	admin := kadm.NewClient(cl)
	meta, err := admin.ListTopics(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(meta))
	for name := range meta {
		out = append(out, name)
	}
	return out, nil
}

type ConsumedMessage struct {
	Topic     string            `json:"topic"`
	Partition int32             `json:"partition"`
	Offset    int64             `json:"offset"`
	Timestamp int64             `json:"timestamp"`
	Key       string            `json:"key"`
	Headers   map[string]string `json:"headers"`
	Payload   string            `json:"payload"`
	Size      int               `json:"size"`
}

func (c *Client) ConsumeLatestN(ctx context.Context, cluster, topic string, n int) ([]ConsumedMessage, error) {
	cl, ok := c.clients[cluster]
	if !ok {
		return nil, fmt.Errorf("unknown cluster %q", cluster)
	}
	if n <= 0 {
		n = 10
	}
	cl.AssignGroup("")
	cl.AddConsumeTopics(topic)
	defer cl.PurgeTopicsFromClient(topic)

	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	fetches := cl.PollFetches(timeoutCtx)
	if errs := fetches.Errors(); len(errs) > 0 {
		return nil, errs[0].Err
	}

	out := make([]ConsumedMessage, 0, n)
	fetches.EachRecord(func(rec *kgo.Record) {
		if len(out) >= n {
			return
		}
		h := map[string]string{}
		for _, v := range rec.Headers {
			h[v.Key] = string(v.Value)
		}
		out = append(out, ConsumedMessage{
			Topic:     rec.Topic,
			Partition: rec.Partition,
			Offset:    rec.Offset,
			Timestamp: rec.Timestamp.UnixNano(),
			Key:       string(rec.Key),
			Headers:   h,
			Payload:   string(rec.Value),
			Size:      len(rec.Value),
		})
	})
	return out, nil
}

func (c *Client) Produce(ctx context.Context, cluster, topic, key string, headers map[string]string, payload []byte) error {
	cl, ok := c.clients[cluster]
	if !ok {
		return fmt.Errorf("unknown cluster %q", cluster)
	}
	recHeaders := make([]kgo.RecordHeader, 0, len(headers))
	for k, v := range headers {
		recHeaders = append(recHeaders, kgo.RecordHeader{Key: k, Value: []byte(v)})
	}
	rec := &kgo.Record{Topic: topic, Key: []byte(key), Value: payload, Headers: recHeaders}
	return cl.ProduceSync(ctx, rec).FirstErr()
}
