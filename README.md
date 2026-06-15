# OTLP Viewer

OTLP Viewer is a self-hosted web app to inspect, validate, decode, search, and replay OpenTelemetry OTLP payloads from Kafka or pasted/uploaded messages.

It combines:
- Kafka UI for topic browsing and message consumption
- OTLP debugger for traces/metrics/logs payload decoding
- Replay tool with dry-run defaults and explicit confirmation

## Why this exists

When OTLP payloads fail in collectors or backends, teams usually inspect raw JSON, base64 blobs, or protobuf bytes manually. OTLP Viewer helps platform and observability engineers quickly answer:
- Is this payload valid OTLP?
- Which signal type and encoding is this message?
- What likely breaks Loki/Mimir/collector ingestion?
- Can I safely replay this payload to Kafka for debugging?

## Features

- Home dashboard with recent sessions and quick actions
- Paste analyzer: OTLP JSON, base64 protobuf, hex protobuf
- Kafka browser: list topics, inspect partitions, consume latest N
- Decoding: traces, metrics, logs via OpenTelemetry collector `pdata`
- Validation engine with severity-based rules and human explanations
- Replay with dry-run default, confirmation guard, target preview
- Compare two decoded messages
- File analyze endpoint (`.json`, `.jsonl`, `.pb`, `.bin`, `.txt`)
- SQLite-backed sessions/history

## Screenshots

- `docs/screenshots/home.png` (placeholder)
- `docs/screenshots/paste-analyzer.png` (placeholder)
- `docs/screenshots/kafka-browser.png` (placeholder)
- `docs/screenshots/message-problems.png` (placeholder)
- `docs/screenshots/replay-confirm.png` (placeholder)

## Quick start

```bash
cp .env.example .env
docker compose -f deploy/docker-compose.yml up -d
```

Open [http://localhost:8080](http://localhost:8080).

## Demo profile

```bash
docker compose -f deploy/docker-compose.yml --profile demo up -d
```

Demo profile adds:
- Redpanda (Kafka-compatible)
- OTel Collector
- Sample generator

## Configuration

Key environment variables:

```env
OTLP_VIEWER_HTTP_ADDR=:8080
OTLP_VIEWER_DB_PATH=/data/otlp-viewer.db
OTLP_VIEWER_BASIC_AUTH_ENABLED=false
OTLP_VIEWER_BASIC_AUTH_USER=admin
OTLP_VIEWER_BASIC_AUTH_PASSWORD=admin
KAFKA_CLUSTERS=local
KAFKA_LOCAL_BOOTSTRAP=redpanda:9092
KAFKA_LOCAL_SECURITY_PROTOCOL=PLAINTEXT
MAX_PAYLOAD_BYTES=16777216
KAFKA_MESSAGE_WARN_BYTES=4194304
```

### SASL_SSL example

```env
KAFKA_CLUSTERS=prod
KAFKA_PROD_BOOTSTRAP=broker1:9093,broker2:9093
KAFKA_PROD_SECURITY_PROTOCOL=SASL_SSL
KAFKA_PROD_SASL_MECHANISM=SCRAM-SHA-512
KAFKA_PROD_USERNAME=otlp_viewer
KAFKA_PROD_PASSWORD=change-me
KAFKA_PROD_TLS_CA_FILE=/certs/ca.pem
KAFKA_PROD_TLS_SKIP_VERIFY=false
```

## API

- `GET /api/health`
- `GET /api/clusters`
- `POST /api/clusters/test`
- `GET /api/kafka/:cluster/topics`
- `GET /api/kafka/:cluster/topics/:topic/partitions`
- `POST /api/kafka/:cluster/consume`
- `POST /api/otlp/analyze`
- `POST /api/otlp/validate`
- `POST /api/otlp/replay`
- `POST /api/otlp/compare`
- `POST /api/files/analyze`
- `GET /api/sessions`
- `GET /api/sessions/:id`
- `DELETE /api/sessions/:id`

## Paste analyzer examples

Use files in `examples/`:
- `examples/logs-valid.json`
- `examples/logs-missing-service-name.json`
- `examples/traces-invalid-span-time.json`
- `examples/metrics-high-cardinality.json`
- `examples/base64-protobuf-log.txt`

## Replay examples

Dry run:

```json
{
  "cluster": "local",
  "topic": "otlp.logs",
  "payload": "{\"resourceLogs\":[]}",
  "sourceEncoding": "json",
  "targetEncoding": "json",
  "count": 1,
  "dryRun": true
}
```

Confirmed replay:

```json
{
  "cluster": "local",
  "topic": "otlp.logs",
  "payload": "{\"resourceLogs\":[]}",
  "sourceEncoding": "json",
  "targetEncoding": "json",
  "count": 5,
  "delayMs": 200,
  "dryRun": false,
  "confirm": true
}
```

## Validation rules (initial set)

- missing service.name
- empty resource attributes
- invalid trace_id / span_id
- span end before start
- log timestamp issues
- metric datapoint timestamp/unit/name checks
- high cardinality candidates (`user.id`, `session.id`, `request.id`, uuid/ip-like values)
- payload too large / Kafka warn threshold
- suspicious timestamp ranges
- Loki/Mimir cardinality and label-risk heuristics

## Development

Backend:

```bash
cd backend
go test ./...
go run ./cmd/otlp-viewer
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm test
```

## Contributing

1. Open an issue describing bug/feature.
2. Create a focused branch.
3. Add tests with your changes.
4. Keep replay safety defaults intact (dry-run by default, explicit confirmation for write mode).
5. Open a PR with API/UI notes and screenshots.

## Roadmap (post-v1)

- Helm chart
- MCP server endpoint
- Grafana datasource plugin
- Tempo trace-link integration
- Loki label-risk simulator
- Mimir cardinality estimator
- WASM validation plugins
- OpenTelemetry Collector config generator
- Export failing samples as GitHub issue markdown

## License

Apache-2.0. See `LICENSE`.
