
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"voting-angkatan/backend/internal/security"

	"github.com/alexedwards/argon2id"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL belum diatur di .env")
	}

	adminNIM := os.Getenv("ADMIN_NIM")
	adminName := os.Getenv("ADMIN_NAME")
	adminPassword := os.Getenv("ADMIN_PASSWORD")

	if adminNIM == "" || adminName == "" || adminPassword == "" {
		log.Fatal("ADMIN_NIM, ADMIN_NAME, dan ADMIN_PASSWORD wajib diatur di .env")
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Gagal membuat koneksi: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Database tidak bisa diakses: %v", err)
	}

	passwordHash, err := argon2id.CreateHash(
		adminPassword,
		security.PasswordParams,
	)
	if err != nil {
		log.Fatalf("Gagal hash password admin: %v", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("Gagal memulai transaksi: %v", err)
	}
	defer tx.Rollback(ctx)

	// Buat admin hanya jika NIM belum terdaftar.
	// Jika sudah ada, data yang ada tidak diubah.
	tag, err := tx.Exec(ctx, `
		INSERT INTO users (
			id,
			nim,
			name,
			kelompok,
			password,
			role,
			has_voted
		)
		VALUES ($1, $2, $3, $4, $5, 'ADMIN', FALSE)
		ON CONFLICT (nim) DO NOTHING
	`,
		"admin-"+adminNIM,
		adminNIM,
		adminName,
		"ADMIN",
		passwordHash,
	)
	if err != nil {
		log.Fatalf("Gagal membuat akun admin: %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("Gagal menyimpan akun admin: %v", err)
	}

	if tag.RowsAffected() == 0 {
		fmt.Println("NIM sudah terdaftar. Tidak ada data yang diubah.")
		return
	}

	fmt.Println("Seed admin berhasil.")
	fmt.Printf("Admin NIM: %s\n", adminNIM)
	fmt.Println("Password disimpan menggunakan Argon2id.")
}
