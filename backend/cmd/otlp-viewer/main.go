package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/otlp-viewer/otlp-viewer/backend/internal/api"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/config"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/kafka"
	"github.com/otlp-viewer/otlp-viewer/backend/internal/storage"
)

//go:embed ui/dist/*
var embeddedDist embed.FS

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
	sub, err := fs.Sub(embeddedDist, "ui/dist")
	if err != nil {
		log.Printf("warn: embedded frontend unavailable: %v", err)
	}
	fileServer := http.FileServer(http.FS(sub))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") {
			apiHandler.ServeHTTP(w, r)
			return
		}
		clean := path.Clean(strings.TrimPrefix(r.URL.Path, "/"))
		if clean == "." || clean == "/" {
			http.ServeFileFS(w, r, sub, "index.html")
			return
		}
		if _, err := fs.Stat(sub, clean); err != nil {
			http.ServeFileFS(w, r, sub, "index.html")
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}
