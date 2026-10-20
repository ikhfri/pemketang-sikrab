# Backend Go — Voting Angkatan (Tahap 3)

Fitur yang ditambahkan:
- `GET /api/v1/candidates` — memerlukan session valid.
- `POST /api/v1/votes` — memerlukan session valid, mengecek jadwal dan kandidat, lalu menyimpan suara dalam transaksi.
- Middleware session dan pemeriksaan role admin dasar untuk digunakan pada route admin berikutnya.

## Jalankan

Salin `.env.example` menjadi `.env`, isi `DATABASE_URL` untuk database DEVELOPMENT yang memiliki schema yang sama dengan aplikasi lama, lalu:

```powershell
go mod tidy
go test ./...
go run ./cmd/api
```

## Endpoint

- `GET /health`
- `GET /ready`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/candidates`
- `POST /api/v1/votes`

Untuk login, gunakan JSON `{ "nim": "...", "password": "..." }`. Simpan cookie dengan cookie jar di client agar request selanjutnya terautentikasi.

Submit suara menggunakan JSON `{ "candidateId": "ID_KANDIDAT" }`.

## Mengapa voting aman dari request ganda?

1. Semua langkah write dilakukan dalam satu transaksi.
2. `UPDATE users ... WHERE has_voted = FALSE RETURNING id` hanya mengizinkan satu request mengubah status pemilih.
3. `votes.one_vote_per_user` tetap menjadi lapisan perlindungan terakhir di database.
4. Jika insert gagal, transaksi rollback sehingga perubahan `has_voted` tidak ikut tersimpan.
5. Waktu dibandingkan dengan PostgreSQL agar tidak bergantung pada jam mesin API.

## Penting

- Uji hanya di database development. Jangan load-test atau menguji vote di database production.
- Hash Argon2 dari Node harus diverifikasi kompatibilitasnya di akun uji sebelum cutover.
- Login belum punya rate limiter; tambahkan sebelum production.
- Route admin dan otorisasi admin belum diimplementasikan pada tahap ini.
- Jika cookie tidak dikirim oleh browser, cek bahwa frontend dan API menggunakan origin yang sama melalui Nginx. Jangan menonaktifkan perlindungan cookie untuk mengatasi masalah tersebut.
- Kode ini adalah tahap migrasi; lakukan review dan test sebelum production.
