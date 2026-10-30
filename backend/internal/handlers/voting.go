
package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"voting-angkatan/backend/internal/config"
	"voting-angkatan/backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// =========================================
// CANDIDATE RESPONSE
// =========================================

type candidateResponse struct {
	ID        string  `json:"id"`
	KetuaName string  `json:"ketuaName"`
	WakilName string  `json:"wakilName"`
	PhotoURL  *string `json:"photoUrl"`
	Vision    *string `json:"vision"`
	Mission   *string `json:"mission"`
}

// =========================================
// LIST CANDIDATES
// =========================================

func listCandidates(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(
			c.Request.Context(),
			3*time.Second,
		)
		defer cancel()

		rows, err := pool.Query(ctx, `
			SELECT
				id,
				ketua_name,
				wakil_name,
				photo_url,
				vision,
				mission
			FROM candidates
			ORDER BY created_at ASC, id ASC
		`)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal mengambil kandidat.",
			})
			return
		}
		defer rows.Close()

		result := make([]candidateResponse, 0)

		for rows.Next() {
			var item candidateResponse

			if err := rows.Scan(
				&item.ID,
				&item.KetuaName,
				&item.WakilName,
				&item.PhotoURL,
				&item.Vision,
				&item.Mission,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Gagal membaca data kandidat.",
				})
				return
			}

			result = append(result, item)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal membaca data kandidat.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"candidates": result,
		})
	}
}

// =========================================
// VOTE REQUEST
// =========================================

type voteRequest struct {
	CandidateID string `json:"candidateId" binding:"required"`
}

// =========================================
// SUBMIT VOTE
// =========================================

func submitVote(
	pool *pgxpool.Pool,
	cfg config.Config,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check authenticated user
		user, ok := middleware.CurrentUser(c)

		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Silakan login terlebih dahulu.",
			})
			return
		}

		// Validate request
		var input voteRequest

		if err := c.ShouldBindJSON(&input); err != nil ||
			input.CandidateID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":  "INVALID_CANDIDATE",
				"error": "Silakan pilih pasangan terlebih dahulu.",
			})
			return
		}

		ctx, cancel := context.WithTimeout(
			c.Request.Context(),
			5*time.Second,
		)
		defer cancel()

		// Begin transaction
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{
			IsoLevel: pgx.ReadCommitted,
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Suara gagal disimpan. Silakan coba lagi.",
			})
			return
		}

		defer func() {
			_ = tx.Rollback(context.Background())
		}()

		// =====================================
		// CHECK VOTING SCHEDULE
		// =====================================

		var openAt, closeAt time.Time

		err = tx.QueryRow(ctx, `
			SELECT open_at, close_at
			FROM voting_settings
			WHERE id = 'voting-settings'
			FOR SHARE
		`).Scan(&openAt, &closeAt)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusConflict, gin.H{
				"code":  "VOTING_NOT_CONFIGURED",
				"error": "Voting belum dikonfigurasi oleh admin.",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Gagal memeriksa jadwal voting.",
			})
			return
		}

		var databaseNow time.Time

		if err := tx.QueryRow(
			ctx,
			`SELECT NOW()`,
		).Scan(&databaseNow); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Gagal memeriksa jadwal voting.",
			})
			return
		}

		if databaseNow.Before(openAt) {
			c.JSON(http.StatusConflict, gin.H{
				"code":  "VOTING_NOT_OPEN",
				"error": "Voting belum dibuka.",
			})
			return
		}

		if !databaseNow.Before(closeAt) {
			c.JSON(http.StatusConflict, gin.H{
				"code":  "VOTING_CLOSED",
				"error": "Voting sudah ditutup.",
			})
			return
		}

		// =====================================
		// VALIDATE CANDIDATE
		// =====================================

		var candidateID string

		err = tx.QueryRow(ctx, `
			SELECT id
			FROM candidates
			WHERE id = $1
		`, input.CandidateID).Scan(&candidateID)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"code":  "CANDIDATE_NOT_FOUND",
				"error": "Pasangan calon tidak ditemukan.",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Gagal memeriksa pasangan calon.",
			})
			return
		}

		// =====================================
		// UPDATE VOTER STATUS
		// =====================================

		var updatedID string

		err = tx.QueryRow(ctx, `
			UPDATE users
			SET
				has_voted = TRUE,
				updated_at = NOW()
			WHERE
				id = $1
				AND role = 'VOTER'
				AND has_voted = FALSE
			RETURNING id
		`, user.ID).Scan(&updatedID)

		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusConflict, gin.H{
				"code":  "ALREADY_VOTED",
				"error": "Akun ini sudah memberikan suara.",
			})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Gagal memperbarui status pemilih.",
			})
			return
		}

		// =====================================
		// INSERT VOTE
		// =====================================

		_, err = tx.Exec(ctx, `
			INSERT INTO votes (
				id,
				user_id,
				candidate_id,
				created_at
			)
			VALUES ($1, $2, $3, NOW())
		`,
			uuid.NewString(),
			user.ID,
			candidateID,
		)

		if err != nil {
			var pgErr *pgconn.PgError

			if errors.As(err, &pgErr) &&
				pgErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{
					"code":  "ALREADY_VOTED",
					"error": "Akun ini sudah memberikan suara.",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Suara gagal disimpan. Silakan coba lagi.",
			})
			return
		}

		// =====================================
		// COMMIT TRANSACTION
		// =====================================

		if err := tx.Commit(ctx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":  "VOTE_FAILED",
				"error": "Suara gagal disimpan. Silakan periksa status voting sebelum mencoba lagi.",
			})
			return
		}

		// =====================================
		// DELETE SESSION AFTER VOTING
		// =====================================

		sessionID, cookieErr := c.Cookie(cfg.SessionCookie)

		if cookieErr == nil && sessionID != "" {
			deleteCtx, deleteCancel := context.WithTimeout(
				context.Background(),
				2*time.Second,
			)

			_, _ = pool.Exec(
				deleteCtx,
				`DELETE FROM sessions WHERE id = $1`,
				sessionID,
			)

			deleteCancel()
		}

		c.SetSameSite(http.SameSiteLaxMode)

		c.SetCookie(
			cfg.SessionCookie,
			"",
			-1,
			"/",
			"",
			cfg.AppEnv == "production",
			true,
		)

		// =====================================
		// SUCCESS RESPONSE
		// =====================================

		c.JSON(http.StatusCreated, gin.H{
			"success":    true,
			"redirectTo": "/thanks",
		})
	}
}
