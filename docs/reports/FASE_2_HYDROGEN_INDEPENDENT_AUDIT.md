# FASE 2 — INDEPENDENT AUDIT REPORT (HOTMAP)

- **Proyek**: HOTMAP (`hotspot-khartula/`) — Web GIS Operasional Karhutla
- **Branch Diaudit**: `feature/fitur-peta` (`42a57c4`)
- **Tanggal Audit**: 2026-11-21
- **Auditor Independen**: Senior Software Engineer & Security Auditor (Gemini Hydrogen)
- **Dokumen Pembanding**:
  - `docs/reports/FASE_2_ARGON_COMPLETION_REPORT.md`
  - `docs/reports/FASE_2_ARGON_TEST_MATRIX.md`
- **Supabase Project Ref (Read-Only Verified)**: `twhclfubwvahcbgohckx`

---

## 1. Ringkasan Hasil Audit

Implementasi **FASE 2 HOTMAP** pada sisi kode aplikasi (`hotspot-khartula/`) secara garis besar **sesuai** dengan ruang lingkup yang dilaporkan dalam `FASE_2_ARGON_COMPLETION_REPORT.md`: peta SVG placeholder telah digantikan penuh dengan **Leaflet + `leaflet.markercluster`**, alur pelaporan → verifikasi → penugasan → penanganan → riwayat status telah terbangun lengkap melalui Server Actions, serta modul analitik, manajemen wilayah, manajemen pengguna, dan profil mandiri tersedia di seluruh portal.

Namun, verifikasi independen terhadap kode sumber, arsitektur caching, konfigurasi Next.js, serta inspeksi read-only langsung ke database Supabase `twhclfubwvahcbgohckx` menemukan **beberapa celah keamanan, bug fungsional UI, dan risiko integritas data yang wajib ditangani**:

1. **1 Temuan Critical**: Kebijakan RLS di Supabase remote belum diperketat (Migration `005` baru berada di lokal dan belum diterapkan ke remote), sehingga Direct-API Supabase (`PostgREST`) masih mengizinkan `petugas` mana pun mengubah `laporan_karhutla` mana pun dan mengisi `penanganan_log` untuk laporan yang bukan tugasnya.
2. **2 Temuan High**:
   - Caching autentikasi & profil 60 detik di `src/lib/auth.js` + `src/middleware.js` (`AUTH_CACHE_TTL_MS = 60_000`) menyebabkan penurunan/pencabutan role atau token tidak langsung berlaku dan berpotensi melewati auto-refresh session `@supabase/ssr`.
   - Mutasi multi-tabel di `src/lib/actions/laporan.js` (`assignPetugasAction`, `updatePenangananPetugasAction`, `createLaporanAction`) tidak atomik (tidak dibungkus RPC/transaksi Postgres dan sebagian error query diabaikan), sehingga dapat meninggalkan status/penugasan setengah jadi bila terjadi kegagalan di tengah proses.
3. **4 Temuan Medium**:
   - Bug UI di `LaporanFilterTable.jsx`: `useState(initialStatus)` tidak tersinkronisasi saat pengguna mengklik kartu status pada `/admin/laporan`, `/petugas/laporan`, atau `/pelapor/laporan`.
   - `HotmapCanvas.jsx`: pemanggilan `marker.openPopup()` saat titik berada dalam cluster tidak menggunakan `zoomToShowLayer()`, sehingga klik baris pada daftar laporan untuk titik terklaster gagal membuka popup.
   - Diskrepansi data analitik (`AdminDashboardPage` menghitung grafik distribusi & tren 14 hari dari `limit: 200` sementara KPI memakai `count: exact`), ditambah sinkronisasi cache in-memory antar instance serverless.
   - Kerentanan keamanan terpublikasi pada `next@16.4.0` (`SecurityFatalError` saat build awal), deprecation `middleware.js` → `proxy.js`, serta status `WARN` `auth_leaked_password_protection` pada Supabase Auth.
4. **4 Temuan Low**: Data `public.wilayah` remote masih `0` baris (memblokir pengiriman formulir `/pelapor/laporan/buat`), sisa policy `service_role` & bucket lama `media-karhutla` di remote, kebocoran kecil `URL.createObjectURL` / form reset UX di beberapa komponen, dan tidak adanya skrip E2E/integration test permanen di repo (`verify-fase2-e2e.mjs` tidak disimpan di repo).

**Kesimpulan Kelayakan**: **SIAP BERSYARAT (Perlu Perbaikan Wajib Sebelum FASE 3)**. Lakukan penerapan Migration `005` ke remote (atas persetujuan pengguna) dan perbaiki temuan Critical, High, serta bug UI Medium sebelum masuk ke FASE 3.

---

## 2. Fitur yang Terverifikasi

Berdasarkan pemeriksaan langsung terhadap file kode, output `npm test`, `npm run lint`, `npm run build`, probe HTTP `next start`, serta query read-only ke Supabase:

| Area | Status Verifikasi | Bukti Langsung |
|---|---|---|
| **Engine Peta GIS (`Leaflet` + `leaflet.markercluster`)** | Terverifikasi di Kode & SSR | `HotmapCanvas.jsx`, `HotmapMap.jsx`, `CoordinatePickerMap.jsx`, `CoordinatePicker.jsx` (`ssr: false`); popup menggunakan DOM API (`textContent`) bebas DOM XSS; 3 basemap (`OSM`, `Esri`, `OpenTopoMap`), cluster toggle, `Fokus Titik`, `Reset RI`, dan disclaimer non-hotspot satelit. Placeholder SVG lama di `SharedUI.jsx` & `LandingExplorer.jsx` telah dihapus. |
| **Pelaporan Karhutla (`/pelapor/laporan/buat`)** | Terverifikasi di Kode | `CreateLaporanForm.jsx` + `createLaporanAction`: validasi koordinat Indonesia (`lat -11.5..6.5`, `lng 94.5..142.0`, tolak `(0,0)`), validasi 0–3 foto, MIME + ekstensi + batas 5 MB + *magic bytes* fail-closed (`verifyImageMagicBytes`), bucket privat `laporan-bukti`, rollback Storage bila `INSERT laporan_karhutla` gagal. |
| **Verifikasi, Penugasan & Penanganan** | Terverifikasi di Kode (dengan catatan transaksi) | `workflow.js` state machine (`ADMIN_ALLOWED_TRANSITIONS`, `PETUGAS_ALLOWED_TRANSITIONS`), `AdminLaporanActionPanel.jsx`, `PetugasPenangananPanel.jsx`, trigger live `trg_sync_laporan_petugas` terkonfirmasi aktif di Postgres remote. |
| **Dashboard & Analitik** | Terverifikasi di Kode | `fetchExactStatusCounts` (`count: exact, head: true`) dan `fetchAdminAnalytics` di `normalizers.js` terhubung ke `/admin`, `/petugas`, dan `/pelapor`. |
| **Manajemen Wilayah, Pengguna & Profil** | Terverifikasi di Kode | `/admin/wilayah` (`AdminWilayahManager` + `actions/wilayah.js`), `/admin/pengguna` (`AdminUsersManager` + `actions/users.js` dengan proteksi anti self-demotion), `/pelapor/profil` & `/petugas/profil` (`ProfileSummaryView` tanpa field `role`). |
| **Filter & Pencarian Berita (`/berita`)** | Terverifikasi di Kode | `PublicBeritaExplorer.jsx` mendukung filter kategori dan pencarian judul/ringkasan/isi di sisi klien. |
| **Error Boundaries & RBAC Routing** | Terverifikasi di Kode & Probe HTTP | `error.js` pada root, `/admin`, `/petugas`, `/pelapor`; seluruh route terproteksi (`/admin`, `/petugas`, `/pelapor`, `/pelapor/laporan/buat`, `/dashboard`, `/test-db`) mengembalikan HTTP `307` ke `/login?redirectTo=...` saat `anon`. |

---

## 3. Daftar Temuan Audit

### CRITICAL

#### [C-01] Kebijakan RLS Remote `laporan_karhutla` dan `penanganan_log` Masih Terlalu Permisif (Migration 005 Belum Diterapkan)
- **Lokasi**:
  - Database Supabase live `twhclfubwvahcbgohckx` (`pg_policies` pada `public.laporan_karhutla` & `public.penanganan_log`)
  - File lokal belum diterapkan: `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql`
- **Bukti Pemeriksaan**:
  - `list_migrations` pada remote hanya mencatat 3 migration (`20261120124604`, `20261120124707`, `20261120125003`).
  - Policy `"Petugas dan Admin update laporan"` (`UPDATE` pada `public.laporan_karhutla`) masih memiliki `qual` dan `with_check` = `( SELECT private.has_role(ARRAY['petugas'::text, 'admin'::text]) AS has_role)`.
  - Policy `"Petugas dan Admin tambah log penanganan"` (`INSERT` pada `public.penanganan_log`) masih mengizinkan `petugas` mana pun menambah log pada `laporan_id` mana pun selama `petugas_id = auth.uid()`.
  - Policy `"User login buat laporan"` (`INSERT` pada `public.laporan_karhutla`) belum mewajibkan `verified_by`, `verified_at`, `petugas_id`, dan `catatan_verifikasi` bernilai `NULL`.
  - Constraint `laporan_karhutla_jenis_kejadian_check` dan index `idx_laporan_karhutla_lat_lng` belum ada di tabel `public.laporan_karhutla` remote.
- **Dampak**:
  - Pengguna ber-role `petugas` yang memanggil Supabase Data API (`PostgREST`) langsung dari browser/CLI menggunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY` + JWT dapat mengubah status, judul, koordinat, maupun kolom verifikasi pada **laporan milik siapa pun** (termasuk laporan yang belum ditugaskan kepadanya), serta menyisipkan `penanganan_log` palsu.
  - Pelapor yang memanggil PostgREST langsung saat `INSERT` dapat mengisi kolom `verified_by`/`petugas_id`/`catatan_verifikasi` secara sewenang-wenang.
- **Rekomendasi**:
  - Terapkan `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` ke Supabase remote (setelah persetujuan pengguna), lalu uji negatif langsung melalui PostgREST untuk memverifikasi kode error `42501`.

---

### HIGH

#### [H-01] Caching Auth 60 Detik di Server (`auth.js` & `middleware.js`) Menunda Pencabutan Role/Sesi dan Melewati Token Refresh
- **Lokasi**:
  - `hotspot-khartula/src/lib/server-cache.js:9, 78-101, 106-148, 153-163`
  - `hotspot-khartula/src/lib/auth.js:50-103`
  - `hotspot-khartula/src/middleware.js:66-116`
- **Detail Teknis**:
  - `getCurrentUserWithRole()` (yang dipakai oleh `requireRole()` pada semua Page dan Server Actions) menyimpan hasil `supabase.auth.getUser()` + query `profiles` di `globalThis` selama `AUTH_CACHE_TTL_MS = 60_000` (60 detik) berdasarkan hash cookie `sb-*`.
  - `middleware.js` juga membaca cache yang sama (`getCachedAuth(fingerprint)`).
- **Dampak**:
  1. **Stale Authorization / Privilege Window**: Ketika Admin menurunkan role pengguna (misal `admin` → `pelapor` atau `petugas` → `pelapor` melalui `adminUpdateUserAction`), pengguna korban yang mengirim cookie sesi yang sama masih lolos `requireRole()` dan `middleware.js` dengan role lamanya hingga **60 detik** — bahkan selamanya pada serverless instance lain di Vercel karena `invalidateHotmapCache({ auth: true })` hanya membersihkan memori instance yang mengeksekusi Server Action tersebut.
  2. **Bypass Token Refresh & Revocation**: Saat `getCachedAuth` hit di `middleware.js`, `createServerClient` dan `supabase.auth.getUser()` tidak dipanggil sama sekali sehingga mekanisme refresh access token `@supabase/ssr` dan deteksi sesi yang sudah dicabut di Supabase Auth tertunda hingga TTL 60 detik habis.
- **Rekomendasi**:
  - Hapus TTL cache lintas-request untuk otorisasi (`authMap` di `auth.js`/`middleware.js`) atau batasi hanya memakai React `cache()` per-request di `getCurrentUserWithRole()`, serta biarkan `middleware.js` selalu memvalidasi sesi secara aman per-request pada route terproteksi/auth.

#### [H-02] Mutasi Multi-Tabel di `actions/laporan.js` Tidak Atomik dan Sebagian Error DB Diabaikan
- **Lokasi**:
  - `hotspot-khartula/src/lib/actions/laporan.js:244-277` (`createLaporanAction`)
  - `hotspot-khartula/src/lib/actions/laporan.js:428-489` (`assignPetugasAction`)
  - `hotspot-khartula/src/lib/actions/laporan.js:656-740` (`updatePenangananPetugasAction`)
- **Detail Teknis**:
  1. Pada `assignPetugasAction`, langkah 1 membatalkan penugasan aktif sebelumnya (`status_penugasan = 'dibatalkan'`, yang otomatis memicu trigger mengosongkan `laporan_karhutla.petugas_id = NULL`), baru kemudian menjalankan `INSERT penugasan_laporan`. Jika `INSERT` gagal, penugasan sebelumnya sudah terlanjur dibatalkan sehingga laporan kehilangan petugas aktif. Selain itu, error pada update status `laporan_karhutla` (`461-468`) dan insert `laporan_riwayat_status` (`470-488`) tidak diperiksa.
  2. Pada `updatePenangananPetugasAction`, `laporan_karhutla.status` diubah terlebih dahulu (`657-660`), kemudian `penugasan_laporan` di-update **tanpa memeriksa `error`** (`691: await penugasanQuery;`), baru kemudian `INSERT laporan_foto` (`705-707`) dan `INSERT penanganan_log` (`721-727`). Jika insert `laporan_foto` atau `penanganan_log` gagal, status laporan di DB sudah terlanjur berubah (mis. menjadi `selesai`) tanpa log penanganan dan tanpa riwayat status.
  3. Pada `createLaporanAction`, bila insert `laporan_foto` gagal (`258-267`) setelah `laporan_karhutla` berhasil disimpan, file Storage dihapus tetapi baris `laporan_karhutla` tertinggal tanpa foto dan tanpa entri awal `laporan_riwayat_status`.
- **Rekomendasi**:
  - Pindahkan operasi multi-tabel kritis (`assign_petugas`, `update_penanganan_petugas`, dan/atau pencatatan laporan + foto + riwayat) ke fungsi RPC PostgreSQL (`SECURITY INVOKER`) agar berjalan dalam satu transaksi atomik, atau tambahkan kompensasi rollback & pemeriksaan `error` di setiap query.

---

### MEDIUM

#### [M-01] Filter Status pada Halaman Daftar Laporan Tidak Sinkron Saat Kartu KPI Diklik (`LaporanFilterTable.jsx`)
- **Lokasi**:
  - `hotspot-khartula/src/components/laporan/LaporanFilterTable.jsx:24, 29`
  - `hotspot-khartula/src/components/ui/SharedUI.jsx:67-75` (`SummaryCardsGrid`)
  - `hotspot-khartula/src/app/admin/laporan/page.js:60-65`
  - `hotspot-khartula/src/app/petugas/laporan/page.js:59-67`
  - `hotspot-khartula/src/app/pelapor/laporan/page.js:60-67`
- **Detail Teknis**:
  - `SummaryCardsGrid` merender `<Link href="...?status=...">` untuk memfilter laporan berdasarkan status.
  - Di Next.js App Router, perubahan query string (`?status=...`) pada path yang sama tidak melakukan *unmount/remount* terhadap Client Component `LaporanFilterTable`.
  - Karena `LaporanFilterTable` menginisialisasi `useState(initialStatus)` dan `useState(initialScope)` tanpa `key={activeStatus}` atau sinkronisasi prop, mengklik kartu status kedua kali pada halaman yang sama mengubah URL dan cincin highlight kartu KPI, tetapi **tabel di bawahnya tetap menampilkan filter status sebelumnya**.
- **Rekomendasi**:
  - Tambahkan `key={`${activeStatus}-${...}`}` pada `<LaporanFilterTable>` di ketiga halaman daftar laporan, atau sinkronkan state di dalam `LaporanFilterTable` melalui `useEffect` saat `initialStatus` / `initialScope` berubah.

#### [M-02] Fokus Popup Marker Peta Gagal Membuka Popup Ketika Titik Berada di Dalam Cluster (`HotmapCanvas.jsx`)
- **Lokasi**: `hotspot-khartula/src/components/map/HotmapCanvas.jsx:280-302`
- **Detail Teknis**:
  - Ketika `clusterEnabled = true` (default) dan pengguna mengklik baris laporan pada tabel (`LandingExplorer` / `PetaLaporanExplorer`), `HotmapCanvas` memanggil `map.flyTo(...)` lalu setelah `350ms` memanggil `marker.openPopup()`.
  - Jika pada zoom target (`12`) marker masih tergabung di dalam `L.markerClusterGroup` (atau sedang dalam proses animasi `flyTo`), pemanggilan `marker.openPopup()` secara langsung diabaikan oleh Leaflet karena marker fisik belum ditambahkan ke peta (masih diwakili ikon cluster). Selain itu `setTimeout` tidak memiliki fungsi cleanup bila komponen unmount atau `focusTarget` berubah cepat.
- **Rekomendasi**:
  - Gunakan `markersLayerRef.current.zoomToShowLayer(marker, () => marker.openPopup())` saat `clusterEnabled` aktif, dan bersihkan timer di cleanup `useEffect`.

#### [M-03] Analitik Dashboard Admin Menggunakan Data Terpotong `limit: 200` / `limit: 300` & Risiko Inkonsistensi Cache Multi-Instance
- **Lokasi**:
  - `hotspot-khartula/src/app/admin/page.js:59-72`
  - `hotspot-khartula/src/lib/normalizers.js:314, 840-856`
  - `hotspot-khartula/src/lib/auth.js:91-95`
  - `hotspot-khartula/next.config.mjs:9-12` (`experimental.staleTimes.dynamic = 60`)
- **Detail Teknis**:
  - Pada `AdminDashboardPage`, kartu KPI atas (`fetchExactStatusCounts`) menghitung seluruh baris di Postgres, sedangkan **Distribusi Laporan per Wilayah** dan **Tren Laporan (14 Hari Terakhir)** dihitung di memori dari `fetchNormalizedDataset(supabase, { limit: 200 })`. Jika total laporan melebihi 200 baris, grafik tidak lagi mencerminkan seluruh data yang dilaporkan pada KPI.
  - Pada `fetchAdminAnalytics`, query `penugasan_laporan` dibatasi `.limit(300)` (tidak memakai `count: exact`), dan `fetchBaseDatasetUncached` membatasi query `profiles` ke `.limit(500)`.
  - Pada `auth.js`, seluruh `admin` dan `petugas` berbagi satu cache key data `"staff"`, dan pada `next.config.mjs`, `staleTimes.dynamic = 60` menahan cache router di sisi klien selama 60 detik meski data berubah (kecuali lewat Server Action yang memanggil `revalidatePath` pada sesi klien itu sendiri).
- **Rekomendasi**:
  - Gunakan agregasi/query khusus berbasis rentang 14 hari + `count` di Postgres untuk analitik dashboard agar akurat di atas 200/300 baris, serta evaluasi penurunan `staleTimes.dynamic` pada halaman operasional dinamis.

#### [M-04] Kerentanan Keamanan `next@16.4.0`, Deprecation `middleware.js`, dan Advisor Auth Supabase
- **Lokasi**:
  - `hotspot-khartula/package.json:17, 25` (`next: 16.4.0`, `eslint-config-next: 16.4.0`)
  - `hotspot-khartula/src/middleware.js`
  - Supabase Security Advisor (`twhclfubwvahcbgohckx`)
- **Detail Teknis**:
  - Eksekusi `npm run build` memicu `Error [SecurityFatalError]: Your version of Next.js is affected by a known security vulnerability` (branch `chore/next-upgrade-16.4.6` sudah ada di repo tetapi belum digabung).
  - Build juga mencatat peringatan bahwa konvensi file `middleware.js` berstatus deprecated di Next.js 16 (disarankan migrasi ke `proxy.js`).
  - `get_advisors` tipe `security` pada live Supabase melaporkan 1 peringatan: `auth_leaked_password_protection` (*Leaked Password Protection Disabled*, level `WARN`).
- **Rekomendasi**:
  - Upgrade `next` dan `eslint-config-next` ke versi aman (`16.4.6` atau terbaru yang direkomendasikan), migrasi `middleware.js` → `proxy.js`, dan aktifkan *Leaked Password Protection* di Supabase Dashboard → Authentication.

---

### LOW

#### [L-01] `AdminLaporanActionPanel.jsx` Memakai `defaultValue` Tanpa Sinkronisasi Prop Setelah Mutasi
- **Lokasi**: `hotspot-khartula/src/components/laporan/AdminLaporanActionPanel.jsx:101, 123, 146, 232`
- **Detail**: `<select>` dan `<textarea>` hanya menggunakan `defaultValue` tanpa `key` yang berubah saat status/prioritas/petugas diperbarui, sehingga tampilan input dapat tertinggal dari state server terbaru. Pada `PetugasPenangananPanel.jsx`, kolom catatan juga tidak di-reset setelah submit berhasil.

#### [L-02] Sisa Policy `service_role`, Bucket Lama `media-karhutla`, dan Data Baseline Remote Kosong
- **Lokasi**: Database Supabase live `twhclfubwvahcbgohckx` (`storage.buckets`, `pg_policies`, `public.wilayah`, `public.profiles`)
- **Detail**:
  - Tabel `public.wilayah` remote masih `0` baris sehingga tombol submit `/pelapor/laporan/buat` tidak aktif sampai data wilayah diisi (`002_wilayah_indonesia.sql` atau lewat `/admin/wilayah`).
  - Bucket `media-karhutla` lama dan policy `{service_role}` residual (`20261120000400_fase1_5_cleanup_optional.sql`) masih ada di remote.
  - Seluruh 3 akun demo pada `public.profiles` masih memiliki `full_name = "Pengguna Baru"`.

#### [L-03] Detail Minor Lainnya (`CreateLaporanForm.jsx`, `LoginForm.jsx`, `package.json`, Cakupan Test)
- **Lokasi**:
  - `CreateLaporanForm.jsx:98`: `URL.createObjectURL(file)` tidak di-revoke jika user langsung mengganti pilihan file tanpa menekan tombol "Hapus Pilihan".
  - `LoginForm.jsx:237` & `auth.js:123-128`: pesan error Fast Login menyebut `.env.local` secara hardcode, dan `isFastLoginEnabled()` tidak secara eksplisit memblokir `VERCEL_ENV === "production"` sebagai pengaman tambahan.
  - `package.json`: belum memiliki `"type": "module"`, memicu warning `MODULE_TYPELESS_PACKAGE_JSON` saat menjalankan `npm test`.
  - `tests/`: unit test baru mencakup 4 modul helper (`13` kasus), sedangkan skrip E2E `verify-fase2-e2e.mjs` yang dirujuk di `FASE_2_ARGON_TEST_MATRIX.md` tidak tersedia di repository sehingga tidak dapat diaudit atau dijalankan ulang secara independen.

---

## 4. Hasil Pengujian Independen

Seluruh pengujian dijalankan ulang secara independen pada branch `feature/fitur-peta` (`42a57c4`) **tanpa mengubah kode maupun data Supabase**.

| Pengujian | Hasil | Rincian Teramati |
|---|---|---|
| `npm test` (`node --test tests/*.test.mjs`) | **PASS (13/13)** | `gis.test.mjs` (4/4), `server-cache.test.mjs` (2/2), `storage.test.mjs` (3/3), `workflow.test.mjs` (4/4). Durasi ~188 ms; muncul warning `MODULE_TYPELESS_PACKAGE_JSON`. |
| `npm run lint` (`eslint`) | **PASS** | Exit code `0`, 0 error, 0 warning. |
| `npm run build` (`next build` Turbopack) | **PASS (setelah retry security nudge)** | Percobaan 1 (sandboxed) terhenti/hang pada fase kompilasi/jaringan; percobaan 2 (luar sandbox) berhenti dengan exit code `1` karena `SecurityFatalError` pada `next@16.4.0`; percobaan 3 (retry) sukses (`exit code 0`, compiled in `1709ms`, seluruh 26 route + `/_not-found` terkompilasi, warning deprecate `middleware.js`). |
| Probe HTTP Live Server (`next start -H 127.0.0.1 -p 3099`) | **PASS (11/11 route)** | `/`, `/peta`, `/berita`, `/login`, `/register` mengembalikan HTTP `200` (`/` dan `/peta` memuat markup loader `HotmapMap`, `/login` memuat `Fast Login`); `/admin`, `/petugas`, `/pelapor`, `/pelapor/laporan/buat`, `/dashboard`, `/test-db` mengembalikan HTTP `307` redirect ke `/login`. |
| Inspeksi Read-Only Supabase (`twhclfubwvahcbgohckx`) | **TERVERIFIKASI** | `list_tables` (`wilayah`: 0, `profiles`: 3, tabel operasional lain: 0; RLS aktif di semua 8 tabel), `list_migrations` (3 migration Fase 1.5), `pg_policies` (mengonfirmasi temuan C-01 & L-02), `pg_trigger` (mengonfirmasi `trg_sync_laporan_petugas` & `on_auth_user_created` aktif), `get_advisors` (`performance`: 0 lint, `security`: 1 WARN `auth_leaked_password_protection`). |
| Pengujian Interaktif Browser Nyata (Leaflet click/drag marker, basemap switch, cluster, responsive mobile) | **NOT TESTED** | Koneksi ke Chrome gagal karena Chrome remote debugging tidak aktif (`ENOENT: C:\Users\Blu\AppData\Local\Google\Chrome\User Data\DevToolsActivePort`). |
| Pengujian Tulis E2E & Uji Negatif Direct-API RLS Pasca-Migration 005 | **NOT RUN (Dilarang Aturan Audit)** | Sesuai aturan audit, tidak dijalankan mutasi data ke Supabase remote dan tidak dijalankan migration `005` ke remote. |

---

## 5. Daftar Perbaikan yang Wajib Dilakukan

1. **[Wajib — Critical]** Terapkan `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` ke project Supabase remote (setelah mendapat persetujuan pengguna), lalu verifikasi langsung via PostgREST bahwa `petugas` ditolak (`42501`) saat mencoba mengubah laporan yang bukan tugasnya atau kolom administratif.
2. **[Wajib — High]** Hapus cache otorisasi TTL 60 detik (`authMap`) di `src/lib/auth.js` / `src/middleware.js` (gunakan `cache()` per-request saja) agar perubahan/pencabutan role dan token refresh bekerja seketika.
3. **[Wajib — High]** Perbaiki atomisitas `assignPetugasAction`, `updatePenangananPetugasAction`, dan `createLaporanAction` di `src/lib/actions/laporan.js` (gunakan fungsi transaksi RPC PostgreSQL atau rollback/pengecekan error di setiap langkah DB).
4. **[Wajib — Medium]** Perbaiki sinkronisasi state `LaporanFilterTable.jsx` terhadap perubahan query `?status=` / `initialScope` (M-01) serta perbaiki pembukaan popup pada marker terklaster via `zoomToShowLayer()` di `HotmapCanvas.jsx` (M-02).
5. **[Wajib — Medium]** Perbaiki query analitik dashboard (`AdminDashboardPage` & `fetchAdminAnalytics`) agar distribusi wilayah, tren 14 hari, dan statistik penugasan tidak terpotong oleh `limit: 200/300` (M-03).
6. **[Wajib — Medium]** Upgrade `next` & `eslint-config-next` dari `16.4.0` ke versi aman (`16.4.6`+), aktifkan *Leaked Password Protection* di Supabase Auth, dan siapkan data master `wilayah` (`002_wilayah_indonesia.sql`) agar formulir pelaporan dapat digunakan.
7. **[Disarankan — Browser & Regression Test]** Aktifkan Chrome remote debugging (`chrome://inspect/#remote-debugging`) dan jalankan uji interaktif browser nyata pada peta Leaflet (`/` & `/peta`), `CoordinatePicker` (`/pelapor/laporan/buat`), serta simpan suite uji E2E non-destruktif di `tests/`.

---

## 6. Rekomendasi Kelanjutan ke FASE 3

- **Keputusan**: **TIDAK DIREKOMENDASIKAN langsung memulai FASE 3 sebelum item wajib #1 s.d. #6 di atas diselesaikan.**
- **Alasan**: FASE 3 berfokus pada penguatan alur verifikasi, penugasan, dan penanganan. Memulai FASE 3 di atas RLS remote yang masih terbuka untuk `petugas`, cache auth 60 detik yang dapat menunda pencabutan hak akses, transaksi mutasi laporan yang belum atomik, dan bug sinkronisasi filter tabel daftar laporan berisiko menumpuk bug dan celah otorisasi ke modul berikutnya. Setelah 6 perbaikan wajib tersebut diselesaikan dan diuji ulang (termasuk verifikasi browser Leaflet), HOTMAP siap melanjutkan ke **FASE 3**.
