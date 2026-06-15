package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type KafkaCluster struct {
	Name            string `json:"name"`
	Bootstrap       string `json:"bootstrapServers"`
	SecurityProto   string `json:"securityProtocol"`
	SASLMechanism   string `json:"saslMechanism,omitempty"`
	Username        string `json:"username,omitempty"`
	Password        string `json:"password,omitempty"`
	TLSCAFile       string `json:"tlsCaFile,omitempty"`
	TLSCertFile     string `json:"tlsCertFile,omitempty"`
	TLSKeyFile      string `json:"tlsKeyFile,omitempty"`
	TLSSkipVerify   bool   `json:"tlsSkipVerify,omitempty"`
}

type Config struct {
	HTTPAddr              string
	DBPath                string
	BasicAuthEnabled      bool
	BasicAuthUser         string
	BasicAuthPassword     string
	MaxPayloadBytes       int
	KafkaMessageWarnBytes int
	Clusters              []KafkaCluster
}

func Load() Config {
	cfg := Config{
		HTTPAddr:              getenv("OTLP_VIEWER_HTTP_ADDR", ":8080"),
		DBPath:                getenv("OTLP_VIEWER_DB_PATH", "/data/otlp-viewer.db"),
		BasicAuthEnabled:      getenvBool("OTLP_VIEWER_BASIC_AUTH_ENABLED", false),
		BasicAuthUser:         getenv("OTLP_VIEWER_BASIC_AUTH_USER", "admin"),
		BasicAuthPassword:     getenv("OTLP_VIEWER_BASIC_AUTH_PASSWORD", "admin"),
		MaxPayloadBytes:       getenvInt("MAX_PAYLOAD_BYTES", 16*1024*1024),
		KafkaMessageWarnBytes: getenvInt("KAFKA_MESSAGE_WARN_BYTES", 4*1024*1024),
	}

	clusterNames := strings.Split(getenv("KAFKA_CLUSTERS", "local"), ",")
	for _, raw := range clusterNames {
		name := strings.TrimSpace(raw)
		if name == "" {
			continue
		}
		prefix := "KAFKA_" + strings.ToUpper(strings.ReplaceAll(name, "-", "_")) + "_"
		cfg.Clusters = append(cfg.Clusters, KafkaCluster{
			Name:          name,
			Bootstrap:     getenv(prefix+"BOOTSTRAP", "localhost:9092"),
			SecurityProto: getenv(prefix+"SECURITY_PROTOCOL", "PLAINTEXT"),
			SASLMechanism: getenv(prefix+"SASL_MECHANISM", ""),
			Username:      getenv(prefix+"USERNAME", ""),
			Password:      getenv(prefix+"PASSWORD", ""),
			TLSCAFile:     getenv(prefix+"TLS_CA_FILE", ""),
			TLSCertFile:   getenv(prefix+"TLS_CERT_FILE", ""),
			TLSKeyFile:    getenv(prefix+"TLS_KEY_FILE", ""),
			TLSSkipVerify: getenvBool(prefix+"TLS_SKIP_VERIFY", false),
		})
	}

	return cfg
}

func ClusterMap(clusters []KafkaCluster) map[string]KafkaCluster {
	out := make(map[string]KafkaCluster, len(clusters))
	for _, c := range clusters {
		out[c.Name] = c
	}
	return out
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getenvBool(k string, def bool) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(k)))
	if v == "" {
		return def
	}
	return v == "1" || v == "true" || v == "yes"
}

func getenvInt(k string, def int) int {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		fmt.Printf("invalid int for %s: %q; using default %d\n", k, v, def)
		return def
	}
	return n
}
