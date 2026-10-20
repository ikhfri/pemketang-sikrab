package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	AppEnv          string
	AppPort         string
	DatabaseURL     string
	DBMaxConns      int32
	DBMinConns      int32
	SessionCookie   string
	SessionTTLHours int
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		AppPort:       getEnv("APP_PORT", "8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		SessionCookie: getEnv("SESSION_COOKIE_NAME", "session"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL wajib diisi")
	}

	maxConns, err := strconv.ParseInt(getEnv("DB_MAX_CONNS", "10"), 10, 32)
	if err != nil || maxConns < 1 {
		return Config{}, fmt.Errorf("DB_MAX_CONNS harus berupa angka minimal 1")
	}
	minConns, err := strconv.ParseInt(getEnv("DB_MIN_CONNS", "1"), 10, 32)
	if err != nil || minConns < 0 || minConns > maxConns {
		return Config{}, fmt.Errorf("DB_MIN_CONNS harus 0 sampai DB_MAX_CONNS")
	}
	ttlHours, err := strconv.Atoi(getEnv("SESSION_TTL_HOURS", "168"))
	if err != nil || ttlHours < 1 || ttlHours > 720 {
		return Config{}, fmt.Errorf("SESSION_TTL_HOURS harus antara 1 dan 720")
	}

	cfg.DBMaxConns = int32(maxConns)
	cfg.DBMinConns = int32(minConns)
	cfg.SessionTTLHours = ttlHours
	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
