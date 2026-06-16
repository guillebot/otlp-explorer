FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25 AS backend-build
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./cmd/otlp-viewer/ui/dist
RUN CGO_ENABLED=0 go build -o /out/otlp-viewer ./cmd/otlp-viewer
RUN mkdir -p /data

FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=backend-build /out/otlp-viewer /app/otlp-viewer
COPY --from=backend-build --chown=65532:65532 /data /data
VOLUME ["/data"]
EXPOSE 8080
ENTRYPOINT ["/app/otlp-viewer"]
