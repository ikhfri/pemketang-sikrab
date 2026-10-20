package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"voting-angkatan/backend/internal/config"
)

type User struct {
	ID       string `json:"id"`
	NIM      string `json:"nim"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	HasVoted bool   `json:"hasVoted"`
}

const userContextKey = "authenticatedUser"

func RequireSession(pool *pgxpool.Pool, cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie(cfg.SessionCookie)
		if err != nil || sessionID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Silakan login terlebih dahulu."})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var user User
		var expiresAt time.Time
		err = pool.QueryRow(ctx, `
			SELECT u.id, u.nim, u.name, u.role::text, u.has_voted, s.expires_at
			FROM sessions s
			JOIN users u ON u.id = s.user_id
			WHERE s.id = $1
			LIMIT 1
		`, sessionID).Scan(&user.ID, &user.NIM, &user.Name, &user.Role, &user.HasVoted, &expiresAt)

		if err != nil || !expiresAt.After(time.Now()) {
			if err == nil {
				_, _ = pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, sessionID)
			}
			c.SetSameSite(http.SameSiteLaxMode)
			c.SetCookie(cfg.SessionCookie, "", -1, "/", "", cfg.AppEnv == "production", true)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sesi tidak valid atau sudah kedaluwarsa."})
			return
		}

		c.Set(userContextKey, user)
		c.Next()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get(userContextKey)
		user, ok := value.(User)
		if !exists || !ok || user.Role != "ADMIN" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Akses admin diperlukan."})
			return
		}
		c.Next()
	}
}

func CurrentUser(c *gin.Context) (User, bool) {
	value, exists := c.Get(userContextKey)
	user, ok := value.(User)
	return user, exists && ok
}
