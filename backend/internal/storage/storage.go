package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/otlp-viewer/otlp-viewer/internal/model"
	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

func New(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) migrate() error {
	schema := `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  signal_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  errors_count INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`
	_, err := s.db.Exec(schema)
	return err
}

func (s *Store) SaveSession(ctx context.Context, msg model.DecodedMessage) error {
	b, _ := json.Marshal(msg)
	_, err := s.db.ExecContext(ctx, "INSERT OR REPLACE INTO sessions(id, signal_type, payload_json) VALUES(?,?,?)", msg.ID, string(msg.SignalType), string(b))
	if err != nil {
		return err
	}
	_, _ = s.db.ExecContext(ctx, "INSERT INTO history(message_id, signal_type, errors_count) VALUES(?,?,?)", msg.ID, string(msg.SignalType), msg.Summary.ErrorsCount)
	return nil
}

func (s *Store) ListSessions(ctx context.Context) ([]model.DecodedMessage, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT payload_json FROM sessions ORDER BY created_at DESC LIMIT 200")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.DecodedMessage
	for rows.Next() {
		var payload string
		if err := rows.Scan(&payload); err != nil {
			return nil, err
		}
		var m model.DecodedMessage
		if err := json.Unmarshal([]byte(payload), &m); err == nil {
			out = append(out, m)
		}
	}
	return out, rows.Err()
}

func (s *Store) GetSession(ctx context.Context, id string) (model.DecodedMessage, error) {
	var payload string
	err := s.db.QueryRowContext(ctx, "SELECT payload_json FROM sessions WHERE id = ?", id).Scan(&payload)
	if err != nil {
		return model.DecodedMessage{}, err
	}
	var m model.DecodedMessage
	if err := json.Unmarshal([]byte(payload), &m); err != nil {
		return model.DecodedMessage{}, err
	}
	return m, nil
}

func (s *Store) DeleteSession(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM sessions WHERE id = ?", id)
	return err
}

func (s *Store) Dashboard(ctx context.Context) (map[string]any, error) {
	sessions, err := s.ListSessions(ctx)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"configuredKafkaClusters": nil,
		"recentInspectedMessages": sessions,
		"recentValidationErrors":  len(sessions),
		"generatedAt":             time.Now().UTC().Format(time.RFC3339),
	}, nil
}

func (s *Store) Ping(ctx context.Context) error {
	if err := s.db.PingContext(ctx); err != nil {
		return fmt.Errorf("sqlite ping: %w", err)
	}
	return nil
}
