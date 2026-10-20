package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"voting-angkatan/backend/internal/config"
	"voting-angkatan/backend/internal/middleware"
)

const votingSettingsID = "voting-settings"

var wibLocation = time.FixedZone("WIB", 7*60*60)

// normalizeDBTimestamp treats PostgreSQL timestamp-without-time-zone values as UTC wall time.
// This matches parseVotingTime, which converts WIB input to UTC before persisting it.
func normalizeDBTimestamp(value time.Time) time.Time {
	return time.Date(
		value.Year(), value.Month(), value.Day(),
		value.Hour(), value.Minute(), value.Second(), value.Nanosecond(),
		time.UTC,
	)
}

func votingStatus(openAt, closeAt, now time.Time) (status string, isOpen bool) {
	now = now.UTC()
	openAt = normalizeDBTimestamp(openAt)
	closeAt = normalizeDBTimestamp(closeAt)

	switch {
	case !now.Before(closeAt):
		return "CLOSED", false
	case now.Before(openAt):
		return "UPCOMING", false
	default:
		return "OPEN", true
	}
}

type candidateInput struct {
	KetuaName     string  `json:"ketuaName" binding:"required"`
	KetuaPhotoURL *string `json:"ketuaPhotoUrl"`
	WakilName     string  `json:"wakilName" binding:"required"`
	WakilPhotoURL *string `json:"wakilPhotoUrl"`
	Vision        *string `json:"vision"`
	Mission       *string `json:"mission"`
}

// adminCandidateResponse includes the vote count used by dashboard and results.
// It is separate from candidateResponse in voting.go, which is used by voter endpoints.
type adminCandidateResponse struct {
	ID            string  `json:"id"`
	KetuaName     string  `json:"ketuaName"`
	KetuaPhotoURL *string `json:"ketuaPhotoUrl"`
	WakilName     string  `json:"wakilName"`
	WakilPhotoURL *string `json:"wakilPhotoUrl"`
	Vision        *string `json:"vision"`
	Mission       *string `json:"mission"`
	VoteCount     int64   `json:"voteCount"`
}

type voterResponse struct {
	ID       string `json:"id"`
	NIM      string `json:"nim"`
	Name     string `json:"name"`
	Kelompok string `json:"kelompok"`
	HasVoted bool   `json:"hasVoted"`
}

func registerAdminRoutes(router *gin.RouterGroup, pool *pgxpool.Pool, cfg config.Config) {
	admin := router.Group("/admin")
	admin.Use(middleware.RequireSession(pool, cfg), middleware.RequireAdmin())
	admin.GET("/dashboard", adminDashboard(pool))
	admin.GET("/results", adminResults(pool))
	admin.GET("/voting-settings", getVotingSettings(pool))
	admin.PUT("/voting-settings", updateVotingSettings(pool))
	admin.POST("/candidates", createCandidate(pool))
	admin.PUT("/candidates/:id", updateCandidate(pool))
	admin.DELETE("/candidates/:id", deleteCandidate(pool))
}

// adminDashboard returns the complete payload needed by the Vue admin dashboard.
func adminDashboard(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 8*time.Second)
		defer cancel()

		currentUser, ok := middleware.CurrentUser(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi admin tidak ditemukan."})
			return
		}

		var totalVoters, votedCount, totalVotes, totalCandidates int64
		queries := []struct {
			dest  *int64
			query string
		}{
			{&totalVoters, `SELECT COUNT(*) FROM users WHERE role::text = 'VOTER'`},
			{&votedCount, `SELECT COUNT(*) FROM users WHERE role::text = 'VOTER' AND has_voted = TRUE`},
			{&totalVotes, `SELECT COUNT(*) FROM votes`},
			{&totalCandidates, `SELECT COUNT(*) FROM candidates`},
		}
		for _, item := range queries {
			if err := pool.QueryRow(ctx, item.query).Scan(item.dest); err != nil {
				internalError(c)
				return
			}
		}

		voters := make([]voterResponse, 0)
		rows, err := pool.Query(ctx, `
			SELECT id, nim, name, kelompok, has_voted
			FROM users
			WHERE role::text = 'VOTER'
			ORDER BY name ASC, nim ASC
		`)
		if err != nil {
			internalError(c)
			return
		}
		for rows.Next() {
			var item voterResponse
			if err := rows.Scan(&item.ID, &item.NIM, &item.Name, &item.Kelompok, &item.HasVoted); err != nil {
				rows.Close()
				internalError(c)
				return
			}
			voters = append(voters, item)
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			internalError(c)
			return
		}
		rows.Close()

		candidates := make([]adminCandidateResponse, 0)
		candidateRows, err := pool.Query(ctx, `
			SELECT c.id, c.ketua_name, c.ketua_photo_url, c.wakil_name,
			       c.wakil_photo_url, c.vision, c.mission, COUNT(v.id)::bigint AS vote_count
			FROM candidates c
			LEFT JOIN votes v ON v.candidate_id = c.id
			GROUP BY c.id
			ORDER BY c.created_at ASC, c.id ASC
		`)
		if err != nil {
			internalError(c)
			return
		}
		for candidateRows.Next() {
			var item adminCandidateResponse
			if err := candidateRows.Scan(&item.ID, &item.KetuaName, &item.KetuaPhotoURL,
				&item.WakilName, &item.WakilPhotoURL, &item.Vision, &item.Mission, &item.VoteCount); err != nil {
				candidateRows.Close()
				internalError(c)
				return
			}
			candidates = append(candidates, item)
		}
		if err := candidateRows.Err(); err != nil {
			candidateRows.Close()
			internalError(c)
			return
		}
		candidateRows.Close()

		voting := gin.H{
			"isConfigured": false,
			"isOpen":       false,
			"status":       "NOT_CONFIGURED",
			"openAt":       nil,
			"closeAt":      nil,
			"openAtInput":  "",
			"closeAtInput": "",
		}
		var openAt, closeAt time.Time
		err = pool.QueryRow(ctx, `
			SELECT open_at, close_at
			FROM voting_settings
			WHERE id = $1
			LIMIT 1
		`, votingSettingsID).Scan(&openAt, &closeAt)
		if err == nil {
			// Database timestamps are UTC wall time; normalize before comparing with current UTC.
			openAt = normalizeDBTimestamp(openAt)
			closeAt = normalizeDBTimestamp(closeAt)
			status, isOpen := votingStatus(openAt, closeAt, time.Now())
			voting = gin.H{
				"isConfigured": true,
				"isOpen":       isOpen,
				"status":       status,
				"openAt":       openAt.Format(time.RFC3339),
				"closeAt":      closeAt.Format(time.RFC3339),
				"openAtInput":  openAt.In(wibLocation).Format("2006-01-02T15:04"),
				"closeAtInput": closeAt.In(wibLocation).Format("2006-01-02T15:04"),
			}
		} else if !errors.Is(err, pgx.ErrNoRows) {
			internalError(c)
			return
		}

		notVotedCount := totalVoters - votedCount
		if notVotedCount < 0 {
			notVotedCount = 0
		}
		participationRate := float64(0)
		if totalVoters > 0 {
			participationRate = float64(votedCount) * 100 / float64(totalVoters)
		}

		c.JSON(http.StatusOK, gin.H{
			"user":              currentUser,
			"candidates":        candidates,
			"totalVoters":       totalVoters,
			"totalUsers":        totalVoters,
			"totalCandidates":   totalCandidates,
			"totalVotes":        totalVotes,
			"votedCount":        votedCount,
			"notVotedCount":     notVotedCount,
			"participationRate": participationRate,
			"voters":            voters,
			"voting":            voting,
			"votingStatus":      voting["status"],
			"isVotingOpen":      voting["isOpen"],
		})
	}
}

func adminResults(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := pool.Query(ctx, `
			SELECT c.id, c.ketua_name, c.ketua_photo_url, c.wakil_name,
			       c.wakil_photo_url, c.vision, c.mission, COUNT(v.id)::bigint AS vote_count
		FROM candidates c
		LEFT JOIN votes v ON v.candidate_id = c.id
		GROUP BY c.id
		ORDER BY vote_count DESC, c.created_at ASC, c.id ASC
		`)
		if err != nil {
			internalError(c)
			return
		}
		defer rows.Close()

		results := make([]adminCandidateResponse, 0)
		for rows.Next() {
			var item adminCandidateResponse
			if err := rows.Scan(&item.ID, &item.KetuaName, &item.KetuaPhotoURL,
				&item.WakilName, &item.WakilPhotoURL, &item.Vision, &item.Mission, &item.VoteCount); err != nil {
				internalError(c)
				return
			}
			results = append(results, item)
		}
		if err := rows.Err(); err != nil {
			internalError(c)
			return
		}

		var totalVotes int64
		if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM votes`).Scan(&totalVotes); err != nil {
			internalError(c)
			return
		}
		c.JSON(http.StatusOK, gin.H{"results": results, "totalVotes": totalVotes})
	}
}

type settingsInput struct {
	OpenAt  string `json:"openAt" binding:"required"`
	CloseAt string `json:"closeAt" binding:"required"`
}

// parseVotingTime accepts datetime-local values as WIB and RFC3339 timestamps.
func parseVotingTime(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, errors.New("waktu kosong")
	}
	if parsed, err := time.Parse(time.RFC3339Nano, value); err == nil {
		return parsed.UTC(), nil
	}
	for _, layout := range []string{"2006-01-02T15:04", "2006-01-02T15:04:05"} {
		if parsed, err := time.ParseInLocation(layout, value, wibLocation); err == nil {
			return parsed.UTC(), nil
		}
	}
	return time.Time{}, errors.New("format waktu tidak valid")
}

func getVotingSettings(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var openAt, closeAt time.Time
		err := pool.QueryRow(ctx, `
			SELECT open_at, close_at
			FROM voting_settings
			WHERE id = $1
			LIMIT 1
		`, votingSettingsID).Scan(&openAt, &closeAt)
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal voting belum dikonfigurasi."})
			return
		}
		if err != nil {
			internalError(c)
			return
		}

		openAt = normalizeDBTimestamp(openAt)
		closeAt = normalizeDBTimestamp(closeAt)
		c.JSON(http.StatusOK, gin.H{
			"openAt":       openAt.Format(time.RFC3339),
			"closeAt":      closeAt.Format(time.RFC3339),
			"openAtInput":  openAt.In(wibLocation).Format("2006-01-02T15:04"),
			"closeAtInput": closeAt.In(wibLocation).Format("2006-01-02T15:04"),
		})
	}
}

func updateVotingSettings(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input settingsInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "openAt dan closeAt wajib diisi."})
			return
		}
		openAt, err := parseVotingTime(input.OpenAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format waktu pembukaan tidak valid."})
			return
		}
		closeAt, err := parseVotingTime(input.CloseAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format waktu penutupan tidak valid."})
			return
		}
		if !closeAt.After(openAt) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Waktu tutup voting harus setelah waktu buka voting."})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 4*time.Second)
		defer cancel()
		_, err = pool.Exec(ctx, `
			INSERT INTO voting_settings (id, open_at, close_at, updated_at)
			VALUES ($1, $2, $3, NOW())
			ON CONFLICT (id) DO UPDATE SET
				open_at = EXCLUDED.open_at,
				close_at = EXCLUDED.close_at,
				updated_at = NOW()
		`, votingSettingsID, openAt, closeAt)
		if err != nil {
			internalError(c)
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "Jadwal voting berhasil diperbarui.",
			"openAt":  openAt.Format(time.RFC3339),
			"closeAt": closeAt.Format(time.RFC3339),
		})
	}
}

func cleanOptional(value *string) *string {
	if value == nil {
		return nil
	}
	cleaned := strings.TrimSpace(*value)
	if cleaned == "" {
		return nil
	}
	return &cleaned
}

func validateCandidateInput(input *candidateInput) string {
	input.KetuaName = strings.TrimSpace(input.KetuaName)
	input.WakilName = strings.TrimSpace(input.WakilName)
	input.KetuaPhotoURL = cleanOptional(input.KetuaPhotoURL)
	input.WakilPhotoURL = cleanOptional(input.WakilPhotoURL)
	input.Vision = cleanOptional(input.Vision)
	input.Mission = cleanOptional(input.Mission)

	if input.KetuaName == "" {
		return "Nama Ketua wajib diisi."
	}
	if input.WakilName == "" {
		return "Nama Wakil wajib diisi."
	}
	if len([]rune(input.KetuaName)) > 200 || len([]rune(input.WakilName)) > 200 {
		return "Nama Ketua dan Wakil maksimal 200 karakter."
	}
	return ""
}

func createCandidate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input candidateInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payload kandidat tidak valid."})
			return
		}
		if message := validateCandidateInput(&input); message != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": message})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 4*time.Second)
		defer cancel()
		id := uuid.NewString()
		_, err := pool.Exec(ctx, `
			INSERT INTO candidates
				(id, ketua_name, ketua_photo_url, wakil_name, wakil_photo_url, vision, mission, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		`, id, input.KetuaName, input.KetuaPhotoURL, input.WakilName, input.WakilPhotoURL, input.Vision, input.Mission)
		if err != nil {
			internalError(c)
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Pasangan calon berhasil ditambahkan."})
	}
}

func updateCandidate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := strings.TrimSpace(c.Param("id"))
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID pasangan tidak ditemukan."})
			return
		}
		var input candidateInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payload kandidat tidak valid."})
			return
		}
		if message := validateCandidateInput(&input); message != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": message})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 4*time.Second)
		defer cancel()
		tag, err := pool.Exec(ctx, `
			UPDATE candidates SET
				ketua_name = $1, ketua_photo_url = $2, wakil_name = $3,
				wakil_photo_url = $4, vision = $5, mission = $6, updated_at = NOW()
			WHERE id = $7
		`, input.KetuaName, input.KetuaPhotoURL, input.WakilName, input.WakilPhotoURL,
			input.Vision, input.Mission, id)
		if err != nil {
			internalError(c)
			return
		}
		if tag.RowsAffected() == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pasangan calon tidak ditemukan."})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Pasangan calon berhasil diperbarui."})
	}
}

func deleteCandidate(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := strings.TrimSpace(c.Param("id"))
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID pasangan tidak ditemukan."})
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 4*time.Second)
		defer cancel()

		var voteID string
		err := pool.QueryRow(ctx, `SELECT id FROM votes WHERE candidate_id = $1 LIMIT 1`, id).Scan(&voteID)
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Pasangan yang sudah memiliki suara tidak dapat dihapus."})
			return
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			internalError(c)
			return
		}

		tag, err := pool.Exec(ctx, `DELETE FROM candidates WHERE id = $1`, id)
		if err != nil {
			internalError(c)
			return
		}
		if tag.RowsAffected() == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pasangan calon tidak ditemukan."})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Pasangan calon berhasil dihapus."})
	}
}

func internalError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan server."})
}
