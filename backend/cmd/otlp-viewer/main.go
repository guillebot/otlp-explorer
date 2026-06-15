package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/otlp-viewer/otlp-viewer/backend/internal/api"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/config"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/kafka"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/storage"
)

//go:embed ui/dist/*
var uiFS embedFS

type embedFS interface {
	Open(name string) (fs.File, error)
}

func main() {
	cfg := config.Load()
	if err := os.MkdirAll("/data", 0o755); err != nil && cfg.DBPath == "/data/otlp-viewer.db" {
		log.Printf("warn: unable to create /data: %v", err)
	}

	store, err := storage.New(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()

	kclient, err := kafka.New(cfg.Clusters)
	if err != nil {
		log.Fatal(err)
	}
	defer kclient.Close()

	apiHandler := api.New(cfg, kclient, store)
	mux := http.NewServeMux()
	mux.Handle("/api/", apiHandler)
	mux.Handle("/api", apiHandler)
	mux.Handle("/", spaHandler(apiHandler))

	log.Printf("OTLP Viewer listening on %s", cfg.HTTPAddr)
	log.Fatal(http.ListenAndServe(cfg.HTTPAddr, mux))
}

func spaHandler(apiHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "frontend/dist/index.html")
			return
		}
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			apiHandler.ServeHTTP(w, r)
			return
		}
		http.FileServer(http.Dir("frontend/dist")).ServeHTTP(w, r)
	})
}
