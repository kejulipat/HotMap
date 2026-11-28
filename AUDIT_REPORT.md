# AUDIT REPORT
## HotMap (SIPKARHUTLA) — Sistem Informasi Web GIS Operasional Karhutla

> **Catatan Ruang Lingkup Domain:** Atas konfirmasi pemilik proyek, standar audit kepatuhan teknis dan struktur laporan ini diadaptasi dari template audit GIS ke domain aktual workspace **HotMap (SIPKARHUTLA — Web GIS Operasional Penanganan Kebakaran Hutan dan Lahan)** dengan role **Admin**, **Petugas**, dan **Pelapor**. Audit dilakukan murni bersifat *read-only* tanpa mengubah kode sumber, skema database, konfigurasi deployment, maupun data.

---

### 1. Informasi Audit

| Atribut | Detail |
| :--- | :--- |
| **Nama Proyek** | HotMap (SIPKARHUTLA) — direktori aplikasi `hotspot-khartula/` |
| **Tanggal Audit** | 2026-11-28 |
| **Repository & Branch** | GitHub (`https://github.com/kejulipat/HotMap`), checkout lokal pada branch `main` (`a0a6e64` + working tree optimisasi caching & hero WebP yang belum di-commit) |
| **Teknologi Utama** | Next.js `16.4.0` (App Router, Turbopack), React `19.3.0`, JavaScript/JSX, Tailwind CSS `^4`, Leaflet `^1.9.4`, `leaflet.markercluster` `^1.5.3`, `@supabase/supabase-js` `^2.119.0`, `@supabase/ssr` `^0.12.7`, ESLint `^9` |
| **Database & Storage** | Supabase PostgreSQL + Supabase Auth + Supabase Storage (project ref: `twhclfubwvahcbgohckx`) |
| **Environment Pengujian** | Windows lokal (`next build`, `next start -H 127.0.0.1 -p 3097`, `npm run lint`, `npm test`) + inspeksi read-only langsung ke Supabase remote via MCP + probe HTTP publik ke Vercel |
| **URL Deployment** | `https://petahotpsotindonesia.vercel.app/` (Vercel) |
| **Ruang Lingkup Audit** | Arsitektur & stack, penyimpanan data Supabase, Storage & privasi aset, autentikasi & RBAC/RLS 3 role (`admin`, `petugas`, `pelapor`), integritas & validasi data, UX/responsivitas, fungsional GIS karhutla, data dummy, keamanan/caching, serta verifikasi build & probe HTTP |

---

### 2. Ringkasan Eksekutif

**HotMap (SIPKARHUTLA)** telah memiliki fondasi arsitektur Web GIS operasional yang lengkap: integrasi Next.js 16 App Router dengan Supabase PostgreSQL, Supabase Auth (`@supabase/ssr`), Supabase Storage (`berita-images` publik & `laporan-bukti` privat), peta interaktif berbasis Leaflet + `leaflet.markercluster` dengan 3 basemap, alur operasional penuh dari pelaporan warga hingga verifikasi, penugasan petugas, penanganan lapangan, riwayat audit status, dashboard multi-role, manajemen wilayah/pengguna/berita, serta sistem caching berlapis (`unstable_cache`, `server-cache.js`, `client-cache.js`, dan Service Worker `public/sw.js`). Pada branch `main`, fitur *Fast Login* sudah dihapus penuh (`0` referensi di kode aktif).

Meskipun demikian, audit menemukan **1 temuan CRITICAL**, **3 temuan HIGH**, **5 temuan MEDIUM**, dan **3 temuan LOW** yang perlu diselesaikan sebelum aplikasi dinyatakan siap produksi penuh.

#### Rekapitulasi Status Ketentuan (Bagian 3 & Bagian 4)
- **Total ketentuan yang diperiksa:** `29` ketentuan (`16` teknis/nonfungsional + `13` fungsional GIS & data dummy)
- **PASS:** `15`
- **PARTIAL:** `11`
- **FAIL:** `1`
- **NOT VERIFIED:** `2`

#### Temuan Paling Penting
1. **[CRITICAL — C-01]** Kebijakan RLS di Supabase remote pada `public.laporan_karhutla` (`UPDATE`) dan `public.penanganan_log` (`INSERT`) masih terlalu permisif karena `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` belum diterapkan ke database remote.
2. **[HIGH — H-01]** Cache server `fetchLaporanById` menggunakan scope `"staff"` bersama untuk `admin` dan `petugas`, sehingga `petugas` yang tidak ditugaskan berpotensi menerima `fotoList` (signed URL privat), `penugasanList`, dan `riwayatList` dari hasil cache `admin` dalam jendela 30 detik pada instance server yang sama.
3. **[HIGH — H-02]** Cache autentikasi 60 detik (`AUTH_CACHE_TTL_MS = 60_000`) di `auth.js` dan `middleware.js` menunda pencabutan role/sesi dan dapat melewati refresh token `@supabase/ssr`.
4. **[HIGH — H-03]** Mutasi multi-tabel pada Server Actions `src/lib/actions/laporan.js` tidak atomik (tanpa transaksi/RPC Postgres) dan sebagian error query riwayat/penugasan tidak diperiksa.
5. **[MEDIUM — M-01]** Data dummy di Supabase sudah memuat 12 wilayah, 12 laporan (5 status), 7 penugasan, 7 log penanganan, 30 riwayat status, dan 6 berita, tetapi `public.laporan_foto` masih `0` baris sehingga galeri foto bukti belum terisi pada data dummy.

#### Kesimpulan Kesiapan Proyek
**Memenuhi sebagian ketentuan (Siap Bersyarat untuk Staging/Demo; Belum Siap Produksi Penuh)** hingga temuan `C-01`, `H-01`, `H-02`, `H-03`, dan sinkronisasi push/deploy ke `origin/main` diselesaikan.

---

### 3. Hasil Audit Ketentuan Teknis

| No | Aspek | Ketentuan | Status | Bukti | Catatan |
|---:|---|---|---|---|---|
| 1 | Teknologi & Infrastruktur | Stack Next.js, GitHub, Vercel, Supabase (DB, Auth, Storage) terintegrasi nyata | **PASS** | `hotspot-khartula/package.json:12-27`, `src/lib/supabase/server.js:1-39`, probe HTTP Vercel `https://petahotpsotindonesia.vercel.app/` (`/` HTTP `200`, `/peta` HTTP `200`, `/berita` HTTP `200`) | Seluruh stack sesuai standar proyek; `next` masih `16.4.0` (lihat `M-04`). |
| 2 | Keamanan Kredensial & Env | Repository bebas kredensial sensitif; service role key tidak terekspos ke client | **PASS** | `git ls-files` hanya melacak `.env.example` (bukan `.env.local`); scan `git grep` menemukan `0` token/JWT/password hardcoded; `SUPABASE_SERVICE_ROLE_KEY` hanya dirujuk pada skrip CLI lokal `scripts/provision-demo-users.mjs:78` | Aman. Tidak ada variabel `NEXT_PUBLIC_` sensitif. |
| 3 | Penyimpanan Data | Seluruh data bisnis tersimpan di Supabase; `localStorage`/array statis bukan penyimpanan utama | **PASS** | `src/lib/normalizers.js:276-913`, `src/lib/actions/laporan.js`, `berita.js`, `wilayah.js`, `users.js`; query live DB: `wilayah` (12), `laporan_karhutla` (12), `penugasan_laporan` (7), `penanganan_log` (7), `laporan_riwayat_status` (30), `berita` (6) | `src/lib/client-cache.js` hanya menyimpan preferensi basemap dan snapshot publik sementara (fallback TTL 10 menit), bukan penyimpanan utama. |
| 4 | Penyimpanan & Privasi Aset | Foto disimpan di Supabase Storage (bukan Base64 DB); bucket privat vs publik sesuai hak akses | **PASS** | `storage.buckets`: `laporan-bukti` (`public: false`, maks 5 MB, JPEG/PNG/WebP), `berita-images` (`public: true`, maks 5 MB); `src/lib/storage.js` + `tests/storage.test.mjs` (`verifyImageMagicBytes` *fail-closed*); tabel `laporan_foto` hanya menyimpan `storage_path` + signed URL via `getLaporanEvidenceSignedUrl` | Bucket lama `media-karhutla` (`public: true`) masih tersisa di remote (lihat `L-01`). |
| 5 | Autentikasi Sesi | Dashboard wajib sesi Supabase Auth valid; anon dilarang masuk dashboard | **PASS** | `src/middleware.js:46-56,124-131`, `src/lib/auth.js:109-121`; probe live lokal (`next start`): `/admin`, `/petugas`, `/pelapor`, `/pelapor/laporan/buat`, `/dashboard`, `/test-db` seluruhnya HTTP `307` ke `/login`; probe Vercel `/admin` HTTP `307` | Terverifikasi pada route publik & redirect anon. |
| 6 | Perlindungan Role Profil | Pengguna tidak dapat mengubah role sendiri lewat form profil biasa | **PASS** | `src/lib/actions/users.js:15-55` (hanya update `full_name` & `wilayah_id`); policy RLS `profiles` `UPDATE`: `((id = auth.uid()) AND (role = private.get_my_role()))` | Terlindungi di server action dan RLS database. |
| 7 | Otorisasi Server & RLS | Otorisasi diperiksa di server dan RLS Postgres sesuai role & kepemilikan data | **FAIL** | Server action memeriksa kepemilikan (`src/lib/actions/laporan.js:615`), **namun** `pg_policies` remote membuktikan policy `laporan_karhutla` (`UPDATE`) dan `penanganan_log` (`INSERT`) masih mengizinkan `petugas` mana pun mengubah/menambah data laporan mana pun (Migration `005` belum diterapkan), serta `fetchLaporanById` berbagi cache scope `"staff"` (`H-01`) | Lihat temuan `C-01` dan `H-01`. |
| 8 | Integritas Relasi & Validasi | FK antartabel, validasi field wajib, luas non-negatif, koordinat valid Indonesia, anti-duplikasi penugasan aktif | **PARTIAL** | `pg_constraint` & `pg_indexes`: seluruh FK, check `estimasi_luas >= 0`, `latitude`/`longitude` range, unique partial index `idx_penugasan_laporan_active_unique` aktif; `src/lib/actions/laporan.js:111-165` memvalidasi input ketat; **namun** mutasi multi-tabel belum dibungkus transaksi/RPC (`H-03`) dan constraint `jenis_kejadian` di DB baru ada pada Migration `005` lokal | Validasi sisi aplikasi sangat kuat, perlu transaksi atomik & penerapan Migration `005`. |
| 9 | Alur Status Bisnis | Transisi status mengikuti state machine per role | **PASS** | `src/lib/workflow.js:75-109` (`ADMIN_ALLOWED_TRANSITIONS`, `PETUGAS_ALLOWED_TRANSITIONS`), `tests/workflow.test.mjs` (`4/4 PASS`), dipanggil pada `src/lib/actions/laporan.js:323,623` | Tercatat kronologis pada `public.laporan_riwayat_status`. |
| 10 | Responsivitas UI | Tampilan responsif desktop & mobile termasuk drawer navigasi & sidebar | **PARTIAL** | Audit kelas responsif Tailwind (`sm:`, `md:`, `lg:`) di `PublicNavbar.jsx` (mobile drawer), `DashboardShell.jsx` (mobile off-canvas sidebar), `LandingExplorer.jsx` (`min-h-[calc(100dvh-110px)]`), `PetaLaporanExplorer.jsx`; **namun** belum diuji visual lintas viewport di browser nyata pada sesi audit ini | Implementasi CSS responsif konsisten, verifikasi visual browser masih perlu dijalankan. |
| 11 | UX Formulir, Loading & Empty State | Validasi pesan error/sukses, anti double-submit, loading skeleton, empty state | **PASS** | `useActionState` `isPending` menonaktifkan tombol submit pada `LoginForm.jsx`, `RegisterForm.jsx`, `CreateLaporanForm.jsx`, `AdminLaporanActionPanel.jsx`, `PetugasPenangananPanel.jsx`; loading skeleton pada `src/app/loading.js`, `admin/loading.js`, `petugas/loading.js`, `pelapor/loading.js`; `EmptyState` & `ErrorBanner` di `SharedUI.jsx` | Lengkap di seluruh modul utama. |
| 12 | Pencarian, Filter & Pagination | Pencarian/filter sesuai data DB; daftar panjang memiliki pagination | **PARTIAL** | `LaporanFilterTable.jsx:10,90-95` memiliki pagination (`PAGE_SIZE = 15`), filter status/wilayah/prioritas/tanggal/pencarian; **namun** `useState(initialStatus)` tidak tersinkronisasi saat query `?status=` berubah via klik `SummaryCardsGrid` (`M-02`), dan filtering masih berbasis maksimum 200 baris yang di-fetch server (`L-02`) | Perlu perbaikan sinkronisasi `initialStatus` pada `LaporanFilterTable.jsx`. |
| 13 | Performa & Caching | Optimisasi pemuatan aset, cache server, dan cache browser untuk kunjungan ulang | **PARTIAL** | `next.config.mjs` (`Cache-Control: public, max-age=31536000, immutable` untuk `/images/*`), `public/sw.js` (HTTP `200`, `must-revalidate`), `src/lib/client-cache.js` (`tests/client-cache.test.mjs PASS`), `src/lib/public-cache.js` (`unstable_cache` + `revalidateTag`), lazy-mount peta di `LandingExplorer.jsx`; **namun** ada isu cache scope `"staff"` (`H-01`) dan auth cache 60 detik (`H-02`) | Lapisan caching browser & aset sudah teruji baik; cache auth/detail perlu diperketat. |
| 14 | Lint, Unit Test & Build | Kode lolos ESLint, automated test, dan production build | **PASS** | `npm run lint` (`0` error/warning), `npm test` (`14/14 PASS`), `npm run build` (`exit 0`, `26/26` route terkompilasi dalam `23.9s`) | Terverifikasi langsung pada sesi audit ini. |
| 15 | Deployment Vercel (Publik) | Aplikasi dapat diakses live di URL Vercel tanpa server lokal | **PARTIAL** | Probe HTTP live `https://petahotpsotindonesia.vercel.app/`: `/` (`200`), `/peta` (`200`), `/berita` (`200`), `/login` (`200`, `hasFastLogin=False`), `/admin` (`307`); **namun** `main` lokal (`a0a6e64` + working tree hero WebP & caching) belum di-push ke `origin/main` sehingga versi produksi belum mencerminkan perubahan lokal terbaru (`M-05`) | URL Vercel aktif dan melayani request, perlu sinkronisasi `git push origin main`. |
| 16 | Pengujian E2E Terautentikasi di Deployment Vercel | Login/logout, CRUD, upload foto, dan uji lintas-role live pada URL Vercel | **NOT VERIFIED** | Kredensial akun uji tidak digunakan untuk login otomatis ke deployment Vercel pada sesi audit *read-only* ini | Memerlukan sesi uji terautentikasi terpisah pada akun non-produksi. |

---

### 4. Hasil Audit Fungsional GIS (Domain Karhutla)

| No | Fitur | Kriteria Pengujian | Status | Bukti | Catatan |
|---:|---|---|---|---|---|
| 1 | Pengelolaan Laporan Karhutla | Tambah laporan (pelapor/admin), verifikasi/ubah status & prioritas (admin), hapus laporan beserta cleanup Storage (admin), spesifikasi jenis/luas/koordinat/lokasi | **PASS** | `src/lib/actions/laporan.js:93-287,292-379,545-578`, `CreateLaporanForm.jsx`, `AdminLaporanActionPanel.jsx` | Lengkap; catatan atomisitas transaksi pada `H-03`. |
| 2 | Peta GIS Interaktif (`Leaflet`) | Peta tampil dengan basemap, clustering, marker dari koordinat valid DB (bukan statis), penolakan koordinat `(0,0)` / luar Indonesia, sinkronisasi ukuran kontainer (`ResizeObserver`) | **PASS** | `src/components/map/HotmapCanvas.jsx:155-205,250-315`, `src/lib/gis.js:49-74`, `tests/gis.test.mjs` (`4/4 PASS`); fix `ResizeObserver` terpasang (`47398f3`) | Marker 100% dari `laporan_karhutla` yang lolos `isValidCoordinatePair`. |
| 3 | Filter Publikasi Marker Publik | Laporan `menunggu_verifikasi` / `ditolak` tidak tampil ke publik `anon` | **PASS** | `pg_policies` pada `public.laporan_karhutla` (`anon` `SELECT`): `status = ANY (ARRAY['terverifikasi','ditangani','selesai'])`; `public-cache.js` memakai anon client yang tunduk pada RLS tersebut | Hanya laporan terverifikasi, ditangani, dan selesai yang tampil ke pengunjung `anon`. |
| 4 | Interaksi Klik Marker & Popup Aman | Klik marker menampilkan informasi laporan sesuai DB dan bebas DOM XSS | **PARTIAL** | `HotmapCanvas.jsx:47-105` membangun popup dengan `document.createElement` & `textContent` (bebas XSS); **namun** klik baris daftar pada titik terklaster memanggil `marker.openPopup()` tanpa `zoomToShowLayer()` (`M-03`) | Perlu perbaikan `zoomToShowLayer()` untuk cluster. |
| 5 | Sinkronisasi Daftar/Filter dan Peta | Beranda (`/`) & Peta (`/peta`, `/admin/peta`, `/petugas/peta`) menggunakan sumber data Supabase yang konsisten; filter menyaring marker & daftar serentak | **PASS** | `LandingExplorer.jsx:103-140` (filter form Hero → `filteredLaporan` → `HotmapMap`), `PetaLaporanExplorer.jsx:60-130,394-402` (filter pencarian/wilayah/status/keparahan/tanggal/scope petugas → `HotmapMap` & tabel tersinkron) | Konsisten pada seluruh 4 halaman peta. |
| 6 | Pencarian & Filter Multi-Dimensi | Filter lokasi/wilayah, status, tingkat keparahan, rentang tanggal, pencarian teks, dan cakupan `Tugas Saya` | **PARTIAL** | Tersedia di `PetaLaporanExplorer.jsx` dan `LaporanFilterTable.jsx`; **namun** bug `initialStatus` pada `LaporanFilterTable.jsx:24` (`M-02`) dan filter berbasis subset 200 baris | Kombinasi filter di client bekerja untuk ≤200 baris. |
| 7 | Pemilih Koordinat (`CoordinatePicker`) | Klik peta, drag marker, deteksi GPS perangkat, auto-flyTo saat memilih wilayah | **PASS** | `src/components/map/CoordinatePickerMap.jsx:72-197`, `CreateLaporanForm.jsx:333` | Validasi batas Indonesia & `(0,0)` diterapkan di client dan server. |
| 8 | Verifikasi & Penugasan Petugas | Admin verifikasi/tolak laporan, menugaskan/mengalihkan/membatalkan petugas; sinkronisasi `petugas_id` otomatis | **PARTIAL** | `src/lib/actions/laporan.js:292-540`, trigger live DB `trg_sync_laporan_petugas` (`private.sync_laporan_petugas_from_penugasan()`), unique partial index aktif; **namun** langkah mutasi belum atomik (`H-03`) | Alur bisnis & trigger sinkronisasi terverifikasi di DB live. |
| 9 | Penanganan Lapangan & Log Petugas | Petugas memperbarui progres (`terverifikasi -> ditangani -> selesai`), mencatat `penanganan_log`, mengunggah foto penanganan | **PARTIAL** | `PetugasPenangananPanel.jsx`, `src/lib/actions/laporan.js:586-751` (otorisasi `laporan.petugas_id === user.id` di server action); **namun** belum diperkuat di RLS remote (`C-01`) dan tidak atomik (`H-03`) | Aman lewat UI/Server Action, tetapi rentan lewat Direct PostgREST sebelum Migration `005` diterapkan. |
| 10 | Pemantauan Status & Riwayat Audit | Seluruh 5 status (`menunggu_verifikasi`, `terverifikasi`, `ditangani`, `selesai`, `ditolak`) tampil konsisten beserta riwayat perubahan | **PASS** | `src/lib/workflow.js`, `src/lib/normalizers.js:10-51`, `LaporanDetailView.jsx`; data live `laporan_riwayat_status` berisi 30 baris kronologis | Status & badge warna konsisten di peta, kartu, tabel, dan detail. |
| 11 | Manajemen Wilayah, Pengguna & Berita | Admin CRUD wilayah (`/admin/wilayah`), kelola role/wilayah pengguna dengan anti self-demotion (`/admin/pengguna`), CRUD berita + upload gambar (`/admin/berita`), filter/pencarian berita publik (`/berita?q=`) | **PASS** | `src/lib/actions/wilayah.js`, `src/lib/actions/users.js:78-83`, `src/lib/actions/berita.js`, `PublicBeritaExplorer.jsx`, `PublicFooter.jsx` | Lengkap dengan validasi server & invalidasi cache. |
| 12 | Data Dummy di Supabase | Minimal 5 laporan berkoordinat berbeda, variasi status/wilayah, penugasan, log, berita, dan **foto bukti** | **PARTIAL** | Live DB `twhclfubwvahcbgohckx`: `wilayah` (12), `laporan_karhutla` (12, 5 status, 12 koordinat Indonesia berbeda), `penugasan_laporan` (7), `penanganan_log` (7), `laporan_riwayat_status` (30), `berita` (6); **namun** `laporan_foto` = `0` baris dan `berita.gambar_url` masih kosong (`M-01`) | Hampir seluruh metrik terlampaui kecuali foto bukti dummy. |
| 13 | Uji Runtime Interaktif Browser (Klik/Upload/Form E2E) | Pengujian klik end-to-end seluruh alur pada browser nyata | **NOT VERIFIED** | Tidak dijalankan pada sesi audit *read-only* ini (agar tidak mengubah data DB live) | Disarankan dijalankan pada skenario QA dengan cleanup otomatis. |

---

### 5. Hasil Audit Role dan Hak Akses

#### Ringkasan Matriks Peran
1. **Pelapor (`/pelapor`, `/pelapor/laporan`, `/pelapor/laporan/buat`, `/pelapor/laporan/[id]`, `/pelapor/profil`)**
   - **Akses route:** Dilindungi `middleware.js` dan `requireRole(["pelapor", "admin"])`.
   - **Kepemilikan data detail:** `src/app/pelapor/laporan/[id]/page.js:26-27` secara eksplisit memverifikasi `role === "admin" || laporan.pelaporId === user.id`, sehingga manipulasi UUID laporan milik pelapor lain melalui URL ditolak (*EmptyState* "Laporan tidak ditemukan").
   - **Batasan mutasi:** Tidak dapat memanggil `verifyAndUpdateLaporanAction`, `assignPetugasAction`, `updatePenangananPetugasAction`, `adminUpdateUserAction`, maupun CRUD wilayah/berita (semua dijaga `requireRole` + RLS).
   - **Celah:** Pada level RLS `INSERT laporan_karhutla` di remote, belum ada *with_check* yang mewajibkan `verified_by IS NULL`, `petugas_id IS NULL`, dan `catatan_verifikasi IS NULL` saat pelapor mengakses PostgREST secara langsung (`C-01`).

2. **Petugas (`/petugas`, `/petugas/laporan`, `/petugas/laporan/[id]`, `/petugas/peta`, `/petugas/profil`)**
   - **Akses route:** Dilindungi `middleware.js` dan `requireRole(["petugas", "admin"])`; diblokir dari `/admin`, `/pelapor`, dan `/test-db`.
   - **Otorisasi penanganan (Server Action):** `src/lib/actions/laporan.js:615` menolak pembaruan jika `role !== "admin" && laporan.petugas_id !== user.id`.
   - **Celah Kritis (Direct API / RLS):** Policy remote `"Petugas dan Admin update laporan"` (`laporan_karhutla`) dan `"Petugas dan Admin tambah log penanganan"` (`penanganan_log`) belum membatasi `petugas_id = auth.uid()` (`C-01`).
   - **Celah Cache Detail:** `fetchLaporanById` memakai scope `"staff"` bersama dengan `admin` (`H-01`), berisiko membocorkan `fotoList` signed URL & `riwayatList` ke petugas yang tidak ditugaskan selama jendela 30 detik.

3. **Admin (`/admin`, `/admin/peta`, `/admin/laporan`, `/admin/laporan/[id]`, `/admin/pengguna`, `/admin/wilayah`, `/admin/berita`, `/admin/pengaturan`, `/test-db`)**
   - **Akses route:** Dilindungi ketat oleh `middleware.js` (`["admin"]`) dan `requireRole(["admin"])` pada setiap page & action.
   - **Anti self-demotion:** `src/lib/actions/users.js:78-83` mencegah admin menurunkan rolenya sendiri.
   - **Fast Login:** Sudah dihapus 100% dari `main` (`0` referensi di `src/`, `.env.example`, `README.md`; verifikasi HTTP `/login` menghasilkan `hasFastLogin=False`).

---

### 6. Hasil Audit Database dan Storage

#### Struktur Tabel & Jumlah Baris Live (`twhclfubwvahcbgohckx`)
| Tabel (`public`) | RLS Aktif | Jumlah Baris | Primary Key / Relasi Utama |
|---|:---:|---:|---|
| `profiles` | Ya | 3 | PK `id` → FK `auth.users(id)` (`CASCADE`), FK `wilayah_id` → `wilayah(id)` |
| `wilayah` | Ya | 12 | PK `id`, UNIQUE `(nama_wilayah, kabupaten_kota)` |
| `laporan_karhutla` | Ya | 12 | PK `id`, FK `pelapor_id`/`petugas_id`/`verified_by` → `profiles(id)`, FK `wilayah_id` → `wilayah(id)` (`RESTRICT`) |
| `laporan_foto` | Ya | 0 | PK `id`, UNIQUE `storage_path`, FK `laporan_id` → `laporan_karhutla(id)` (`CASCADE`), FK `uploaded_by` → `profiles(id)` |
| `penugasan_laporan` | Ya | 7 | PK `id`, unique partial index 1 penugasan aktif per `laporan_id`, FK `laporan_id`/`petugas_id`/`assigned_by` |
| `penanganan_log` | Ya | 7 | PK `id`, FK `laporan_id` → `laporan_karhutla(id)` (`CASCADE`), FK `petugas_id` → `profiles(id)` |
| `laporan_riwayat_status` | Ya | 30 | PK `id`, FK `laporan_id` → `laporan_karhutla(id)` (`CASCADE`), FK `changed_by` → `profiles(id)` |
| `berita` | Ya | 6 | PK `id`, UNIQUE `slug`, FK `author_id` → `profiles(id)` |

#### Trigger & Migration
- **Trigger aktif:** `trg_berita_updated_at`, `trg_laporan_karhutla_updated_at`, dan `trg_sync_laporan_petugas` (`AFTER INSERT/UPDATE` pada `penugasan_laporan` → menyinkronkan `laporan_karhutla.petugas_id`).
- **Migration terpasang di remote (`list_migrations`):** `20261120124604_fase1_5_berita`, `20261120124707_fase1_5_laporan_penugasan_foto_riwayat`, `20261120125003_fase1_5_rls_and_storage_buckets`.
- **Migration lokal belum diterapkan ke remote:** `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` (`C-01`) dan `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` (`L-01`).

#### Storage Buckets (`storage.buckets`)
| Bucket | Publik | Batas Ukuran | MIME Diizinkan | Catatan |
|---|:---:|---:|---|---|
| `laporan-bukti` | Tidak (`false`) | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Akses privat lewat signed URL + RLS pemilik/petugas ditugaskan/admin |
| `berita-images` | Ya (`true`) | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Baca publik, tulis/hapus khusus admin |
| `media-karhutla` | Ya (`true`) | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Bucket legacy yang tidak dipakai kode aktif (`L-01`) |

#### Supabase Advisors (`get_advisors`)
- **Performance Advisors:** `0` temuan (`[]`).
- **Security Advisors:** `1` peringatan (`WARN`) — `auth_leaked_password_protection` (*Leaked Password Protection Disabled*). Panduan remediasi resmi: [Supabase Password Security & Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

---

### 7. Hasil Pengujian Teknis

| Pengujian | Perintah / Metode | Hasil Aktual | Status |
|---|---|---|---|
| **ESLint** | `npm run lint` (di `hotspot-khartula/`) | Exit code `0` (`0` error, `0` warning) | **PASS** |
| **Type Checking** | Berjalan di dalam `next build` (`Running TypeScript ...`) | `Finished TypeScript in 180ms` tanpa error; belum ada skrip `npm run typecheck` terpisah | **PARTIAL** |
| **Unit Testing** | `npm test` (`node --test tests/*.test.mjs`) | `14/14 PASS` (`client-cache`, `gis`, `server-cache`, `storage`, `workflow`) dalam `206.9ms` | **PASS** |
| **Production Build** | `npm run build` (`next build` Turbopack) | Exit code `0`, `Compiled successfully in 23.9s`, `26/26` route & `Proxy (Middleware)` terkompilasi | **PASS** |
| **Probe HTTP Lokal** | `next start -H 127.0.0.1 -p 3097` + `Invoke-WebRequest` | `13/13` route sesuai: `/`, `/peta`, `/berita`, `/login`, `/register` HTTP `200` (`hasFastLogin=False`); `/images/hero-forest.webp` HTTP `200` (`public, max-age=31536000, immutable`); `/sw.js` HTTP `200` (`public, max-age=0, must-revalidate`); `/admin`, `/petugas`, `/pelapor`, `/pelapor/laporan/buat`, `/dashboard`, `/test-db` seluruhnya HTTP `307` | **PASS** |
| **Probe HTTP Deployment Vercel** | `Invoke-WebRequest` ke `https://petahotpsotindonesia.vercel.app` | `/`, `/peta`, `/berita`, `/login` HTTP `200` (`hasFastLogin=False`); `/admin` HTTP `307`. (Catatan: deployment belum menyertakan commit/working tree lokal terbaru) | **PARTIAL** |
| **Pengujian Fungsional E2E Terautentikasi & Responsivitas Browser** | — | Tidak dieksekusi pada sesi audit *read-only* ini | **NOT VERIFIED** |

---

### 8. Temuan dan Rekomendasi

#### CRITICAL

##### `C-01` — Kebijakan RLS Remote `laporan_karhutla` dan `penanganan_log` Terlalu Permisif (Migration `005` Belum Diterapkan)
- **Prioritas:** `CRITICAL` | **Status:** `FAIL`
- **Lokasi:** Database Supabase remote `twhclfubwvahcbgohckx` (`pg_policies`), file lokal `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql`
- **Deskripsi Masalah:** Policy `UPDATE` pada `public.laporan_karhutla` (`"Petugas dan Admin update laporan"`) hanya memeriksa `private.has_role(ARRAY['petugas','admin'])` tanpa membatasi `petugas_id = auth.uid()`. Policy `INSERT` pada `public.penanganan_log` juga mengizinkan `petugas` menyisipkan log ke laporan mana pun. Policy `INSERT` pada `public.laporan_karhutla` belum mengunci `verified_by`, `verified_at`, `petugas_id`, dan `catatan_verifikasi` agar bernilai `NULL`.
- **Dampak:** Pengguna `petugas` atau `pelapor` yang mengakses Supabase REST API (`PostgREST`) langsung dengan JWT miliknya dapat memodifikasi laporan milik petugas lain, menyuntikkan log penanganan palsu, atau mengisi kolom verifikasi saat membuat laporan.
- **Rekomendasi Perbaikan:** Terapkan `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` ke Supabase remote, lalu uji negatif PostgREST untuk memastikan error `42501`.

---

#### HIGH

##### `H-01` — Potensi Kebocoran Cache Detail Laporan Antar Staf (`admin` ↔ `petugas` Tidak Ditugaskan)
- **Prioritas:** `HIGH` | **Status:** `FAIL`
- **Lokasi:** `hotspot-khartula/src/lib/auth.js:91-95`, `hotspot-khartula/src/lib/normalizers.js:452-463`
- **Deskripsi Masalah:** `auth.js` menetapkan `supabase.__sessionScope = "staff"` untuk `admin` dan `petugas`, lalu `fetchLaporanById` menaruh hasil query (termasuk signed URL privat `laporan-bukti`, `penugasanList`, dan `riwayatList`) pada key `laporanDetail:staff:<id>` selama 30 detik.
- **Dampak:** Jika `admin` membuka detail suatu laporan lalu `petugas` yang **tidak ditugaskan** pada laporan tersebut membuka `/petugas/laporan/[id]` dalam 30 detik pada instance server yang sama, `petugas` tersebut bisa menerima signed URL foto privat dan riwayat yang seharusnya disembunyikan RLS.
- **Rekomendasi Perbaikan:** Gunakan scope per pengguna untuk petugas (`role === "admin" ? "admin" : \`petugas:${user.id}\``) sebagai kunci cache `fetchLaporanById`.

##### `H-02` — Auth Cache 60 Detik Menunda Pencabutan Role/Sesi dan Melewati Token Refresh
- **Prioritas:** `HIGH` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/src/lib/server-cache.js:9`, `hotspot-khartula/src/lib/auth.js:50-103`, `hotspot-khartula/src/middleware.js:66-116`
- **Deskripsi Masalah:** Hasil verifikasi `getUser()` dan `profiles.role` di-cache di memori server selama `60_000 ms` berdasarkan fingerprint cookie `sb-*`.
- **Dampak:** Perubahan/pencabutan role oleh admin atau pencabutan sesi di perangkat lain dapat tertunda hingga 60 detik pada instance serverless yang berbeda, dan `middleware.js` tidak menjalankan refresh token `@supabase/ssr` saat cache hit.
- **Rekomendasi Perbaikan:** Kurangi atau hapus caching auth lintas-request di middleware (gunakan `getClaims()` / sesi `@supabase/ssr` langsung) dan batasi cache memori hanya pada data non-otorisasi.

##### `H-03` — Mutasi Multi-Tabel di `src/lib/actions/laporan.js` Tidak Atomik
- **Prioritas:** `HIGH` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/src/lib/actions/laporan.js:214-279,349-373,431-491,658-742`
- **Deskripsi Masalah:** Operasi lintas tabel (`laporan_karhutla`, `penugasan_laporan`, `laporan_foto`, `penanganan_log`, `laporan_riwayat_status`) dieksekusi sebagai serangkaian HTTP request terpisah dari Server Action, dan beberapa error query (`lines 273, 362, 463, 472, 482, 530, 693, 736`) tidak diperiksa.
- **Dampak:** Kegagalan di tengah proses dapat meninggalkan status laporan, penugasan aktif, dan jejak audit tidak konsisten (mis. penugasan lama dibatalkan tetapi penugasan baru gagal tersimpan).
- **Rekomendasi Perbaikan:** Bungkus mutasi multi-tabel kritis (`assignPetugasAction`, `updatePenangananPetugasAction`, `verifyAndUpdateLaporanAction`) ke dalam Postgres RPC (`SECURITY INVOKER`) agar berjalan dalam satu transaksi atomik, dan periksa seluruh error query.

---

#### MEDIUM

##### `M-01` — Data Dummy Belum Memiliki Foto Bukti (`public.laporan_foto` = 0 baris)
- **Prioritas:** `MEDIUM` | **Status:** `PARTIAL`
- **Lokasi:** Database Supabase `public.laporan_foto` (`0` baris), `supabase/seed/003_dummy_data.sql`
- **Deskripsi Masalah:** 12 laporan dummy dan 6 berita dummy sudah tersedia, tetapi tidak ada satu pun file foto bukti pada bucket `laporan-bukti` / baris pada `public.laporan_foto`.
- **Dampak:** Fitur galeri foto, signed URL privat, dan `FotoGalleryLightbox` tidak langsung teruji melalui data dummy bawaan.
- **Rekomendasi Perbaikan:** Unggah minimal 1 foto contoh per laporan uji melalui alur aplikasi atau skrip seeding Storage khusus dev agar `laporan_foto` terisi valid.

##### `M-02` — Filter `LaporanFilterTable` Tidak Tersinkronisasi Saat `initialStatus` Berubah
- **Prioritas:** `MEDIUM` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/src/components/laporan/LaporanFilterTable.jsx:24`
- **Deskripsi Masalah:** `const [statusFilter, setStatusFilter] = useState(initialStatus)` hanya dibaca pada mount awal sehingga klik pada kartu `SummaryCardsGrid` (`?status=...`) tidak memperbarui dropdown filter bila komponen tidak di-remount.
- **Dampak:** Pengguna melihat angka kartu aktif berbeda dengan baris tabel yang ditampilkan.
- **Rekomendasi Perbaikan:** Tambahkan `key={initialStatus}` pada pemanggilan `<LaporanFilterTable />` di halaman `/admin/laporan`, `/petugas/laporan`, dan `/pelapor/laporan`, atau sinkronkan filter langsung dengan URL search params.

##### `M-03` — Klik Baris Daftar Tidak Membuka Popup Marker yang Sedang Terklaster
- **Prioritas:** `MEDIUM` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/src/components/map/HotmapCanvas.jsx:332-341`
- **Deskripsi Masalah:** Efek `focusTarget` memanggil `marker.openPopup()` dengan `setTimeout(..., 350)` tanpa memecah cluster terlebih dahulu.
- **Dampak:** Ketika pengguna mengklik laporan yang berada dalam cluster (mis. 2 laporan berdekatan di Pelalawan), peta terbang ke koordinat tetapi popup marker dapat gagal terbuka.
- **Rekomendasi Perbaikan:** Cek `typeof markersLayerRef.current?.zoomToShowLayer === "function"` lalu panggil `markersLayerRef.current.zoomToShowLayer(marker, () => marker.openPopup())`.

##### `M-04` — Next.js `16.4.0` Memiliki Peringatan Keamanan & Supabase Auth Leaked Password Protection Nonaktif
- **Prioritas:** `MEDIUM` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/package.json:17`, `hotspot-khartula/src/middleware.js`, Supabase Auth settings (`twhclfubwvahcbgohckx`)
- **Deskripsi Masalah:** `next@16.4.0` menampilkan advisori keamanan (branch upgrade `chore/next-upgrade-16.4.6` sudah ada di repo namun belum di-merge ke `main`), `middleware.js` berstatus deprecated menuju `proxy.js`, dan Supabase Security Advisor melaporkan `auth_leaked_password_protection` belum diaktifkan.
- **Dampak:** Risiko keamanan framework dan penerimaan kata sandi bocor saat registrasi akun pelapor.
- **Rekomendasi Perbaikan:** Merge/terapkan upgrade Next.js `16.4.6` (atau terbaru di lini 16.4.x) ke `main`, rencanakan migrasi `middleware.js` → `proxy.js`, dan aktifkan *Leaked Password Protection* di Supabase Dashboard → Authentication → Settings.

##### `M-05` — Perubahan Lokal `main` Belum Di-Commit/Push ke `origin/main` (Vercel Tertinggal)
- **Prioritas:** `MEDIUM` | **Status:** `PARTIAL`
- **Lokasi:** Git branch `main` (`a0a6e64` + 15 file/folder modified/untracked belum di-commit; `origin/main` belum di-push)
- **Deskripsi Masalah:** Merge desain organik-editorial (`a0a6e64`), aset `hero-forest.webp`, dan optimisasi caching (`sw.js`, `client-cache.js`, `public-cache.js`) masih berada di lokal dan belum ter-deploy ke Vercel.
- **Dampak:** Versi live di `https://petahotpsotindonesia.vercel.app/` belum mencerminkan kode `main` lokal terbaru.
- **Rekomendasi Perbaikan:** Setelah menyelesaikan perbaikan prioritas (`C-01`, `H-01`), commit perubahan lokal, push `main` ke `origin/main`, lalu uji ulang live deployment Vercel.

---

#### LOW

##### `L-01` — Artefak Legacy Masih Tersisa di Supabase Remote
- **Prioritas:** `LOW` | **Status:** `PARTIAL`
- **Lokasi:** `storage.buckets` (`media-karhutla`), `pg_policies` (`service_role` policy lama pada `storage.objects`, `profiles`, `wilayah`, `laporan_karhutla`)
- **Deskripsi Masalah:** Migration opsional `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` belum diterapkan ke remote.
- **Dampak:** Tidak berdampak langsung pada fungsi, namun menambah permukaan audit dan kebingungan saat pemeliharaan.
- **Rekomendasi Perbaikan:** Verifikasi bucket `media-karhutla` kosong lalu bersihkan bucket & policy legacy tersebut.

##### `L-02` — Grafik Distribusi Wilayah & Tren 14 Hari Admin Dibatasi Sampel 200 Baris
- **Prioritas:** `LOW` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/src/app/admin/page.js:60,67,70`
- **Deskripsi Masalah:** KPI kartu memakai `fetchExactStatusCounts`, sedangkan grafik wilayah dan tren 14 hari dihitung dari `fetchNormalizedDataset(..., { limit: 200 })`.
- **Dampak:** Saat jumlah total laporan melebihi 200 baris, angka grafik berpotensi berbeda dari total KPI akurat.
- **Rekomendasi Perbaikan:** Hitung agregasi distribusi wilayah dan tren 14 hari langsung melalui query agregat/RPC di Postgres.

##### `L-03` — Belum Ada Skrip `typecheck` Terpisah & Automated E2E Test Permanen
- **Prioritas:** `LOW` | **Status:** `PARTIAL`
- **Lokasi:** `hotspot-khartula/package.json:5-11`, `hotspot-khartula/tests/`
- **Deskripsi Masalah:** Pengujian otomatis saat ini mencakup 14 unit test (`gis`, `workflow`, `storage`, `server-cache`, `client-cache`), tanpa skrip `typecheck` terpisah maupun uji integrasi/E2E terotomatisasi di repository.
- **Dampak:** Regresi lintas-role, form upload, atau tampilan responsif baru terdeteksi saat pengujian manual.
- **Rekomendasi Perbaikan:** Tambahkan skrip pemeriksaan tipe/E2E smoke test permanen pada pipeline pengujian.

---

### 9. Checklist Ketentuan

- [x] Framework Next.js App Router + Tailwind CSS + GitHub + Vercel + Supabase terintegrasi
- [x] Bebas kredensial sensitif di repository Git; `Fast Login` dihapus dari `main`
- [x] Data bisnis utama tersimpan penuh di PostgreSQL Supabase (bukan array statis / `localStorage`)
- [x] Foto disimpan di Supabase Storage (`laporan-bukti` privat, `berita-images` publik), bukan Base64 di DB
- [x] Validasi upload file (MIME, ekstensi, 5 MB, *magic bytes* fail-closed) terverifikasi oleh unit test
- [x] Autentikasi sesi Supabase Auth aktif; seluruh route dashboard redirect `307` saat `anon`
- [x] Role pengguna tidak dapat diubah melalui form profil biasa (server action + RLS)
- [x] **RLS database remote ketat untuk seluruh role & kepemilikan data** *(Diperbaiki & terverifikasi via migration `20261128035501_fase2_rls_hardening_and_indexes` — `C-01`)*
- [x] **Isolasi cache detail laporan per pengguna staf** *(Diperbaiki di `src/lib/auth.js` — `H-01`)*
- [x] **Mutasi multi-tabel laporan bersifat atomik di database** *(Diperbaiki via RPC `assign_petugas_atomic` & `update_penanganan_atomic` pada migration `20261128035425_fase2_atomic_workflow_rpcs` — `H-03`)*
- [x] Peta GIS interaktif (`Leaflet` + clustering) bersumber dari koordinat valid database & responsif (`ResizeObserver`)
- [x] Sinkronisasi filter katalog/daftar dengan marker peta berjalan konsisten
- [x] State machine 5 status karhutla & riwayat audit status terverifikasi
- [x] Lint (`0` error), unit test (`14/14`), dan production build (`26/26` route pada `Next.js 16.4.6`) lulus
- [ ] **Data dummy mencakup foto bukti di `public.laporan_foto`** *(`M-01`)*
- [ ] **Sinkronisasi push `main` terbaru ke Vercel & uji E2E terautentikasi di production URL** *(`M-05`, `NOT VERIFIED`)*

---

### 10. Kesimpulan Akhir

Berdasarkan seluruh bukti audit kode, inspeksi langsung database/RLS/Storage Supabase (`twhclfubwvahcbgohckx`), hasil `lint`/`test`/`build`, serta probe HTTP lokal dan Vercel, aplikasi **HotMap (SIPKARHUTLA)** dinilai:

**MEMENUHI SEBAGIAN KETENTUAN (Siap untuk Demo/Staging; Belum Memenuhi Syarat Rilis Produksi Penuh).**

Alasan objektif:
1. Seluruh fitur operasional inti Web GIS karhutla, desain organik-editorial, penghapusan *Fast Login* pada `main`, validasi input/Storage, sistem caching browser/server, `npm run lint`, `npm test` (`14/14`), dan `npm run build` (`26/26` route) telah berjalan dan terverifikasi **PASS**.
2. Namun, masih terdapat **1 celah keamanan CRITICAL** pada RLS database remote (`C-01`), **3 celah HIGH** terkait isolasi cache detail staf (`H-01`), auth cache 60 detik (`H-02`), dan atomisitas transaksi multi-tabel (`H-03`), serta belum lengkapnya foto bukti pada data dummy (`M-01`) dan pengujian E2E terautentikasi pada deployment Vercel (`M-05`).

---

### 11. Prioritas Tindak Lanjut

1. **[Mendesak — P0]** Terapkan `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` ke Supabase remote (`C-01`) dan uji negatif langsung via PostgREST.
2. **[Mendesak — P0]** Pisahkan scope cache `fetchLaporanById` per `user.id` untuk role `petugas` (`H-01`) serta evaluasi pengurangan/penghapusan auth cache 60 detik (`H-02`).
3. **[Tinggi — P1]** Bungkus mutasi multi-tabel di `src/lib/actions/laporan.js` ke dalam Postgres RPC transaksional (`H-03`).
4. **[Menengah — P2]** Perbaiki sinkronisasi `initialStatus` pada `LaporanFilterTable.jsx` (`M-02`) dan gunakan `zoomToShowLayer()` pada `HotmapCanvas.jsx` (`M-03`).
5. **[Menengah — P2]** Merge upgrade keamanan Next.js (`chore/next-upgrade-16.4.6` → `main`) dan aktifkan *Leaked Password Protection* di Supabase Auth (`M-04`).
6. **[Menengah — P2]** Lengkapi foto bukti pada data dummy pengujian (`M-01`), commit & push `main` ke `origin/main` (`M-05`), lalu jalankan pengujian E2E terautentikasi (3 role + upload foto + responsivitas mobile/desktop) pada URL deployment Vercel.
7. **[Rendah — P3]** Bersihkan artefak legacy `media-karhutla` (`L-01`), pindahkan agregasi analitik dashboard ke query Postgres (`L-02`), dan tambahkan E2E test permanen (`L-03`).

---

### 12. Status Perbaikan Pasca-Audit (2026-11-28)

#### Diperbaiki & Terverifikasi
| ID | Prioritas | Perbaikan | Verifikasi |
|---|---|---|---|
| `C-01` | CRITICAL | Diterapkan migration remote `20261128035501_fase2_rls_hardening_and_indexes`: `ALTER POLICY` untuk `laporan_karhutla` (`INSERT`, `UPDATE`) & `penanganan_log` (`INSERT`), trigger `trg_guard_laporan_update_columns`, constraint `laporan_karhutla_jenis_kejadian_check`, dan index `idx_laporan_karhutla_lat_lng`. | Diverifikasi langsung via `pg_policies` & `get_advisors` (`0` temuan keamanan baru). |
| `H-01` | HIGH | `hotspot-khartula/src/lib/auth.js`: mengubah `__sessionScope` dari `"staff"` bersama menjadi `role === "admin" ? "admin" : \`${role}:${user.id}\``. | `npm run lint` + `npm test` + `npm run build` lulus. |
| `H-02` | HIGH | Menghapus auth cache lintas-request 60 detik di `hotspot-khartula/src/lib/auth.js` dan `hotspot-khartula/src/middleware.js` agar verifikasi sesi & refresh token `@supabase/ssr` selalu aktual (fast-path `0ms` tetap berlaku untuk rute publik & anon). | `npm run lint` + `npm test` + `npm run build` lulus. |
| `H-03` | HIGH | Menambahkan `supabase/migrations/20261128000600_fase2_atomic_workflow_rpcs.sql` dan diterapkan ke remote (`20261128035425_fase2_atomic_workflow_rpcs`) berisi RPC `SECURITY INVOKER` `assign_petugas_atomic` & `update_penanganan_atomic`; `hotspot-khartula/src/lib/actions/laporan.js` kini memanggil RPC tersebut, memeriksa seluruh error query, dan rollback baris laporan bila insert metadata `laporan_foto` gagal. | Migration live sukses; `npm run lint` + `npm test` + `npm run build` lulus. |
| `M-02` | MEDIUM | Menambahkan `key={activeStatus}` pada `<LaporanFilterTable />` di `/admin/laporan`, `/petugas/laporan`, dan `/pelapor/laporan`. | `npm run lint` + `npm run build` lulus. |
| `M-03` | MEDIUM | Memperbarui efek `focusTarget` di `hotspot-khartula/src/components/map/HotmapCanvas.jsx` agar memanggil `zoomToShowLayer(marker, () => marker.openPopup())` saat cluster aktif. | `npm run lint` + `npm run build` lulus. |
| `M-04` (Next.js) | MEDIUM | Upgrade `next` & `eslint-config-next` dari `16.4.0` ke `16.4.6` (`package.json` & `package-lock.json`). | `npx next --version` → `16.4.6`; `npm run lint` (`0`), `npm test` (`14/14`), `npm run build` (`26/26` route dalam `9.9s`). |

#### Masih Terbuka (Tindakan Manual / Di Luar Cakupan Fix Kode)
- **`M-01`:** `public.laporan_foto` masih `0` baris (belum ada foto bukti dummy di bucket `laporan-bukti`).
- **`M-04` (Supabase Auth):** Aktifkan *Leaked Password Protection* secara manual di Supabase Dashboard → Authentication → Settings.
- **`M-05`:** Perubahan lokal di `main` belum di-commit/push ke `origin/main` sehingga belum ter-deploy ke Vercel, dan E2E terautentikasi di URL Vercel belum dijalankan.
- **`L-01`:** Pembersihan bucket legacy `media-karhutla` (`0` objek) & 3 policy `{service_role}` lama pada `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` perlu dijalankan di Supabase SQL Editor (karena berisi `DROP POLICY`/`DROP FUNCTION`).
- **`L-02` & `L-03`:** Agregasi grafik dashboard 200 baris di Postgres serta skrip `typecheck` / E2E test permanen.
