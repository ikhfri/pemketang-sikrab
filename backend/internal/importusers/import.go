package importusers

import (
	"bytes"
	"unicode"

	"context"

	"encoding/csv"

	"fmt"

	"io"

	"net/http"
	"net/mail"

	"path/filepath"

	"strings"

	"time"

	"github.com/gin-gonic/gin"

	"github.com/google/uuid"

	"github.com/jackc/pgx/v5"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/xuri/excelize/v2"
)

const (
	maxUploadBytes = 5 << 20

	maxRows = 1000
)

type row struct {
	RowNumber int `json:"row"`

	NIM string `json:"nim"`

	Name string `json:"name"`

	Kelompok string `json:"kelompok"`
}

type rowIssue struct {
	RowNumber int `json:"row"`

	NIM string `json:"nim,omitempty"`

	Errors []string `json:"errors"`
}

type previewResponse struct {
	TotalRows int `json:"total_rows"`

	ValidRows int `json:"valid_rows"`

	InvalidRows int `json:"invalid_rows"`

	ExistingNIMs []string `json:"existing_nims,omitempty"`

	Rows []row `json:"valid_preview"`

	Errors []rowIssue `json:"errors"`

	Note string `json:"note"`
}

type parsedWorkbook struct {
	Rows []row

	Issues []rowIssue
}

func Register(adminGroup *gin.RouterGroup, pool *pgxpool.Pool) {

	adminGroup.POST("/users/import/preview", func(c *gin.Context) {

		wb, err := parseUpload(c)

		if err != nil {

			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

			return

		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)

		defer cancel()

		existing, err := findExistingNIMs(ctx, pool, wb.Rows)

		if err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memeriksa NIM di database"})

			return

		}

		issues := append([]rowIssue{}, wb.Issues...)

		valid := make([]row, 0, len(wb.Rows))

		existingList := make([]string, 0)

		for _, item := range wb.Rows {

			if _, ok := existing[item.NIM]; ok {

				issues = append(issues, rowIssue{RowNumber: item.RowNumber, NIM: item.NIM, Errors: []string{"NIM sudah terdaftar; data tidak akan diubah"}})

				existingList = append(existingList, item.NIM)

				continue

			}

			valid = append(valid, item)

		}

		c.JSON(http.StatusOK, previewResponse{

			TotalRows: len(wb.Rows) + len(wb.Issues),

			ValidRows: len(valid), InvalidRows: len(issues),

			ExistingNIMs: existingList, Rows: valid, Errors: issues,

			Note: "Preview saja: database belum diubah. Import akan memvalidasi ulang file.",
		})

	})

	adminGroup.POST("/users/import", func(c *gin.Context) {

		wb, err := parseUpload(c)

		if err != nil {

			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

			return

		}

		if len(wb.Rows) == 0 {

			c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada baris valid untuk diimpor", "errors": wb.Issues})

			return

		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)

		defer cancel()

		tx, err := pool.Begin(ctx)

		if err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulai transaksi"})

			return

		}

		defer tx.Rollback(ctx)

		// Re-check NIMs in transaction; ON CONFLICT also protects against concurrent imports.*

		existing := map[string]struct{}{}

		for _, item := range wb.Rows {

			var found string

			err := tx.QueryRow(ctx, `SELECT nim FROM users WHERE nim = $1 FOR SHARE`, item.NIM).Scan(&found)

			if err == nil {

				existing[item.NIM] = struct{}{}

			}

		}

		// Create credential CSV in memory only. It is returned once to the admin and not saved.*

		var output bytes.Buffer

		writer := csv.NewWriter(&output)

		_ = writer.Write([]string{"nim", "nama", "kelompok", "password_awal"})

		imported := 0

		skipped := 0

		for _, item := range wb.Rows {

			if _, ok := existing[item.NIM]; ok {

				skipped++

				continue

			}

			password := item.NIM

			tag, err := tx.Exec(ctx, `

                INSERT INTO users (id, nim, name, kelompok, password, role, has_voted)

                VALUES ($1, $2, $3, $4, $5, 'VOTER', FALSE)

                ON CONFLICT (nim) DO NOTHING

            `, uuid.NewString(), item.NIM, item.Name, item.Kelompok, password)

			if err != nil {

				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan akun; transaksi dibatalkan"})

				return

			}

			if tag.RowsAffected() == 0 {

				skipped++

				continue

			}

			if err := writer.Write([]string{item.NIM, item.Name, item.Kelompok, password}); err != nil {

				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyiapkan file kredensial"})

				return

			}

			imported++

		}

		writer.Flush()

		if err := writer.Error(); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyiapkan file kredensial"})

			return

		}

		if err := tx.Commit(ctx); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal commit transaksi"})

			return

		}

		c.Header("Content-Type", "text/csv; charset=utf-8")

		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="user-initial-passwords-%s.csv"`, time.Now().UTC().Format("20060102-150405")))

		c.Header("Cache-Control", "no-store, private")

		c.Header("X-Content-Type-Options", "nosniff")

		c.Header("X-Imported-Count", fmt.Sprint(imported))

		c.Header("X-Skipped-Count", fmt.Sprint(skipped))

		c.Header("X-Invalid-Row-Count", fmt.Sprint(len(wb.Issues)))

		c.Data(http.StatusOK, "text/csv; charset=utf-8", output.Bytes())

	})

	// Replace seluruh voter hanya jika belum ada suara yang tercatat.
	adminGroup.POST("/users/import/replace", func(c *gin.Context) {
		wb, err := parseUpload(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if len(wb.Issues) > 0 || len(wb.Rows) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":  "Replace dibatalkan: file harus berisi voter valid tanpa baris invalid.",
				"errors": wb.Issues,
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
		defer cancel()

		tx, err := pool.Begin(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulai transaksi"})
			return
		}
		defer tx.Rollback(ctx)

		// Lock tabel votes agar pengecekan suara tidak berlomba dengan penulisan suara.
		if _, err := tx.Exec(ctx, `LOCK TABLE votes IN SHARE MODE`); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengunci tabel votes"})
			return
		}
		var hasVotes bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM votes)`).Scan(&hasVotes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memeriksa suara"})
			return
		}
		if hasVotes {
			c.JSON(http.StatusConflict, gin.H{"error": "Replace ditolak karena sudah ada suara masuk."})
			return
		}

		var output bytes.Buffer
		writer := csv.NewWriter(&output)
		if err := writer.Write([]string{"nim", "nama", "kelompok", "password_awal"}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat CSV"})
			return
		}
		for _, item := range wb.Rows {
			if err := writer.Write([]string{item.NIM, item.Name, item.Kelompok, item.NIM}); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat CSV"})
				return
			}
		}
		writer.Flush()
		if err := writer.Error(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat CSV"})
			return
		}

		// Hanya hapus akun VOTER; akun ADMIN dipertahankan.
		if _, err := tx.Exec(ctx, `DELETE FROM users WHERE role = 'VOTER'`); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus voter lama; transaksi dibatalkan"})
			return
		}
		for _, item := range wb.Rows {
			_, err := tx.Exec(ctx, `
                INSERT INTO users (id, nim, name, kelompok, password, role, has_voted)
                VALUES ($1, $2, $3, $4, $5, 'VOTER', FALSE)
            `, uuid.NewString(), item.NIM, item.Name, item.Kelompok, item.NIM)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan voter baru; transaksi dibatalkan"})
				return
			}
		}
		if err := tx.Commit(ctx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal commit transaksi"})
			return
		}

		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="voter-replacement-%s.csv"`, time.Now().UTC().Format("20060102-150405")))
		c.Header("Cache-Control", "no-store, private")
		c.Header("X-Imported-Count", fmt.Sprint(len(wb.Rows)))
		c.Data(http.StatusOK, "text/csv; charset=utf-8", output.Bytes())
	})

}

func parseUpload(c *gin.Context) (parsedWorkbook, error) {

	var result parsedWorkbook

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadBytes+(1<<16))

	fileHeader, err := c.FormFile("file")

	if err != nil {

		return result, fmt.Errorf("field file wajib berisi file .xlsx")

	}

	if fileHeader.Size <= 0 || fileHeader.Size > maxUploadBytes {

		return result, fmt.Errorf("ukuran file maksimal 5 MB")

	}

	if !strings.EqualFold(strings.TrimSpace(filepath.Ext(fileHeader.Filename)), ".xlsx") {

		return result, fmt.Errorf("format file harus .xlsx")

	}

	file, err := fileHeader.Open()

	if err != nil {

		return result, fmt.Errorf("file tidak bisa dibuka")

	}

	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxUploadBytes+1))

	if err != nil || len(data) > maxUploadBytes {

		return result, fmt.Errorf("file terlalu besar atau tidak bisa dibaca")

	}

	book, err := excelize.OpenReader(bytes.NewReader(data))

	if err != nil {

		return result, fmt.Errorf("file Excel tidak valid atau rusak")

	}

	defer func() { _ = book.Close() }()

	sheets := book.GetSheetList()

	if len(sheets) == 0 {

		return result, fmt.Errorf("worksheet tidak ditemukan")

	}

	rows, err := book.GetRows(sheets[0])

	if err != nil || len(rows) < 2 {

		return result, fmt.Errorf("worksheet kosong atau hanya memiliki header")

	}

	if len(rows)-1 > maxRows {

		return result, fmt.Errorf("maksimal 1.000 baris data per import")

	}

	headers := make([]string, len(rows[0]))

	for i, header := range rows[0] {

		headers[i] = normalizeHeader(header)

	}

	findColumn := func(names ...string) int {

		for i, h := range headers {

			for _, name := range names {

				if h == name {

					return i

				}

			}

		}

		return -1

	}

	nimCol := findColumn("nim", "id_pemilih", "nomor_induk")

	nameCol := findColumn("nama", "name", "nama_lengkap", "nama_pemilih")

	groupCol := findColumn("kelompok", "group")

	if nimCol < 0 || nameCol < 0 || groupCol < 0 {

		return result, fmt.Errorf("header wajib: nim, nama (atau name/nama_lengkap), kelompok")

	}

	seen := map[string]int{}

	for index, cells := range rows[1:] {

		excelRow := index + 2

		get := func(col int) string {

			if col < 0 || col >= len(cells) {

				return ""

			}

			return strings.TrimSpace(cells[col])

		}

		item := row{RowNumber: excelRow, NIM: get(nimCol), Name: get(nameCol), Kelompok: get(groupCol)}

		var errs []string

		if item.NIM == "" {

			errs = append(errs, "NIM wajib diisi")

		} else if len(item.NIM) > 64 {

			errs = append(errs, "NIM maksimal 64 karakter")

		}

		if item.Name == "" {

			errs = append(errs, "Nama wajib diisi")

		} else if len([]rune(item.Name)) > 150 {

			errs = append(errs, "Nama maksimal 150 karakter")

		}

		if item.Kelompok == "" {

			errs = append(errs, "Kelompok wajib diisi")

		} else if len([]rune(item.Kelompok)) > 80 {

			errs = append(errs, "Kelompok maksimal 80 karakter")

		}

		if item.NIM != "" {

			if first, ok := seen[item.NIM]; ok {

				errs = append(errs, fmt.Sprintf("NIM duplikat di file (pertama muncul pada baris %d)", first))

			} else {

				seen[item.NIM] = excelRow

			}

		}

		if len(errs) > 0 {

			result.Issues = append(result.Issues, rowIssue{RowNumber: excelRow, NIM: item.NIM, Errors: errs})

			continue

		}

		result.Rows = append(result.Rows, item)

	}

	// Remove later duplicates from valid rows: only the first occurrence is importable.*

	seenValid := map[string]bool{}

	filtered := make([]row, 0, len(result.Rows))

	for _, item := range result.Rows {

		if seenValid[item.NIM] {

			continue

		}

		seenValid[item.NIM] = true

		filtered = append(filtered, item)

	}

	result.Rows = filtered

	return result, nil

}

func normalizeHeader(value string) string {

	value = strings.TrimSpace(strings.ToLower(value))

	value = strings.TrimPrefix(value, "\ufeff")

	replacer := strings.NewReplacer(" ", "_", "-", "_")

	return replacer.Replace(value)

}

func findExistingNIMs(ctx context.Context, pool *pgxpool.Pool, rows []row) (map[string]struct{}, error) {

	result := make(map[string]struct{})

	for _, item := range rows {

		var nim string

		err := pool.QueryRow(ctx, `SELECT nim FROM users WHERE nim = $1`, item.NIM).Scan(&nim)

		if err == nil {

			result[nim] = struct{}{}

			continue

		}

		if err != pgx.ErrNoRows {

			return nil, err

		}

	}

	return result, nil

}

// Keep a reference to mail parsing imported by optional downstream extensions.*

var _ = mail.ParseAddress

var _ = unicode.IsSpace
