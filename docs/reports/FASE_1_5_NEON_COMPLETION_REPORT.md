# FASE 1.5 — NEON COMPLETION REPORT (HOTMAP)

- **Proyek**: HOTMAP (`hotspot-khartula/`)
- **Fase**: Fase 1.5 — Rekonsiliasi Schema, Hardening Keamanan, Storage, Berita, Fast Login, & Kesiapan Pra-Fase 2
- **Pelaksana Implementasi**: Gemini Neon CLI
- **Validator Independen Berikutnya**: Gemini Hydrogen (menunggu persetujuan pengguna untuk Prompt 2)
- **Tanggal Laporan**: 2026-11-20
- **Status Pekerjaan Keseluruhan**: **`PARTIALLY COMPLETED`**
- **Supabase Project Ref**: `twhclfubwvahcbgohckx` (Region `ap-southeast-2`, PostgreSQL `17.11`, Status `ACTIVE_HEALTHY`)

---

## 1. Ringkasan Eksekutif

Audit menyeluruh telah dilakukan terhadap repository lokal (`hotspot-khartula/`, `supabase/`) dan kondisi aktual database remote Supabase melalui Supabase MCP (mode **READ-ONLY**, tanpa mutasi database remote tanpa persetujuan pengguna).

Hasil verifikasi ulang terhadap kondisi remote menunjukkan bahwa tiga migrasi Fase 1.5 telah tercatat aktif di database remote (`fase1_5_berita`, `fase1_5_laporan_penugasan_foto_riwayat`, `fase1_5_rls_and_storage_buckets`), bucket `berita-images` dan `laporan-bukti` sudah aktif beserta RLS Storage, dan **Supabase Security Advisor kini melaporkan `0` peringatan keamanan (`lints: []`)**.

Pada sisi kode lokal, ditemukan dan diperbaiki **8 masalah nyata** mencakup:
1. Query dataset utama (`fetchNormalizedDataset`) yang tidak mengambil kolom extended `laporan_karhutla` (`petugas_id`, `estimasi_luas`, `jenis_kejadian`, dll.) sehingga nama petugas dan estimasi luas selalu tampil kosong/default.
2. Statistik "Artikel Berita" di Dashboard Admin yang sebelumnya terpotong oleh `limit: 3` dan hanya menghitung artikel `published`.
3. Tidak terintegrasinya tabel `penanganan_log` pada tampilan detail laporan serta halaman diagnostik `/test-db` yang baru memeriksa 4 dari 8 tabel.
4. Halaman `/admin/wilayah` yang belum menampilkan `kabupaten_kota` dan koordinat pusat (`center_lat`, `center_lng`).
5. Celah validasi input pada `fetchLaporanById` (non-UUID memicu error Postgres `22P02`), `fetchBeritaById` (query fallback non-UUID sia-sia), serta `updateBeritaAction` (slug bisa tertimpa atau melanggar constraint `< 3` karakter).
6. Penguatan keamanan unggah Storage melalui verifikasi *magic bytes* gambar (`JPEG`/`PNG`/`WebP`) di server (`src/lib/storage.js`).
7. Penguatan validasi batas koordinat geografis (`isValidLatLng`: lat `-90..90`, lng `-180..180`) sebelum proyeksi marker peta.
8. Perapihan alur autentikasi (`registerAction` tidak lagi mengirim klaim `role` di `user_metadata` maupun menjalankan `profiles.insert()` yang ditolak RLS; `middleware.js` memakai `.maybeSingle()` dan mempertahankan query string pada `redirectTo`; tombol Fast Login yang belum dikonfigurasi dinonaktifkan di UI).

Seluruh verifikasi lokal (`npm run lint`, `npm run build`, dan unit assertions modul Storage/GIS/Auth) berhasil **PASS**. Pekerjaan yang masih **BLOCKED** adalah pengujian end-to-end berbasis sesi login aktual (Fast Login, RBAC lintas-role runtime, pengujian RLS & Storage upload/delete langsung) karena `auth.users` masih `0` baris dan kredensial demo (`DEMO_*`) belum tersedia di `.env.local`, serta pembersihan opsional artefak legacy remote yang menunggu persetujuan eksplisit pengguna.

---

## 2. Kondisi Awal Proyek

Ringkasan kondisi awal sebelum audit ulang dilakukan:
- Project Reference `twhclfubwvahcbgohckx` terhubung via Supabase MCP.
- Laporan verifikasi awal (`19:48 WIB`) mencatat 8 tabel di `public` (`0` baris), hanya 1 bucket (`media-karhutla`), dan 3 peringatan Security Advisor pada `public.get_my_role()`.
- Terdapat 3 file migrasi lokal di `supabase/migrations/` (`000100`, `000200`, `000300`), 1 seed file `supabase/seed/001_demo_accounts.sql`, dan 1 skrip provisioning `hotspot-khartula/scripts/provision-demo-users.mjs`.
- Kredensial Fast Login (`DEMO_*`) belum terkonfirmasi di `hotspot-khartula/.env.local`.

**Pembaruan faktual hasil verifikasi ulang via Supabase MCP (`20:05 WIB`)**:
- Migrasi ketiga `20261120125003` (`fase1_5_rls_and_storage_buckets`) telah tercatat diterapkan pada remote Supabase sebelum sesi implementasi Neon dimulai.
- Bucket `berita-images` dan `laporan-bukti` beserta 8 policy RLS Storage aktif sudah tersedia di remote.
- Security Advisor (`get_advisors(type: "security")`) sudah bersih (`lints: []`).

---

## 3. Hasil Audit Repository

Audit dilakukan pada seluruh direktori `hotspot-khartula/src/`, `hotspot-khartula/scripts/`, `supabase/`, dan konfigurasi proyek:
- **Stack terkonfirmasi**: Next.js `16.4.0` (App Router + Turbopack + React Compiler), React `19.3.0`, JavaScript/JSX (`jsconfig.json`, tanpa TypeScript `tsconfig.json`), Tailwind CSS `4`, `@supabase/ssr` `^0.12.7`, `@supabase/supabase-js` `^2.119.0`.
- **Routing & Navigasi**: 26 route aktif terverifikasi tanpa dead links (`/`, `/peta`, `/berita`, `/berita/[id]`, `/login`, `/register`, `/dashboard`, `/test-db`, `/admin/*`, `/petugas/*`, `/pelapor/*`).
- **Supabase Client**: Pemisahan benar antara `src/lib/supabase/client.js` (`createBrowserClient`) dan `src/lib/supabase/server.js` (`createServerClient` per-request). Tidak ada `SUPABASE_SERVICE_ROLE_KEY` yang diekspos ke client atau `NEXT_PUBLIC_*`.
- **Environment Variables (`hotspot-khartula/.env.local`)**:
  - Terpasang (`<SET>`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`.
  - Belum terpasang (`<NOT SET>`): `ENABLE_FAST_LOGIN` (fallback default `true` di non-production), `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_PETUGAS_EMAIL`, `DEMO_PETUGAS_PASSWORD`, `DEMO_PELAPOR_EMAIL`, `DEMO_PELAPOR_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Peringatan framework saat build**:
  1. Next.js `16.4.0` menampilkan rekomendasi upgrade keamanan (*security advisory*) dan peringatan deprecate konvensi `middleware.js` → `proxy.js`. Tidak diubah pada fase ini karena di luar ruang lingkup Fase 1.5 (butuh persetujuan upgrade dependency tersendiri).

---

## 4. Hasil Audit Database Supabase

Verifikasi aktual via Supabase MCP (`list_migrations`, `list_tables`, `execute_sql` read-only, `get_advisors`):

- **Migrasi Remote Tercatat**:
  1. `20261120124604` — `fase1_5_berita`
  2. `20261120124707` — `fase1_5_laporan_penugasan_foto_riwayat`
  3. `20261120125003` — `fase1_5_rls_and_storage_buckets`
  *(Catatan: timestamp versi remote berbeda dari nama file lokal `20261118000100..300`, menandakan penerapan melalui MCP `apply_migration`.)*
- **Tabel `public` (8 tabel, seluruhnya `rls_enabled = true`, seluruhnya `0` baris)**:
  - `wilayah`, `profiles`, `laporan_karhutla`, `penanganan_log`, `berita`, `laporan_foto`, `penugasan_laporan`, `laporan_riwayat_status`.
- **Auth & Data**: `auth.users` = `0` baris, `storage.objects` = `0` baris.
- **Trigger Aktif**:
  - `auth.users`: `on_auth_user_created` (`AFTER INSERT` → `public.handle_new_user()`).
  - `public.berita`: `trg_berita_updated_at` (`BEFORE UPDATE` → `public.set_updated_at()`).
  - `public.laporan_karhutla`: `trg_laporan_karhutla_updated_at` (`BEFORE UPDATE` → `public.set_updated_at()`).
  - `public.penugasan_laporan`: `trg_sync_laporan_petugas` (`AFTER INSERT OR UPDATE` → `private.sync_laporan_petugas_from_penugasan()`).
- **Performance Advisor**: Hanya 17 catatan level `INFO` (`unused_index`) yang wajar karena seluruh tabel masih kosong (`0` baris). **Nol** peringatan `auth_rls_initplan` maupun `multiple_permissive_policies`.

---

## 5. Hasil Audit Storage

| Bucket | Status Remote | Public | Limit Ukuran | Allowed MIME Types | Objek | Kesesuaian Aplikasi |
|---|---|---|---|---|---|---|
| `berita-images` | Tersedia | `true` | 5 MB (`5242880`) | `image/jpeg`, `image/png`, `image/webp` | 0 | Sesuai `STORAGE_BUCKETS.BERITA` |
| `laporan-bukti` | Tersedia | `false` (Privat) | 5 MB (`5242880`) | `image/jpeg`, `image/png`, `image/webp` | 0 | Sesuai `STORAGE_BUCKETS.LAPORAN` |
| `media-karhutla` | Masih ada (Legacy) | `true` | 5 MB (`5242880`) | `image/jpeg`, `image/png` | 0 | Tidak digunakan di kode aplikasi |

- **Kebijakan `storage.objects` aktif**:
  - `berita-images`: Publik (`anon`, `authenticated`) boleh `SELECT`; hanya `admin` (`private.has_role(ARRAY['admin'])`) boleh `INSERT`, `UPDATE`, `DELETE`.
  - `laporan-bukti`: `authenticated` hanya boleh `INSERT` ke folder `<auth.uid()>/...`; `SELECT` dibatasi untuk `admin`, pemilik folder `<auth.uid()>`, atau `pelapor_id`/`petugas_id` yang terhubung lewat `public.laporan_foto` + `public.laporan_karhutla`; `UPDATE`/`DELETE` hanya untuk pemilik folder atau `admin`.
  - **Artefak legacy**: Terdapat 3 policy lama (`Admin dan Petugas kelola foto`, `Publik bisa lihat foto karhutla`, `User login bisa upload foto karhutla`) yang sudah dinetralkan ke `roles: {service_role}` dengan kondisi `false` (tidak dapat digunakan oleh `anon` maupun `authenticated`).
- **Validasi Upload Aplikasi (`src/lib/storage.js`)**:
  - Format path `generateSafeStoragePath(userId, folder, filename)` menghasilkan `<uuid>/<folder>/<timestamp>-<uuid>.<ext>` yang cocok dengan `(storage.foldername(name))[1] = auth.uid()::text`.
  - Sebelum perbaikan: hanya memeriksa ekstensi, `file.type`, dan ukuran file.
  - Setelah perbaikan: ditambah validasi *magic bytes* (`verifyImageMagicBytes`) sebelum upload di `uploadBeritaImage` dan `uploadLaporanEvidence`.

---

## 6. Hasil Audit Keamanan dan RLS

- **Security Advisor Remote**: `get_advisors(type: "security")` mengembalikan **`lints: []`** (0 temuan).
- **Status `public.get_my_role()`**:
  - Pada kondisi remote saat ini, fungsi `public.get_my_role()` telah diubah menjadi `SECURITY INVOKER` (`prosecdef = false`) dengan `SET search_path TO ''`, dan hak `EXECUTE` telah dicabut dari `PUBLIC`, `anon`, dan `authenticated` (hanya `postgres` & `service_role`).
  - Seluruh kebijakan RLS aktif telah dipindahkan ke schema non-exposed `private` (`private.has_role(text[])` dan `private.get_my_role()`, keduanya `SECURITY DEFINER`, `SET search_path TO ''`, dengan `(SELECT auth.uid())` initplan-safe).
  - Verifikasi `pg_depend` menunjukkan `public.get_my_role()` memiliki **0 dependensi** di database, sehingga aman dihapus melalui migrasi pembersihan opsional.
- **Temuan Keamanan Tambahan (Dicatat & Ditangani/Didokumentasikan)**:
  1. `private` schema & fungsi `private.get_my_role()` / `private.has_role(text[])` masih memiliki `GRANT USAGE/EXECUTE` kepada `anon`, padahal tidak ada policy `TO anon` yang memanggilnya → disiapkan pencabutan di migrasi opsional `000400`.
  2. Tiga policy legacy berskop `{service_role}` tersisa di `public.laporan_karhutla`, `public.profiles`, dan `public.wilayah` (tidak berbahaya karena `service_role` bypass RLS, namun tidak perlu) → disiapkan penghapusan di migrasi opsional `000400`.
  3. Kebijakan `UPDATE` pada `public.laporan_karhutla` (`"Petugas dan Admin update laporan"`) saat ini mengizinkan semua `petugas` memperbarui laporan apa pun (belum dibatasi hanya pada `petugas_id = auth.uid()`). Dicatat sebagai perhatian keamanan wajib untuk **Fase 3** saat aksi mutasi penanganan petugas diimplementasikan.
  4. Kebijakan `SELECT` pada `public.profiles` mengizinkan semua `authenticated` membaca kolom non-sensitif profil (`id`, `full_name`, `role`, `wilayah_id`, `created_at`) untuk menampilkan nama pelapor/petugas/penulis berita. Tabel `profiles` tidak menyimpan email/password/nomor telepon.
  5. Kebijakan `UPDATE` pada `public.profiles` telah menutup celah *privilege escalation* kolom `role` dengan `WITH CHECK` memastikan non-admin tidak dapat mengubah `role` (`role = (SELECT private.get_my_role())`).
  6. `registerAction` sebelumnya menyertakan `role: "pelapor"` pada `user_metadata` dan melakukan fallback `profiles.insert()` yang pasti ditolak RLS → **sudah diperbaiki di lokal**.

---

## 7. Hasil Audit Autentikasi dan Fast Login

- **Login & Logout**: Menggunakan Server Actions (`loginAction`, `logoutAction`) dengan `@supabase/ssr` `signInWithPassword` dan `signOut`.
- **Session & Route Guard**:
  - `src/middleware.js` menggunakan `supabase.auth.getUser()` (validasi server, bukan `getSession()`), mengambil role dari `public.profiles`, dan mengarahkan sesuai `ROLE_RULES`.
  - Seluruh halaman & layout terproteksi juga memanggil `requireRole(...)` di sisi server (defense-in-depth).
- **Validasi Redirect**: `isPathAllowedForRole()` menolak open-redirect (`//`, `\`, protokol eksternal) serta memvalidasi prefix route berdasarkan role.
- **Fast Login**:
  - Dilindungi `isFastLoginEnabled()` (hanya aktif otomatis di `NODE_ENV !== "production"` kecuali `ENABLE_FAST_LOGIN=true`).
  - Kredensial dibaca khusus dari environment server (`DEMO_*`), tidak pernah dikirim ke client (UI hanya menerima boolean `fastLogin.roles`).
  - `fastLoginAction` memverifikasi kecocokan `profiles.role === targetRole` dan langsung memanggil `signOut()` jika tidak cocok.
- **Status Kesiapan Data & Env**:
  - `auth.users` = `0` baris, `public.profiles` = `0` baris.
  - `DEMO_ADMIN_*`, `DEMO_PETUGAS_*`, `DEMO_PELAPOR_*` belum diisi di `.env.local`.
  - `supabase/seed/001_demo_accounts.sql` masih menggunakan placeholder password (sudah diproteksi guard `RAISE EXCEPTION`).
  - **Membutuhkan input & persetujuan pengguna** sebelum akun demo dibuat di Supabase Auth dan kredensial lokal ditulis ke `.env.local`.

---

## 8. Hasil Audit GIS

- **Penyimpanan Koordinat**:
  - `public.wilayah`: `center_lat`, `center_lng` (`double precision`, `CHECK` `-90..90` & `-180..180`).
  - `public.laporan_karhutla`: `latitude`, `longitude` (`double precision`, `CHECK` `-90..90` & `-180..180`).
- **Validasi & Proyeksi Frontend**:
  - Ditemukan bahwa komponen peta (`LandingExplorer`, `MapOverviewBox`, `LaporanTable`, `LaporanDetailView`) sebelumnya hanya memeriksa `Number.isFinite(...)` tanpa mengecek rentang geografis valid `-90..90` dan `-180..180`. **Sudah diperbaiki** dengan helper `isValidLatLng()`.
  - Peta saat ini menggunakan kanvas SVG Indonesia dengan proyeksi equirectangular (`projectToIndonesiaMap`), membedakan warna marker berdasarkan status (`STATUS_META`), menyertakan label eksplisit *"Titik menunjukkan laporan warga, bukan deteksi hotspot satelit"*, serta terintegrasi dengan filter wilayah/tanggal/status dan panel detail.
  - Peta interaktif Leaflet/MapLibre tetap dijadwalkan untuk **Fase 2** (tidak dimulai di Fase 1.5).
- **Evaluasi PostGIS**:
  - `postgis` `3.3.7` tersedia pada `pg_available_extensions` (`installed_version: null`), **tidak diaktifkan**.
  - **Keputusan Fase 1.5**: PostGIS **belum diperlukan** pada Fase 1.5 karena seluruh kebutuhan saat ini hanya penyimpanan dan pembacaan titik koordinat laporan/wilayah tanpa query spasial server-side (radius/polygon/nearest-neighbor). Pendekatan `double precision` + `CHECK` constraint dipertahankan untuk Fase 1.5 dan dapat dievaluasi kembali pada Fase 2/4 jika dibutuhkan query spasial (dengan skema `extensions` + kolom `geography(Point, 4326)` + indeks GiST).

---

## 9. Daftar Masalah yang Ditemukan

| Prioritas | Kategori | Masalah | Status |
|---|---|---|---|
| **High** | Data Integration | `fetchNormalizedDataset` hanya memilih `BASE_LAPORAN_COLS` sehingga `petugas_id`, `estimasi_luas`, `jenis_kejadian`, `alamat_lokasi`, `tingkat_keparahan`, `verified_by`, `verified_at` selalu kosong pada landing page, `/peta`, dan dashboard. | **FIXED (Lokal)** |
| **High** | Dashboard Admin | Kartu "Artikel Berita" di `/admin` menampilkan `dataset.beritaList.length` yang dibatasi `limit: 3` dan hanya status `published`. | **FIXED (Lokal)** |
| **High** | Auth / Fast Login | `auth.users` & `public.profiles` kosong (`0` baris) dan variabel `DEMO_*` belum dikonfigurasi di `.env.local`, menghambat uji login/RBAC/RLS/Storage end-to-end. | **BLOCKED (Menunggu input/persetujuan pengguna)** |
| **Medium-High** | Modul Laporan & Diagnostik | `fetchLaporanById` & `LaporanDetailView` belum memuat `penanganan_log`; `/test-db` baru memeriksa 4 dari 8 tabel `public`. | **FIXED (Lokal)** |
| **Medium-High** | Modul Wilayah | `/admin/wilayah` tidak menampilkan `kabupaten_kota` dan `center_lat`/`center_lng`. | **FIXED (Lokal)** |
| **Medium** | Storage Security | Validasi upload di `src/lib/storage.js` belum memeriksa *magic bytes* biner gambar di server. | **FIXED (Lokal)** |
| **Medium** | GIS Validation | Validasi koordinat frontend hanya cek `Number.isFinite` tanpa memeriksa batas `-90..90` & `-180..180`. | **FIXED (Lokal)** |
| **Medium** | Modul Berita & Query Safety | `fetchLaporanById` memicu Postgres `22P02` pada ID non-UUID; `fetchBeritaById` menjalankan fallback `.eq("id", nonUuid)` sia-sia; `updateBeritaAction` tidak mempertahankan `existing.slug` saat input slug kosong dan belum memvalidasi panjang slug `< 3`. | **FIXED (Lokal)** |
| **Medium** | Auth & Middleware | `registerAction` mengirim `role` di `user_metadata` & memiliki fallback `profiles.insert()` yang ditolak RLS; `middleware.js` memakai `.single()` dan menghilangkan query string di `redirectTo`; tombol Fast Login yang kosong masih bisa diklik. | **FIXED (Lokal)** |
| **Low** | Remote DB / Storage Hygiene | Tersisa `public.get_my_role()` (aman tapi tidak dipakai), izin `anon` tak terpakai di `private.*`, 3 policy legacy `{service_role}` di `public.*`, bucket kosong `media-karhutla`, dan perbedaan timestamp migrasi lokal vs remote. | **PREPARED (Migrasi 004 lokal, menunggu persetujuan remote)** |
| **Low** | Security / Framework | `next@16.4.0` memiliki rekomendasi upgrade security advisory & deprecate `middleware.js` → `proxy.js`. | **DOCUMENTED (Di luar cakupan Fase 1.5)** |

---

## 10. Perbaikan yang Telah Dilakukan

1. **Integrasi Query & Normalizer (`hotspot-khartula/src/lib/normalizers.js`)**:
   - Menambahkan helper `isValidLatLng(lat, lng)` dan `isUuid(val)`.
   - Memperbarui `fetchNormalizedDataset` untuk mengambil `EXTENDED_LAPORAN_COLS` (dengan fallback `BASE_LAPORAN_COLS` jika kolom belum ada) serta `kabupaten_kota, center_lat, center_lng` pada `wilayah`.
   - Memperbarui `fetchLaporanById` agar memvalidasi UUID sebelum query, memuat `penanganan_log` beserta nama petugasnya, dan mengembalikan `penangananLogList`.
   - Memperbaiki `fetchBeritaById` agar tidak memanggil `.eq("id", nonUuid)` untuk slug yang tidak ditemukan.
2. **Integrasi Detail Laporan (`LaporanDetailView.jsx` & 3 halaman detail role)**:
   - Menambahkan seksi read-only **Log Penanganan Lapangan** pada `LaporanDetailView.jsx` dan menyalurkan `penangananLogList` dari `/admin/laporan/[id]`, `/petugas/laporan/[id]`, dan `/pelapor/laporan/[id]`.
   - Memperbarui teks status kesiapan Fase 3 di `/petugas/laporan/[id]` agar mencerminkan struktur penugasan yang sudah aktif.
3. **Validasi GIS (`LandingExplorer.jsx`, `SharedUI.jsx`, `LaporanDetailView.jsx`)**:
   - Mengganti pengecekan koordinat menjadi `isValidLatLng(...)` di filter marker peta dan tampilan koordinat.
4. **Dashboard Admin, Wilayah, & Diagnostik (`/admin`, `/admin/wilayah`, `/test-db`)**:
   - Menghitung total artikel berita secara akurat (`count: "exact", head: true`) pada `/admin`.
   - Menampilkan `kabupaten_kota` dan `center_lat, center_lng` di `/admin/wilayah`.
   - Memperluas `/test-db` agar memeriksa seluruh 8 tabel `public`.
5. **Hardening Storage & Modul Berita (`src/lib/storage.js`, `src/lib/actions/berita.js`)**:
   - Menambahkan `verifyImageMagicBytes(file, expectedMimeType)` dan menerapkannya pada `uploadBeritaImage` serta `uploadLaporanEvidence`.
   - Memvalidasi panjang minimal slug (`>= 3` karakter), mempertahankan `existing.slug` saat `updateBeritaAction` menerima slug kosong, dan merevalidasi path `/berita/<slug>`.
6. **Hardening Auth & Middleware (`src/lib/actions/auth.js`, `src/middleware.js`, `src/components/auth/LoginForm.jsx`)**:
   - Menghapus `role: "pelapor"` dari `signUp` `user_metadata` dan menghapus fallback `profiles.insert()` yang tidak kompatibel dengan RLS.
   - Menggunakan `.maybeSingle()` pada lookup `profiles` di middleware serta mempertahankan query string pada parameter `redirectTo`.
   - Menonaktifkan tombol Fast Login di `LoginForm.jsx` ketika kredensial role belum terkonfigurasi (`!isConfigured`).
7. **Migrasi Pembersihan Opsional Lokal**:
   - Menyusun `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` dan memperbarui dokumentasi `supabase/README.md` (belum dijalankan ke remote).

---

## 11. Daftar File yang Dibuat, Diubah, atau Dihapus

### File Dibuat
- `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql`
- `docs/reports/FASE_1_5_NEON_COMPLETION_REPORT.md`

### File Diubah
- `hotspot-khartula/src/lib/normalizers.js`
- `hotspot-khartula/src/lib/storage.js`
- `hotspot-khartula/src/lib/actions/auth.js`
- `hotspot-khartula/src/lib/actions/berita.js`
- `hotspot-khartula/src/middleware.js`
- `hotspot-khartula/src/components/auth/LoginForm.jsx`
- `hotspot-khartula/src/components/landing/LandingExplorer.jsx`
- `hotspot-khartula/src/components/laporan/LaporanDetailView.jsx`
- `hotspot-khartula/src/components/ui/SharedUI.jsx`
- `hotspot-khartula/src/app/admin/page.js`
- `hotspot-khartula/src/app/admin/wilayah/page.js`
- `hotspot-khartula/src/app/admin/laporan/[id]/page.js`
- `hotspot-khartula/src/app/petugas/laporan/[id]/page.js`
- `hotspot-khartula/src/app/pelapor/laporan/[id]/page.js`
- `hotspot-khartula/src/app/test-db/page.jsx`
- `supabase/README.md`

### File Dihapus
- Tidak ada file yang dihapus.

---

## 12. Daftar Migrasi Baru atau Revisi

- **Baru (Lokal, Belum Diterapkan ke Remote)**:
  - `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql`
    - **Tujuan**: Mencabut izin `anon` tak terpakai pada schema/fungsi `private.*`, menghapus fungsi legacy `public.get_my_role()` (0 dependensi), dan menghapus 3 policy legacy berskop `{service_role}` pada `public.laporan_karhutla`, `public.profiles`, dan `public.wilayah`.
    - **Dampak**: Tidak mengubah perilaku fungsional `anon`, `authenticated`, maupun `service_role`; memperketat least-privilege dan merapikan katalog database.
    - **Risiko**: Sangat rendah (idempoten, telah diverifikasi `pg_depend` kosong dan seluruh policy `TO anon` tidak memanggil `private.*`).
- **Migrasi 001–003**: Tidak diubah.

---

## 13. Perubahan Database Remote yang Sudah Disetujui dan Dijalankan

- **Tidak ada perubahan database remote yang dijalankan oleh Gemini Neon pada sesi ini** (seluruh pemanggilan Supabase MCP bersifat **READ-ONLY**, mematuhi aturan wajib persetujuan eksplisit pengguna).
- **Tindakan remote yang disiapkan jika pengguna menyetujui nantinya**:
  1. *(Opsional)* Menjalankan `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql`.
  2. *(Opsional)* Menghapus bucket kosong legacy `media-karhutla` via Supabase Dashboard / Storage Admin API.
  3. *(Diperlukan untuk uji end-to-end Fast Login/RBAC/Storage)* Membuat 3 akun demo (`admin`, `petugas`, `pelapor`) di Supabase Auth & `public.profiles` menggunakan `hotspot-khartula/scripts/provision-demo-users.mjs` (dengan `SUPABASE_SERVICE_ROLE_KEY` sementara) atau melalui Supabase Dashboard + mengisi variabel `DEMO_*` di `hotspot-khartula/.env.local`.

---

## 14. Pengujian Beserta Hasilnya

| Pengujian | Status | Detail / Bukti Aktual |
|---|---|---|
| Lint (`npm run lint`) | **COMPLETED (PASS)** | `eslint` selesai dengan exit code `0`, `0` error dan `0` warning. |
| Build Next.js (`npm run build`) | **COMPLETED (PASS)** | Next.js `16.4.0` (Turbopack) kompilasi sukses (`1543ms`), exit code `0`, seluruh 26 route terbentuk. Catatan: menampilkan warning deprecate `middleware` dan reminder security advisory `next@16.4.0`. |
| Type checking | **NOT APPLICABLE / NOT TESTED** | Proyek menggunakan JavaScript/JSX (`jsconfig.json`, tanpa `tsconfig.json`). Next.js build menjalankan fase TypeScript check dalam `5ms` tanpa file `.ts`. |
| Validasi migrasi & skema remote | **COMPLETED (PASS)** | Diverifikasi via MCP: 3 migrasi tercatat, 8 tabel `public`, seluruh PK/FK/CHECK/index/trigger sesuai, Security Advisor `0` lints, Performance Advisor hanya `unused_index` (INFO). |
| Validasi konfigurasi Supabase | **COMPLETED (PASS)** | `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` terpasang dan mengarah ke `twhclfubwvahcbgohckx` (`ACTIVE_HEALTHY`). |
| Unit test helper Storage & magic bytes | **COMPLETED (PASS)** | `ALL_LOCAL_UNIT_CHECKS_PASSED`: bucket constants, batas 5 MB, MIME/ext check, signature biner JPEG/PNG/WebP valid vs file palsu/SVG ditolak, path `<uuid>/...` valid. |
| Unit test helper GIS & Normalizer | **COMPLETED (PASS)** | `ALL_LOCAL_UNIT_CHECKS_PASSED`: `isValidLatLng` menolak `lat>90`/`lng>180`/`null`, `parseCoord`, `isUuid`, `projectToIndonesiaMap`, `normalizeStatusKey`. |
| Unit test helper Auth & RBAC path | **COMPLETED (PASS)** | `ALL_AUTH_UNIT_CHECKS_PASSED`: `normalizeRole`, `isPathAllowedForRole` lintas role `admin`/`petugas`/`pelapor`, penolakan open-redirect (`//`, `\`, `https://`), `getFastLoginAvailability`. |
| Validasi autentikasi & Fast Login (E2E live) | **BLOCKED** | `auth.users` = `0` baris dan kredensial `DEMO_*` belum tersedia di `.env.local`. |
| Validasi otorisasi lintas-role runtime (E2E) | **BLOCKED** | Membutuhkan sesi login aktual 3 role (`admin`, `petugas`, `pelapor`). |
| Validasi RLS live (simulasi token user) | **BLOCKED** | Kebijakan RLS & grants sudah diaudit secara statis di `pg_policies` & `role_table_grants`, namun uji eksekusi query sebagai user `pelapor`/`petugas`/`admin` membutuhkan akun di `auth.users`. |
| Validasi Storage & upload foto live | **BLOCKED** | Bucket & policy sudah terverifikasi di `storage.buckets` & `pg_policies`, namun uji upload/signed URL/delete langsung membutuhkan akun login `admin` & `pelapor`. |
| Validasi integrasi modul laporan & GIS live dengan data | **BLOCKED (Data kosong)** | Query & komponen terverifikasi melalui build dan inspeksi skema, namun seluruh 8 tabel remote saat ini memiliki `0` baris. |

---

## 15. Kendala dan Pekerjaan Tertunda

1. **Akun Demo & Kredensial `.env.local` Belum Tersedia (`BLOCKED`)**:
   - Membutuhkan persetujuan pengguna untuk provisioning 3 akun demo ke Supabase Auth (via `provision-demo-users.mjs` atau input manual kredensial di `.env.local`) agar seluruh pengujian E2E Auth, Fast Login, RBAC, RLS, dan Storage upload dapat dijalankan.
2. **Pembersihan Opsional Remote (`BLOCKED` — Menunggu Persetujuan)**:
   - Penerapan `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` dan penghapusan bucket kosong legacy `media-karhutla` belum dijalankan ke remote.
3. **Sinkronisasi Versi Migrasi Lokal vs Remote**:
   - Timestamp file migrasi lokal (`20261118000100..300`) berbeda dengan versi tercatat di `supabase_migrations.schema_migrations` (`20261120124604`, `20261120124707`, `20261120125003`). Perlu kehati-hatian agar tidak menjalankan `supabase db push` tanpa rekonsiliasi histori migrasi.
4. **Windows Sandbox `EPERM` pada `.next`**:
   - Folder `.next` yang dibuat sebelum sesi menyebabkan `EPERM` saat build di dalam sandbox; build diverifikasi penuh dengan `npm run build` di luar sandbox (exit code `0`).

---

## 16. Risiko yang Masih Ada

1. **Cakupan `UPDATE` Petugas pada `public.laporan_karhutla` (Risiko Sedang — Fase 3)**:
   - Policy `"Petugas dan Admin update laporan"` mengizinkan setiap `petugas` memperbarui baris laporan mana pun, bukan hanya yang ditugaskan kepadanya (`petugas_id = auth.uid()`). Wajib diperketat sebelum atau saat Fase 3 aktif.
2. **Keamanan Versi Next.js `16.4.0` (Risiko Sedang)**:
   - `next build` melaporkan bahwa `next@16.4.0` terdampak security advisory yang diketahui. Disarankan menjadwalkan upgrade versi Next.js secara terpisah setelah validasi Fase 1.5.
3. **Belum Terujinya E2E dengan Data Nyata (Risiko Sedang)**:
   - Karena seluruh tabel masih `0` baris, alur runtime seperti signed URL `laporan-bukti`, tampilan foto berita publik, dan tampilan riwayat/log penanganan belum teruji dengan baris data aktual.
4. **Ketidaksinkronan Timestamp Migrasi Lokal vs Remote (Risiko Rendah–Sedang)**:
   - Menjalankan CLI `supabase db push` tanpa memperbaiki/menyelaraskan tabel `supabase_migrations` dapat mencoba menerapkan ulang file `20261118*`.

---

## 17. Rekomendasi Tindak Lanjut

1. **Validasi Independen (Prompt 2 — Gemini Hydrogen)**: Tinjau laporan ini dan jalankan audit/validasi independen terlebih dahulu sesuai alur kerja proyek.
2. **Provisioning Akun Demo & Uji E2E (Dengan Persetujuan Pengguna)**:
   - Buat 3 akun demo (`admin`, `petugas`, `pelapor`) di Supabase Auth dan lengkapi `DEMO_*` di `.env.local`, lalu jalankan pengujian E2E Login, Fast Login, RBAC lintas role, CRUD Berita + upload `berita-images`, serta uji akses baca/tulis RLS.
3. **Pembersihan Opsional Remote (Dengan Persetujuan Pengguna)**:
   - Tinjau dan (jika disetujui) terapkan `20261120000400_fase1_5_cleanup_optional.sql` serta hapus bucket kosong `media-karhutla` melalui Supabase Dashboard.
4. **Jadwalkan Upgrade Keamanan Next.js**:
   - Lakukan upgrade versi `next` (dan migrasi opsional `middleware.js` → `proxy.js`) sebagai tugas terpisah sebelum produksi.
5. **Persiapan Fase 2**:
   - Setelah validasi Hydrogen lulus dan uji E2E akun demo berhasil, baru mulai Fase 2 (Peta GIS Leaflet interaktif, formulir kirim laporan, dan unggah foto bukti ke `laporan-bukti`).

---

## 18. Instruksi Khusus untuk Gemini Hydrogen (Validator Independen)

> **Catatan peran**: Gemini Hydrogen bertindak sebagai reviewer dan validator independen (read-only terhadap implementasi). Jika ditemukan cacat atau regresi, kembalikan temuan ke Gemini Neon untuk diperbaiki sebelum validasi ulang.

### A. File yang Perlu Diperiksa Ulang
1. `hotspot-khartula/src/lib/normalizers.js` (`isValidLatLng`, `isUuid`, `fetchNormalizedDataset`, `fetchLaporanById`, `fetchBeritaById`).
2. `hotspot-khartula/src/lib/storage.js` (`verifyImageMagicBytes`, `uploadBeritaImage`, `uploadLaporanEvidence`).
3. `hotspot-khartula/src/lib/actions/auth.js` (`registerAction`, `loginAction`, `fastLoginAction`).
4. `hotspot-khartula/src/lib/actions/berita.js` (`createBeritaAction`, `updateBeritaAction`, `deleteBeritaAction`).
5. `hotspot-khartula/src/middleware.js` (`.maybeSingle()`, `redirectTo` dengan query string, `ROLE_RULES`).
6. `hotspot-khartula/src/components/auth/LoginForm.jsx` (state disabled tombol Fast Login).
7. `hotspot-khartula/src/components/laporan/LaporanDetailView.jsx` dan halaman detail `/admin/laporan/[id]`, `/petugas/laporan/[id]`, `/pelapor/laporan/[id]`.
8. `hotspot-khartula/src/components/landing/LandingExplorer.jsx` dan `hotspot-khartula/src/components/ui/SharedUI.jsx`.
9. `hotspot-khartula/src/app/admin/page.js`, `src/app/admin/wilayah/page.js`, dan `src/app/test-db/page.jsx`.

### B. Migrasi yang Perlu Divalidasi
1. Bandingkan 3 migrasi lokal (`20261118000100`, `20261118000200`, `20261118000300`) terhadap state remote (`20261120124604`, `20261120124707`, `20261120125003`).
2. Tinjau migrasi opsional baru `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` (verifikasi keamanan `REVOKE ... FROM anon` pada `private.*` dan penghapusan `public.get_my_role()` serta 3 policy `{service_role}`).

### C. Perubahan Keamanan yang Perlu Ditinjau
1. Konfirmasi `get_advisors(type: "security")` tetap `0` lints.
2. Verifikasi bahwa `registerAction` tidak lagi menulis `role` ke `user_metadata` dan bergantung penuh pada trigger `on_auth_user_created` (`public.handle_new_user()`).
3. Verifikasi implementasi `verifyImageMagicBytes` (JPEG/PNG/WebP) agar tidak menolak gambar valid dan menolak file non-gambar yang memalsukan MIME/ekstensi.
4. Evaluasi risiko policy `"Petugas dan Admin update laporan"` untuk kesiapan Fase 3.

### D. Skenario Pengujian Autentikasi & Role (Wajib Setelah Akun Demo Tersedia)
1. Login reguler & Fast Login untuk masing-masing role (`admin`, `petugas`, `pelapor`) serta redirect ke `/admin`, `/petugas`, `/pelapor`.
2. Akses lintas-role negatif: `pelapor` mencoba membuka `/admin`, `/petugas`, `/test-db`; `petugas` mencoba membuka `/admin`, `/pelapor/laporan/buat`, `/test-db`; `anon` mencoba membuka route terproteksi → redirect ke `/login?redirectTo=...` (termasuk query string).
3. Registrasi pelapor baru → verifikasi baris otomatis terbuat di `public.profiles` dengan `role = 'pelapor'` oleh trigger DB.
4. Uji coba non-admin mengubah kolom `role` miliknya sendiri di `public.profiles` → harus ditolak RLS.

### E. Skenario Pengujian Storage (Wajib Setelah Akun Demo Tersedia)
1. Admin membuat/mengedit/menghapus berita dengan gambar JPEG/PNG/WebP → objek masuk ke bucket `berita-images`, tampil di `/berita` dan `/berita/[id]`, dan file lama/terhapus bersih dari Storage.
2. Upload file > 5 MB, format non-gambar, atau file teks/SVG yang diganti ekstensinya menjadi `.jpg` → harus ditolak oleh `validateUploadFile` / `verifyImageMagicBytes`.
3. Non-admin (`pelapor`/`petugas`) mencoba upload ke `berita-images` → harus ditolak RLS Storage.
4. Uji akses bucket privat `laporan-bukti`: hanya `admin`, pemilik folder `<auth.uid()>`, atau pelapor/petugas terkait pada `laporan_foto` yang bisa membaca/membuat signed URL.

### F. Skenario Pengujian Modul GIS
1. Verifikasi marker dengan koordinat valid tampil di Landing Page, `/peta`, `/admin/peta`, `/petugas/peta`, dan dibedakan berdasarkan status.
2. Verifikasi koordinat di luar batas (`lat < -90`, `lat > 90`, `lng < -180`, `lng > 180`, atau `null`) tidak dirender sebagai marker palsu.
3. Konfirmasi keputusan tidak mengaktifkan PostGIS pada Fase 1.5 sesuai kebutuhan saat ini.

### G. Modul yang Belum Berhasil Diuji oleh Neon
- Pengujian E2E Auth/Fast Login, RBAC runtime, RLS dengan sesi pengguna nyata, CRUD Berita + Storage live upload, serta tampilan detail laporan (`fotoList`, `penugasanList`, `riwayatList`, `penangananLogList`) dengan data aktual (terhambat karena `auth.users` dan seluruh 8 tabel `public` masih `0` baris serta env `DEMO_*` belum diisi).

### H. Temuan yang Membutuhkan Validasi Independen
1. Kesesuaian migrasi opsional `20261120000400_fase1_5_cleanup_optional.sql` dan rencana pembersihan bucket legacy `media-karhutla`.
2. Rekomendasi jadwal upgrade keamanan `next@16.4.0` dan migrasi `middleware.js` → `proxy.js`.
3. Kebutuhan pengetatan policy `UPDATE` petugas pada `public.laporan_karhutla` sebelum masuk Fase 3.
