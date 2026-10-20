
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"voting-angkatan/backend/internal/config"
	"voting-angkatan/backend/internal/handlers"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan; memakai environment variable dari sistem")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Konfigurasi tidak valid: %v", err)
	}

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("DATABASE_URL tidak valid: %v", err)
	}

	poolConfig.MaxConns = cfg.DBMaxConns
	poolConfig.MinConns = cfg.DBMinConns

	startupCtx, cancelStartup := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancelStartup()

	pool, err := pgxpool.NewWithConfig(startupCtx, poolConfig)
	if err != nil {
		log.Fatalf("Gagal membuat connection pool PostgreSQL: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(startupCtx); err != nil {
		log.Fatalf("Tidak bisa terhubung ke PostgreSQL: %v", err)
	}
	log.Println("Koneksi PostgreSQL berhasil")

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// CORS: harus dipasang sebelum routes didaftarkan.
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		},
		AllowMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Daftarkan seluruh endpoint aplikasi.
	handlers.RegisterRoutes(router, pool, cfg)

	// Tampilkan routes untuk membantu memastikan endpoint login tersedia.
	for _, route := range router.Routes() {
		log.Printf("Route terdaftar: %-7s %s", route.Method, route.Path)
	}

	server := &http.Server{
		Addr:              ":" + cfg.AppPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErrors := make(chan error, 1)

	go func() {
		log.Printf("Go API berjalan di http://localhost:%s", cfg.AppPort)
		serverErrors <- server.ListenAndServe()
	}()

	signalCtx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server gagal: %v", err)
		}

	case <-signalCtx.Done():
		log.Println("Sinyal shutdown diterima; menghentikan server...")

		shutdownCtx, cancel := context.WithTimeout(
			context.Background(),
			10*time.Second,
		)
		defer cancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("Graceful shutdown gagal: %v", err)
			_ = server.Close()
		}
	}
}
