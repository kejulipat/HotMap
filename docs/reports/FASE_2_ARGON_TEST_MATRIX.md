# FASE 2 — TEST MATRIX (HOTMAP)

- **Proyek**: HOTMAP (`hotspot-khartula/`)
- **Tanggal Pengujian**: 2026-11-21
- **Lingkungan Uji**: Node.js `v24.20.0`, `eslint`, `node --test`, `next build` (Next.js `16.4.0` Turbopack), `next start` (`127.0.0.1:3098`), Live Supabase `twhclfubwvahcbgohckx`
- **Status Audit Independen**: Menunggu verifikasi independen **Gemini Hydrogen**

---

| # | Modul | Skenario | Role | Expected Result | Actual Result | Status | Bukti Pengujian |
|---|---|---|---|---|---|---|---|
| 1 | Static & Quality | `npm run lint` (ESLint + React 19 Compiler) | Dev/CI | Exit code `0`, 0 error & 0 warning | Exit code `0`, 0 error, 0 warning | **PASS** | Output `eslint` bersih (`task-252`) |
| 2 | Static & Quality | `npm run build` (Next.js 16 Turbopack) | Dev/CI | Seluruh 26 route terkompilasi sukses | Compiled in `3.1s`, 26/26 route sukses | **PASS** | Output `next build` (`exit code 0`) |
| 3 | Unit Test — GIS | Validasi koordinat finite, tolak `(0,0)`, cek batas RI, URL Maps/OSM | Unit | 4/4 test lulus | 4/4 test lulus | **PASS** | `tests/gis.test.mjs` (`npm test`) |
| 4 | Unit Test — Workflow | State machine transisi status Admin, Petugas, Pelapor, Anon | Unit | 4/4 test lulus (tolak lompatan & role ilegal) | 4/4 test lulus | **PASS** | `tests/workflow.test.mjs` (`npm test`) |
| 5 | Unit Test — Storage | Validasi MIME/size 5 MB, *magic bytes* fail-closed, anti path-traversal | Unit | 3/3 test lulus (`{}` & `null` -> `false`, spoof HTML -> `false`) | 3/3 test lulus | **PASS** | `tests/storage.test.mjs` (`npm test`) |
| 6 | Unit Test — Cache | Cookie fingerprint anon/auth, deduplikasi in-flight, invalidasi cache | Unit | 2/2 test lulus | 2/2 test lulus | **PASS** | `tests/server-cache.test.mjs` (`npm test`) |
| 7 | Authentication | Normal Login via Supabase Auth | Admin | Login sukses, user valid | Login sukses (`admin.demo@hotmap.local`) | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 8 | Authentication | Normal Login via Supabase Auth | Petugas | Login sukses, user valid | Login sukses (`petugas.demo@hotmap.local`) | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 9 | Authentication | Normal Login via Supabase Auth | Pelapor | Login sukses, user valid | Login sukses (`pelapor.demo@hotmap.local`) | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 10 | Authentication | Fast Login UI dipertahankan pada branch pengembangan | Anon | `/login` HTTP `200` & memuat tombol Fast Login | HTTP `200`, elemen Fast Login terdeteksi | **PASS** | `GET /login` (`task-271`) |
| 11 | Routing Publik | Akses halaman publik `/`, `/peta`, `/berita`, `/login`, `/register` | Anon | Seluruhnya mengembalikan HTTP `200` | Semua 5 route mengembalikan HTTP `200` | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 12 | Middleware & RBAC | Akses route terproteksi tanpa sesi (`/admin`, `/petugas`, `/pelapor`, `/dashboard`, `/test-db`) | Anon | Redirect HTTP `307` ke `/login?redirectTo=...` | Semua 5 route HTTP `307` ke `/login?redirectTo=...` | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 13 | Keamanan RLS | Percobaan `INSERT` tabel `wilayah` oleh non-admin | Pelapor, Petugas | Ditolak RLS (`42501`) | Ditolak `42501` untuk keduanya | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 14 | Keamanan RLS | Percobaan privilege escalation `UPDATE profiles SET role='admin'` | Pelapor, Petugas | Ditolak RLS (`42501`) | Ditolak `42501` untuk keduanya | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 15 | Keamanan RLS | Percobaan Pelapor membuat laporan langsung berstatus `terverifikasi` | Pelapor | Ditolak RLS (`42501`) | Ditolak `42501` | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 16 | Manajemen Wilayah | Admin menambah data wilayah uji (`Riau E2E Test`) | Admin | Baris tersimpan dengan UUID valid | Tersimpan (`55273cae-...`), dibersihkan pasca-uji | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 17 | Pelaporan & Storage | Pelapor unggah PNG valid ke bucket privat `laporan-bukti`, buat laporan, catat `laporan_foto` & riwayat awal | Pelapor | Upload & 3 insert DB sukses | Semua 4 langkah sukses (`eb97892a-...`) | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 18 | Visibilitas Status | Publik membaca laporan yang masih `menunggu_verifikasi` | Anon | 0 baris terlihat | 0 baris terlihat | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 19 | Administrasi Laporan | Admin melihat laporan baru, buat Signed URL foto privat, verifikasi & set prioritas `kritis` | Admin | Terlihat, Signed URL valid, status → `terverifikasi` | Semua langkah sukses | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 20 | Visibilitas Status | Publik membaca laporan setelah berstatus `terverifikasi` | Anon | 1 baris terlihat | 1 baris terlihat | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 21 | Penugasan & Trigger | Admin menugaskan Petugas di `penugasan_laporan` | Admin | Trigger `trg_sync_laporan_petugas` otomatis mengisi `laporan_karhutla.petugas_id` | `petugas_id` tersinkronisasi (`19c06e75-...`) | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 22 | Operasional Petugas | Petugas membaca Signed URL foto pelapor, unggah foto penanganan, ubah `ditangani` → `selesai`, catat `penanganan_log` & `laporan_riwayat_status` | Petugas | Semua operasi sukses untuk tugas miliknya | Semua 6 sub-langkah sukses | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 23 | Audit & Pelapor | Pelapor memeriksa status akhir dan seluruh riwayat perubahan | Pelapor | Status `selesai` dan 4 entri riwayat lengkap | `status=selesai`, `historyCount=4` | **PASS** | `verify-fase2-e2e.mjs` (`task-271`) |
| 24 | Cleanup Uji | Pembersihan seluruh objek Storage & data uji | Admin, Pelapor, Petugas | Database kembali ke baseline bersih (`0` baris uji) | Seluruh file & baris uji terhapus, count kembali `0` | **PASS** | `verify-fase2-e2e.mjs` + `execute_sql` |
| 25 | Hardening RLS Remote | Uji negatif direct-API PostgREST `UPDATE laporan_karhutla` oleh petugas tidak ditugaskan setelah Migration 005 | Petugas | Ditolak RLS/Trigger di Postgres remote | Migration 005 dibuat lokal (`supabase/migrations/20261121000500_*.sql`), belum diterapkan ke remote tanpa persetujuan pengguna (proteksi server-side di `updatePenangananPetugasAction` sudah aktif) | **BLOCKED** | Menunggu persetujuan penerapan migration remote |
| 26 | Browser GIS Interaktif | Interaksi klik/drag marker Leaflet & responsivitas viewport di browser nyata (headless CDP/Playwright) | Anon, Admin, Petugas, Pelapor | Marker, clustering, basemap switcher, popup anti-XSS, & coordinate picker berjalan mulus di desktop & mobile | Tidak dijalankan dengan headless browser pada sesi ini (komponen lolos kompilasi `next build`, unit test `gis.test.mjs`, dan SSR `HTTP 200`) | **NOT TESTED** | Diserahkan untuk verifikasi browser pada audit Gemini Hydrogen |
