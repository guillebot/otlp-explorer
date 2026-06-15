package kafka

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/otlp-viewer/otlp-viewer/internal/config"
	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
)

type Client struct {
	clusters map[string]config.KafkaCluster
}

func New(clusters []config.KafkaCluster) (*Client, error) {
	out := &Client{clusters: map[string]config.KafkaCluster{}}
	for _, c := range clusters {
		out.clusters[c.Name] = c
	}
	return out, nil
}

func (c *Client) Close() {}

func (c *Client) ListTopics(ctx context.Context, cluster string) ([]string, error) {
	cl, err := c.newClient(cluster)
	if err != nil {
		return nil, err
	}
	defer cl.Close()
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
	cl, err := c.newClient(cluster, topic)
	if err != nil {
		return nil, err
	}
	defer cl.Close()
	if n <= 0 {
		n = 10
	}

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
	cl, err := c.newClient(cluster)
	if err != nil {
		return err
	}
	defer cl.Close()
	recHeaders := make([]kgo.RecordHeader, 0, len(headers))
	for k, v := range headers {
		recHeaders = append(recHeaders, kgo.RecordHeader{Key: k, Value: []byte(v)})
	}
	rec := &kgo.Record{Topic: topic, Key: []byte(key), Value: payload, Headers: recHeaders}
	return cl.ProduceSync(ctx, rec).FirstErr()
}

func (c *Client) newClient(cluster string, consumeTopics ...string) (*kgo.Client, error) {
	conf, ok := c.clusters[cluster]
	if !ok {
		return nil, fmt.Errorf("unknown cluster %q", cluster)
	}
	opts := []kgo.Opt{kgo.SeedBrokers(strings.Split(conf.Bootstrap, ",")...)}
	if len(consumeTopics) > 0 {
		opts = append(opts, kgo.ConsumeTopics(consumeTopics...))
	}
	return kgo.NewClient(opts...)
}
