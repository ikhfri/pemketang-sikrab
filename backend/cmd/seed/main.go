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

	// Wajib menggunakan koneksi testing khusus.
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("TEST_DATABASE_URL belum diatur di .env")
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

	// Password khusus akun pengujian.
	adminHash, err := argon2id.CreateHash(
		"TestAdmin123!",
		security.PasswordParams,
	)
	if err != nil {
		log.Fatalf("Gagal hash password admin: %v", err)
	}

	voterHash, err := argon2id.CreateHash(
		"TestVoter123!",
		security.PasswordParams,
	)
	if err != nil {
		log.Fatalf("Gagal hash password voter: %v", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("Gagal memulai transaksi: %v", err)
	}
	defer tx.Rollback(ctx)

	// Akun pengujian. Tidak mengubah akun yang sudah ada.
	_, err = tx.Exec(ctx, `
		INSERT INTO users
			(id, nim, name, kelompok, password, role, has_voted)
		VALUES
			($1, $2, $3, $4, $5, $6, $7),
			($8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT DO NOTHING
	`,
		"test-user-admin", "TESTADMIN001",
		"Admin Testing", "ADMIN", adminHash, "ADMIN", false,
		"test-user-voter", "TESTVOTER001",
		"Voter Testing", "TEST", voterHash, "VOTER", false,
	)
	if err != nil {
		log.Fatalf("Gagal seed users: %v", err)
	}

	// Kandidat dummy tanpa membuat suara.
	_, err = tx.Exec(ctx, `
		INSERT INTO candidates
			(id, ketua_name, ketua_photo_url,
			 wakil_name, wakil_photo_url, vision, mission)
		VALUES
			($1, $2, NULL, $3, NULL, $4, $5),
			($6, $7, NULL, $8, NULL, $9, $10)
		ON CONFLICT DO NOTHING
	`,
		"TEST-CANDIDATE-01",
		"Kandidat Testing Satu",
		"Pasangan Testing Satu",
		"Visi pengujian satu",
		"Misi pengujian satu",
		"TEST-CANDIDATE-02",
		"Kandidat Testing Dua",
		"Pasangan Testing Dua",
		"Visi pengujian dua",
		"Misi pengujian dua",
	)
	if err != nil {
		log.Fatalf("Gagal seed candidates: %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("Gagal menyimpan seed: %v", err)
	}

	fmt.Println("Seed testing selesai.")
	fmt.Println("Admin NIM : TESTADMIN001")
	fmt.Println("Voter NIM : TESTVOTER001")
	fmt.Println("Password disimpan dalam bentuk hash.")
	fmt.Println("Tidak ada suara dummy yang dibuat.")
}
