package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/config"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/kafka"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/model"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/otlpdecode"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/replay"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/storage"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/validate"
)

type Server struct {
	cfg   config.Config
	kafka *kafka.Client
	store *storage.Store
}

func New(cfg config.Config, k *kafka.Client, s *storage.Store) http.Handler {
	srv := &Server{cfg: cfg, kafka: k, store: s}
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.Recoverer, middleware.RealIP)
	if cfg.BasicAuthEnabled {
		r.Use(srv.basicAuth)
	}

	r.Get("/api/health", srv.health)
	r.Get("/api/clusters", srv.clusters)
	r.Post("/api/clusters/test", srv.clustersTest)
	r.Get("/api/kafka/{cluster}/topics", srv.kafkaTopics)
	r.Get("/api/kafka/{cluster}/topics/{topic}/partitions", srv.kafkaPartitions)
	r.Post("/api/kafka/{cluster}/consume", srv.kafkaConsume)
	r.Post("/api/otlp/analyze", srv.analyze)
	r.Post("/api/otlp/validate", srv.validateOnly)
	r.Post("/api/otlp/replay", srv.replay)
	r.Post("/api/otlp/compare", srv.compare)
	r.Post("/api/files/analyze", srv.fileAnalyze)
	r.Get("/api/sessions", srv.sessions)
	r.Get("/api/sessions/{id}", srv.sessionGet)
	r.Delete("/api/sessions/{id}", srv.sessionDelete)
	r.Get("/api/dashboard", srv.dashboard)
	return r
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) { writeJSON(w, http.StatusOK, map[string]any{"status": "ok"}) }
func (s *Server) clusters(w http.ResponseWriter, r *http.Request) { writeJSON(w, http.StatusOK, s.cfg.Clusters) }
func (s *Server) clustersTest(w http.ResponseWriter, r *http.Request) { writeJSON(w, http.StatusOK, map[string]any{"ok": true}) }
func (s *Server) kafkaTopics(w http.ResponseWriter, r *http.Request) {
	topics, err := s.kafka.ListTopics(r.Context(), chi.URLParam(r, "cluster"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, topics)
}
func (s *Server) kafkaPartitions(w http.ResponseWriter, r *http.Request) { writeJSON(w, http.StatusOK, []int{0, 1, 2}) }

func (s *Server) kafkaConsume(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Topic string `json:"topic"`
		N     int    `json:"n"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	msgs, err := s.kafka.ConsumeLatestN(r.Context(), chi.URLParam(r, "cluster"), req.Topic, req.N)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	var out []model.DecodedMessage
	for _, m := range msgs {
		decoded, err := otlpdecode.Analyze(otlpdecode.AnalyzeRequest{Source: "kafka", Payload: m.Payload})
		if err != nil {
			continue
		}
		decoded.KafkaMetadata = &model.KafkaMetadata{
			Cluster:   chi.URLParam(r, "cluster"),
			Topic:     m.Topic,
			Partition: m.Partition,
			Offset:    m.Offset,
			Timestamp: m.Timestamp,
			Key:       m.Key,
			Headers:   m.Headers,
		}
		decoded.ValidationResults = validate.Run(decoded, s.cfg.MaxPayloadBytes, s.cfg.KafkaMessageWarnBytes)
		out = append(out, decoded)
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) analyze(w http.ResponseWriter, r *http.Request) {
	var req otlpdecode.AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	msg, err := otlpdecode.Analyze(req)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	msg.ValidationResults = validate.Run(msg, s.cfg.MaxPayloadBytes, s.cfg.KafkaMessageWarnBytes)
	for _, vr := range msg.ValidationResults {
		if vr.Severity == model.SeverityError {
			msg.Summary.ErrorsCount++
		}
		if vr.Severity == model.SeverityWarning {
			msg.Summary.WarningsCount++
		}
	}
	_ = s.store.SaveSession(r.Context(), msg)
	writeJSON(w, http.StatusOK, map[string]any{
		"message":  msg,
		"problems": validate.Explain(msg.ValidationResults),
	})
}

func (s *Server) validateOnly(w http.ResponseWriter, r *http.Request) {
	var req struct{ Message model.DecodedMessage `json:"message"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, validate.Run(req.Message, s.cfg.MaxPayloadBytes, s.cfg.KafkaMessageWarnBytes))
}

func (s *Server) replay(w http.ResponseWriter, r *http.Request) {
	var req replay.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	res, err := replay.Execute(r.Context(), s.kafka, req)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (s *Server) compare(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Left  model.DecodedMessage `json:"left"`
		Right model.DecodedMessage `json:"right"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"leftSignal":       req.Left.SignalType,
		"rightSignal":      req.Right.SignalType,
		"leftServices":     req.Left.Summary.ServiceNames,
		"rightServices":    req.Right.Summary.ServiceNames,
		"leftMetricNames":  req.Left.Summary.MetricNames,
		"rightMetricNames": req.Right.Summary.MetricNames,
		"leftErrors":       req.Left.Summary.ErrorsCount,
		"rightErrors":      req.Right.Summary.ErrorsCount,
	})
}

func (s *Server) fileAnalyze(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filename string `json:"filename"`
		Content  string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	if strings.HasSuffix(req.Filename, ".jsonl") {
		lines := strings.Split(req.Content, "\n")
		out := make([]model.DecodedMessage, 0, len(lines))
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			msg, err := otlpdecode.Analyze(otlpdecode.AnalyzeRequest{Source: "upload", Payload: line})
			if err == nil {
				msg.ValidationResults = validate.Run(msg, s.cfg.MaxPayloadBytes, s.cfg.KafkaMessageWarnBytes)
				out = append(out, msg)
			}
		}
		writeJSON(w, http.StatusOK, map[string]any{"messages": out})
		return
	}
	s.analyze(w, withBody(r, req.Content))
}

func withBody(r *http.Request, payload string) *http.Request {
	req := &http.Request{}
	*req = *r
	req.Body = http.NoBody
	return req
}

func (s *Server) sessions(w http.ResponseWriter, r *http.Request) {
	out, err := s.store.ListSessions(r.Context())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) sessionGet(w http.ResponseWriter, r *http.Request) {
	out, err := s.store.GetSession(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if err == sql.ErrNoRows {
			writeErr(w, http.StatusNotFound, err)
			return
		}
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) sessionDelete(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteSession(r.Context(), chi.URLParam(r, "id")); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (s *Server) dashboard(w http.ResponseWriter, r *http.Request) {
	out, err := s.store.Dashboard(context.Background())
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) basicAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok || user != s.cfg.BasicAuthUser || pass != s.cfg.BasicAuthPassword {
			w.Header().Set("WWW-Authenticate", `Basic realm="otlp-viewer"`)
			writeErr(w, http.StatusUnauthorized, http.ErrNoCookie)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeErr(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
