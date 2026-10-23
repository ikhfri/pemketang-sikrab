package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"voting-angkatan/backend/internal/config"
	"voting-angkatan/backend/internal/middleware"
)

type loginRequest struct {
	NIM      string `json:"nim" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type publicUser struct {
	ID       string `json:"id"`
	NIM      string `json:"nim"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	HasVoted bool   `json:"hasVoted"`
}


func login(pool *pgxpool.Pool, cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input loginRequest
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NIM dan password wajib diisi."})
			return
		}

		input.NIM = strings.TrimSpace(input.NIM)
		if input.NIM == "" || input.Password == "" || len(input.NIM) > 100 || len(input.Password) > 1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NIM dan password wajib diisi."})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var user publicUser
		var passwordHash string
		err := pool.QueryRow(ctx, `
			SELECT id, nim, name, role::text, has_voted, password
			FROM users
			WHERE nim = $1
			LIMIT 1
		`, input.NIM).Scan(
			&user.ID,
			&user.NIM,
			&user.Name,
			&user.Role,
			&user.HasVoted,
			&passwordHash,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "NIM atau password salah."})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan server."})
			return
		}

		validCredentials := false
		switch strings.ToUpper(user.Role) {
		case "VOTER":
			// Login pemilih: password harus sama persis dengan NIM akun.
			validCredentials = input.Password == user.NIM
		case "ADMIN":
			// Login admin tetap menggunakan hash Argon2id yang sudah tersimpan.
			ok, compareErr := argon2id.ComparePasswordAndHash(input.Password, passwordHash)
			validCredentials = compareErr == nil && ok
		default:
			// Role yang tidak dikenal tidak boleh login.
			validCredentials = false
		}

		if !validCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "NIM atau password salah."})
			return
		}

		now := time.Now()
		expiresAt := now.Add(time.Duration(cfg.SessionTTLHours) * time.Hour)
		sessionID := uuid.NewString()

		_, err = pool.Exec(ctx, `
			INSERT INTO sessions (id, user_id, expires_at, created_at)
			VALUES ($1, $2, $3, $4)
		`, sessionID, user.ID, expiresAt, now)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi login."})
			return
		}

		setSessionCookie(c, cfg, sessionID, expiresAt)

		redirectTo := "/vote"
		if strings.EqualFold(user.Role, "ADMIN") {
			redirectTo = "/admin"
		}
		c.JSON(http.StatusOK, gin.H{
			"user":       user,
			"redirectTo": redirectTo,
		})
	}
}

func me(pool *pgxpool.Pool, cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie(cfg.SessionCookie)
		if err != nil || sessionID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Belum login."})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var user middleware.User
		var expiresAt time.Time
		err = pool.QueryRow(ctx, `
			SELECT u.id, u.nim, u.name, u.role::text, u.has_voted, s.expires_at
			FROM sessions s
			JOIN users u ON u.id = s.user_id
			WHERE s.id = $1
			LIMIT 1
		`, sessionID).Scan(
			&user.ID,
			&user.NIM,
			&user.Name,
			&user.Role,
			&user.HasVoted,
			&expiresAt,
		)
		if err != nil || !expiresAt.After(time.Now()) {
			clearSessionCookie(c, cfg)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi tidak valid atau sudah kedaluwarsa."})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

func logout(pool *pgxpool.Pool, cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie(cfg.SessionCookie)
		if err == nil && sessionID != "" {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
			defer cancel()
			_, _ = pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, sessionID)
		}

		clearSessionCookie(c, cfg)
		c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil."})
	}
}

func setSessionCookie(c *gin.Context, cfg config.Config, sessionID string, expiresAt time.Time) {
	maxAge := int(time.Until(expiresAt).Seconds())
	if maxAge < 0 {
		maxAge = 0
	}

	c.SetCookie(
		cfg.SessionCookie,
		sessionID,
		maxAge,
		"/",
		"",
		strings.EqualFold(cfg.AppEnv, "production"),
		true,
	)
}

func clearSessionCookie(c *gin.Context, cfg config.Config) {
	c.SetCookie(
		cfg.SessionCookie,
		"",
		-1,
		"/",
		"",
		strings.EqualFold(cfg.AppEnv, "production"),
		true,
	)
}
