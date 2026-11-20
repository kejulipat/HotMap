# FASE 2 — AUDIT & IMPLEMENTATION PLAN (HOTMAP)

- **Proyek**: HOTMAP (SIPKARHUTLA — Web GIS Operasional Karhutla)
- **Direktori Aplikasi**: `hotspot-khartula/`
- **Dokumen**: Laporan Audit Menyeluruh & Rencana Implementasi Fase 2 (Perencanaan Saja — Tanpa Implementasi)
- **Penyusun (Architect & Planner)**: Gemini Neon CLI
- **Validator Independen Berikutnya**: Gemini Hydrogen
- **Tanggal Penyusunan**: 2026-11-20
- **Supabase Project Ref**: `twhclfubwvahcbgohckx` (`ap-southeast-2`, PostgreSQL `17.11`)
- **Baseline Sebelumnya**: Fase 1.5 — **`LOGIN VERIFIED`** (Validasi Independen Gemini Hydrogen, 2026-11-20)

> **Konvensi Label Bukti Audit**:
> - **`[VERIFIED]`**: Ditemukan dan dibuktikan langsung dari kode sumber repository, pemeriksaan CLI read-only, atau query read-only database Supabase remote.
> - **`[INFERRED]`**: Kesimpulan arsitektural atau risiko yang diturunkan dari kombinasi bukti terverifikasi.
> - **`[UNKNOWN]`**: Belum dapat dipastikan saat audit read-only ini dan memerlukan pemeriksaan lanjutan sebelum/saat eksekusi.

---

## 1. Executive Summary

Berdasarkan audit langsung terhadap seluruh source code `hotspot-khartula/`, file migrasi `supabase/migrations/`, dan kondisi aktual database remote Supabase (`twhclfubwvahcbgohckx`) secara **read-only**, fondasi autentikasi, navigasi berbasis peran, dan struktur 8 tabel database pada Fase 1 & 1.5 berada pada kondisi **stabil dan terverifikasi (`LOGIN VERIFIED`)** `[VERIFIED]`.

Namun, aplikasi **belum memiliki alur operasional inti Fase 2 (Peta GIS & Pelaporan)** dan terdapat beberapa **temuan kritis/blocker arsitektural** yang wajib ditangani secara terurut:

1. **Blocker Data Master Wilayah (`public.wilayah = 0` baris)** `[VERIFIED]`: Kolom `laporan_karhutla.wilayah_id` bersifat `NOT NULL` dengan foreign key ke `public.wilayah(id)`. Karena tabel `wilayah` masih kosong (`0` baris) dan halaman `/admin/wilayah` masih *read-only*, **tidak satu pun laporan karhutla dapat dibuat pada Fase 2** sebelum data master wilayah tersedia (melalui seed resmi dan/atau CRUD Wilayah Admin).
2. **Blocker Konfigurasi Upload Next.js (`bodySizeLimit` default 1 MB)** `[VERIFIED]`: `src/lib/storage.js` dan bucket Supabase (`berita-images`, `laporan-bukti`) mengizinkan unggahan hingga **5 MB**, tetapi `hotspot-khartula/next.config.mjs` belum mengatur `experimental.serverActions.bodySizeLimit`. Unggahan foto 1–5 MB melalui Server Action akan gagal dengan HTTP `413` sebelum kode validasi berjalan `[INFERRED]`.
3. **Peta GIS Masih Placeholder SVG Statis** `[VERIFIED]`: Belum ada library GIS (`leaflet`, `react-leaflet`, `maplibre-gl`) pada `package.json`. Seluruh 4 halaman peta (`/`, `/peta`, `/admin/peta`, `/petugas/peta`) merender siluet SVG 7 pulau Indonesia dengan proyeksi linier `projectToIndonesiaMap()`, tanpa *pan/zoom*, tanpa *basemap*, tanpa *clustering*, dan tanpa *coordinate picker*.
4. **Formulir Pelaporan Masih Placeholder Nonaktif** `[VERIFIED]`: Halaman `/pelapor/laporan/buat` hanya menampilkan input `disabled` tanpa `<form>`, tanpa Server Action (`src/lib/actions/laporan.js` belum ada), tanpa pemilih koordinat peta, dan tanpa unggah foto bukti ke bucket privat `laporan-bukti`.
5. **Celah Keamanan RLS & Dependensi**:
   - Policy `UPDATE` pada `public.laporan_karhutla` (`"Petugas dan Admin update laporan"`) masih terlalu luas (petugas dapat memperbarui laporan yang bukan tugasnya) `[VERIFIED]`.
   - Policy `INSERT` pada `public.penanganan_log` (`"Petugas dan Admin tambah log penanganan"`) juga belum membatasi `petugas` hanya pada laporan yang ditugaskan kepadanya `[VERIFIED]`.
   - Policy `INSERT` pada `public.laporan_karhutla` (`"User login buat laporan"`) belum memaksa `verified_by`, `verified_at`, `petugas_id`, dan `catatan_verifikasi` bernilai `NULL` saat pelapor membuat laporan baru via direct API `[VERIFIED]`.
   - Supabase Security Advisor melaporkan 1 peringatan `WARN`: `auth_leaked_password_protection` (Leaked Password Protection nonaktif) `[VERIFIED]`.
   - `npm audit` mengonfirmasi `next@16.4.0` terdampak **2 kerentanan Critical** (`GHSA-2464-fhr4-w9xw`, `GHSA-673q-mjm6-r5xr`), **1 High** (`GHSA-p3m5-59mp-jv5r` — DoS Server Actions App Router), dan **7 Moderate** (termasuk `GHSA-f3mh-rxg3-f5g2` paparan HttpOnly cookie di Edge runtime), seluruhnya diperbaiki pada patch minor non-breaking `next@16.4.6` `[VERIFIED]`. Juga terdapat peringatan deprecate `middleware.js` → `proxy.js` `[VERIFIED]`.

**Rekomendasi Rencana Fase 2**: Memecah Fase 2 menjadi **6 subfase berurutan (`F2.1` s.d. `F2.6`)** yang dimulai dari pengetatan fondasi & keamanan, penyediaan data master wilayah, pembangunan mesin peta GIS reusable (Leaflet), implementasi pelaporan end-to-end + bukti foto privat, integrasi peta & filter di seluruh 4 portal, hingga pengujian integrasi & validasi independen Gemini Hydrogen. **PostGIS belum diaktifkan pada Fase 2** berdasarkan justifikasi teknis bahwa kebutuhan spasial Fase 2 masih berbasis titik (`double precision` + `CHECK` + B-tree index).

---

## 2. Kondisi Aktual Proyek

### 2.1. Status Repository & Lingkungan
- **Branch Git aktif**: `fix/pre-phase-2-readiness` (ahead 1 commit dari `origin/fix/pre-phase-2-readiness`; file untracked: `docs/reports/FASE_1_5_LOGIN_RBAC_VALIDATION_REPORT.md`) `[VERIFIED]`.
- **Stack Aplikasi (`hotspot-khartula/package.json`)** `[VERIFIED]`:
  - `next`: `16.4.0` (App Router, Turbopack, `reactCompiler: true` pada `next.config.mjs`)
  - `react` & `react-dom`: `19.3.0`
  - Bahasa: JavaScript / JSX (`jsconfig.json` dengan path alias `@/*` → `./src/*`; tidak ada `tsconfig.json`)
  - Styling: Tailwind CSS `^4` (`@tailwindcss/postcss: ^4.3.5`)
  - Backend SDK: `@supabase/ssr` `^0.12.7`, `@supabase/supabase-js` `^2.119.0`
  - Linter: `eslint` `^9` + `eslint-config-next` `16.4.0` (`npm run lint` lulus `0` error/warning saat audit ini) `[VERIFIED]`.
- **Variabel Environment (`hotspot-khartula/.env.local`)** `[VERIFIED]`:
  - Key terdeteksi (tanpa membaca nilai): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ENABLE_FAST_LOGIN`, `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_PETUGAS_EMAIL`, `DEMO_PETUGAS_PASSWORD`, `DEMO_PELAPOR_EMAIL`, `DEMO_PELAPOR_PASSWORD`, `DATABASE_URL`.
  - `SUPABASE_SERVICE_ROLE_KEY` tidak tersimpan di `.env.local` dan `.env*` dikecualikan di `.gitignore` `[VERIFIED]`.

### 2.2. Kondisi Data Remote Supabase (`twhclfubwvahcbgohckx`)
Hasil query read-only terhadap 8 tabel `public` `[VERIFIED]`:

| Tabel | RLS Aktif | Jumlah Baris | Catatan Aktual |
|---|---|---|---|
| `public.profiles` | Ya | **3** | 3 akun demo (`admin`, `petugas`, `pelapor`); seluruh `full_name = 'Pengguna Baru'`, `wilayah_id = NULL`. |
| `public.wilayah` | Ya | **0** | Kosong — **blocker langsung** untuk `INSERT` `laporan_karhutla` (`wilayah_id NOT NULL`). |
| `public.laporan_karhutla` | Ya | **0** | Kosong. |
| `public.penanganan_log` | Ya | **0** | Kosong. |
| `public.berita` | Ya | **0** | Kosong (belum teruji tampilan artikel nyata di publik/admin). |
| `public.laporan_foto` | Ya | **0** | Kosong. |
| `public.penugasan_laporan` | Ya | **0** | Kosong. |
| `public.laporan_riwayat_status` | Ya | **0** | Kosong. |

---

## 3. Hasil Audit Arsitektur

### 3.1. Struktur Direktori & Pemetaan Route (`hotspot-khartula/src/app/`)
Seluruh **26 route** di `src/app/` terverifikasi ada tanpa dead link pada menu navigasi (`PublicNavbar.jsx`, `PublicFooter.jsx`, `DashboardShell.jsx`) `[VERIFIED]`:

| Grup | Route | File | Status Aktual |
|---|---|---|---|
| Publik | `/` | `src/app/page.js` | Selesai (fondasi read-only + peta SVG placeholder) |
| Publik | `/peta` | `src/app/peta/page.js` | Placeholder peta SVG + tabel tanpa filter |
| Publik | `/berita` | `src/app/berita/page.js` | Selesai (read-only list published, tanpa filter/search) |
| Publik | `/berita/[id]` | `src/app/berita/[id]/page.js` | Selesai (mendukung UUID & slug) |
| Auth | `/login` | `src/app/login/page.js` | Selesai (`LOGIN VERIFIED`: Normal + Fast Login) |
| Auth | `/register` | `src/app/register/page.js` | Selesai (trigger DB otomatis `role = 'pelapor'`) |
| Auth | `/dashboard` | `src/app/dashboard/page.js` | Selesai (redirect otomatis per role) |
| Diagnostik | `/test-db` | `src/app/test-db/page.jsx` | Selesai (Admin-only, cek 8 tabel `public`) |
| Admin | `/admin` | `src/app/admin/page.js` | Selesai (read-only KPI & 8 laporan terbaru) |
| Admin | `/admin/peta` | `src/app/admin/peta/page.js` | Placeholder peta SVG + tabel tanpa filter |
| Admin | `/admin/laporan` | `src/app/admin/laporan/page.js` | Parsial (read-only + filter `?status=`, tanpa pagination/search) |
| Admin | `/admin/laporan/[id]` | `src/app/admin/laporan/[id]/page.js` | Parsial (read-only 5 relasi + kotak placeholder Fase 3) |
| Admin | `/admin/pengguna` | `src/app/admin/pengguna/page.js` | Read-only daftar `profiles` (ubah role di Fase 4) |
| Admin | `/admin/wilayah` | `src/app/admin/wilayah/page.js` | Read-only daftar `wilayah` (belum ada CRUD) |
| Admin | `/admin/berita` | `src/app/admin/berita/page.js` | Selesai (CRUD penuh + upload `berita-images`) |
| Admin | `/admin/pengaturan` | `src/app/admin/pengaturan/page.js` | Selesai (read-only status sistem & Fast Login) |
| Petugas | `/petugas` | `src/app/petugas/page.js` | Parsial (read-only global, belum dipisah "Tugas Saya") |
| Petugas | `/petugas/laporan` | `src/app/petugas/laporan/page.js` | Parsial (read-only global + filter `?status=`) |
| Petugas | `/petugas/laporan/[id]` | `src/app/petugas/laporan/[id]/page.js` | Parsial (read-only 5 relasi + kotak placeholder Fase 3) |
| Petugas | `/petugas/peta` | `src/app/petugas/peta/page.js` | Placeholder peta SVG + tabel tanpa filter |
| Petugas | `/petugas/profil` | `src/app/petugas/profil/page.js` | Read-only `ProfileSummaryView` |
| Pelapor | `/pelapor` | `src/app/pelapor/page.js` | Selesai (read-only KPI & 5 laporan milik sendiri) |
| Pelapor | `/pelapor/laporan` | `src/app/pelapor/laporan/page.js` | Selesai (read-only laporan sendiri + filter `?status=`) |
| Pelapor | `/pelapor/laporan/buat` | `src/app/pelapor/laporan/buat/page.js` | **Placeholder total** (semua input `disabled`, belum ada submit) |
| Pelapor | `/pelapor/laporan/[id]` | `src/app/pelapor/laporan/[id]/page.js` | Selesai (read-only + verifikasi kepemilikan server) |
| Pelapor | `/pelapor/profil` | `src/app/pelapor/profil/page.js` | Read-only `ProfileSummaryView` |

### 3.2. Evaluasi Lapisan Arsitektur
- **Komponen UI & Layout** `[VERIFIED]`:
  - Terstruktur baik pada `src/components/layout/` (`PublicNavbar`, `PublicFooter`, `PublicShell`, `DashboardShell`) dan `src/components/ui/` (`SharedUI`, `ConfirmDialog`, `ProfileSummaryView`).
  - Navigasi desktop & mobile berfungsi dengan active state (`usePathname`) dan konfirmasi logout.
  - Inkonsistensi minor: `src/app/pelapor/layout.js` dan `src/app/petugas/layout.js` mengunci prop `role="pelapor"`/`role="petugas"` pada `DashboardShell`, sehingga jika Admin mengunjungi `/pelapor` atau `/petugas` (diizinkan RBAC), sidebar tidak menampilkan tautan balik ke `/admin` `[VERIFIED]`.
  - Inkonsistensi minor: `src/app/globals.css` mendefinisikan dark mode media query (`@media (prefers-color-scheme: dark)`), padahal seluruh UI di-styling light mode eksplisit (`bg-[#F6F7F3]`), berpotensi memunculkan kontras aneh pada elemen overscroll/native input di OS dark mode `[INFERRED]`.
  - Inkonsistensi minor: Metadata root `src/app/layout.js` bertitel `"SIPKARHUTLA | Sistem Informasi Karhutla"` sementara halaman lain menggunakan `"HotMap"` `[VERIFIED]`.
- **API Routes, Server Actions, dan Middleware** `[VERIFIED]`:
  - Tidak ada `src/app/api/` (0 Route Handler). Seluruh mutasi menggunakan Server Actions (`src/lib/actions/auth.js`, `src/lib/actions/berita.js`).
  - `src/middleware.js` memakai `supabase.auth.getUser()` (server-verified), lookup `.maybeSingle()` ke `profiles`, dan `redirectWithCookies()` agar refresh cookie tidak hilang. Memunculkan peringatan deprecate Next.js 16 menuju `proxy.js` `[VERIFIED]`.
  - **Masalah Arsitektural Kritis**: `hotspot-khartula/next.config.mjs` hanya berisi `{ reactCompiler: true }`. Tidak ada `experimental.serverActions.bodySizeLimit` (default Next.js **1 MB**). Karena `src/lib/storage.js` dan Supabase Storage mendukung file hingga **5 MB** per gambar (dan Fase 2 akan mengunggah multi-foto laporan), pengiriman file via Server Action akan terpotong oleh batas 1 MB `[VERIFIED]` / gagal HTTP 413 `[INFERRED]`.
- **State Management & Data Fetching** `[VERIFIED]`:
  - Mayoritas halaman adalah Server Components (`export const dynamic = "force-dynamic"`), mengambil data via `src/lib/normalizers.js` (`fetchNormalizedDataset`, `fetchLaporanById`, `fetchBeritaList`, `fetchBeritaById`).
  - `src/lib/supabase/client.js` tersedia namun **belum digunakan di mana pun** pada kode saat ini `[VERIFIED]`.
  - `fetchNormalizedDataset()` membatasi query ke `limit: 100` atau `limit: 200` tanpa pagination dan melakukan filter status di memori JS; juga belum mengambil kolom `waktu_kejadian` dari `laporan_karhutla` `[VERIFIED]`.
- **Loading, Empty, & Error States** `[VERIFIED]`:
  - Tersedia `src/app/loading.js`, `src/app/not-found.js`, serta `EmptyState`, `ErrorBanner`, `LoadingSpinner` di `SharedUI.jsx`.
  - **Belum tersedia route error boundaries** (`src/app/error.js`, `src/app/admin/error.js`, `src/app/petugas/error.js`, `src/app/pelapor/error.js`) untuk menangkap runtime error tidak terduga (mis. kegagalan koneksi jaringan atau error render peta client) `[VERIFIED]`.
- **Pengujian Otomatis** `[VERIFIED]`:
  - **Belum tersedia test suite** (tidak ada Vitest, Jest, Playwright, atau folder `tests/`/`__tests__/`). Pengujian Fase 1.5 dilakukan lewat skrip ad-hoc & verifikasi manual/CDP oleh Hydrogen.

---

## 4. Hasil Audit Setiap Modul (12 Modul)

| # | Modul | Kondisi Saat Ini | Sudah Berfungsi `[VERIFIED]` | Masih Placeholder `[VERIFIED]` | Belum Tersedia `[VERIFIED]` | Ketergantungan | Risiko Teknis | Rekomendasi Pekerjaan |
|---|---|---|---|---|---|---|---|---|
| 1 | **Dashboard Admin** (`/admin`) | Read-only KPI & ringkasan | Ringkasan jumlah laporan per status, total pengguna, total wilayah, total berita (via `count: exact`), 8 laporan terbaru | Tidak ada placeholder eksplisit | Grafik tren/analitik, laporan butuh verifikasi prioritas, metrik SLA | `laporan_karhutla`, `profiles`, `wilayah`, `berita` | Angka KPI saat ini `0` karena data kosong; `limit: 100` pada `fetchNormalizedDataset` membuat hitungan status meleset jika laporan > 100 `[INFERRED]` | Fase 2: pastikan `SummaryCardsGrid` tetap akurat; Fase 4: agregasi SQL/RPC & grafik analitik |
| 2 | **Dashboard Petugas** (`/petugas`) | Read-only operasional global | Menampilkan KPI laporan, tautan peta, 8 laporan terbaru | Tidak ada | Pemisahan "Tugas Saya (`petugas_id = auth.uid()`)" vs laporan umum, aksi cepat update | `laporan_karhutla`, `penugasan_laporan` | Petugas melihat semua laporan tanpa indikator mana yang ditugaskan kepadanya `[VERIFIED]` | Fase 2: tambahkan indikator/filter penugasan di peta & daftar; Fase 3: panel aksi tugas aktif |
| 3 | **Dashboard Pelapor** (`/pelapor`) | Read-only laporan milik sendiri | Filter ketat `pelaporId: user.id`, KPI milik sendiri, 5 laporan terbaru, tombol `+ Buat Laporan` | Tidak ada (tautan mengarah ke placeholder `/pelapor/laporan/buat`) | Notifikasi progres, filter lanjutan | Modul Pelaporan (`F2.4`) | Tidak dapat menghasilkan data baru selama form buat laporan belum aktif | Fase 2: aktifkan alur end-to-end dari tombol `+ Buat Laporan` → tampil otomatis di dashboard |
| 4 | **Peta GIS & Visualisasi** (`/`, `/peta`, `/admin/peta`, `/petugas/peta`) | **Placeholder SVG** | Filter client-side (tanggal/wilayah/status) & panel detail di `/` (`LandingExplorer`); validasi `isValidLatLng`; label disclaimer bukan hotspot satelit | Kanvas SVG Indonesia + `projectToIndonesiaMap()` di seluruh 4 halaman peta | Peta interaktif Leaflet, basemap, zoom/pan, clustering, search lokasi, filter di `/peta`, `/admin/peta`, `/petugas/peta`, coordinate picker | Modul Wilayah (`center_lat/lng`), Modul Pelaporan | Proyeksi SVG tidak akurat secara geografis; marker di koordinat berdekatan saling menumpuk; kinerja memburuk tanpa clustering `[INFERRED]` | **Prioritas utama Fase 2 (`F2.3` & `F2.5`)**: ganti SVG dengan mesin Leaflet reusable + filter terintegrasi |
| 5 | **Manajemen Laporan Karhutla** (`/*/laporan`, `/*/laporan/[id]`, `/pelapor/laporan/buat`) | Read-only list & detail; Form buat masih nonaktif | Daftar per role + filter `?status=`; detail laporan memuat 5 relasi; isolasi pemilik di `/pelapor/laporan/[id]` | `/pelapor/laporan/buat` (input `disabled`); kotak info Fase 3 di `/admin/laporan/[id]` & `/petugas/laporan/[id]` | `src/lib/actions/laporan.js`, form kirim laporan lengkap + map picker + multi-foto, pencarian & pagination tabel, edit/hapus admin | `wilayah` (FK wajib), Storage `laporan-bukti`, Mesin Peta (`CoordinatePickerMap`) | Blocker `wilayah = 0`; `waktu_kejadian` tidak diambil normalizer; batas 1 MB Server Action memblokir upload foto | **Prioritas utama Fase 2 (`F2.4`)**: implementasi penuh buat laporan + bukti foto; Verifikasi/Edit/Hapus di Fase 3 |
| 6 | **Penugasan Laporan kepada Petugas** | Skema & tampilan baca saja | Tabel `penugasan_laporan`, unique active index, trigger sync `petugas_id`, kartu read-only di `LaporanDetailView` | Kotak info Fase 3 pada `/admin/laporan/[id]` | UI & Server Action penugasan/reassignment/pembatalan oleh Admin, penerimaan tugas oleh Petugas | Modul Laporan, Daftar Petugas (`profiles.role = 'petugas'`) | Policy `UPDATE` `laporan_karhutla` & `INSERT` `penanganan_log` belum mengunci `petugas_id` `[VERIFIED]` | Fase 2 (`F2.1`): kunci RLS terlebih dahulu; Fase 3: bangun UI & Server Actions penugasan |
| 7 | **Penanganan & Pembaruan Status Laporan** | Skema & tampilan baca saja | Enum `report_status` 5 tahap, badge status terstandar | Kotak info Fase 3 pada `/petugas/laporan/[id]` | Aksi verifikasi/tolak (Admin), update `ditangani`/`selesai` + log lapangan + foto (Petugas), validasi state machine transisi status | Modul Laporan & Penugasan | Tanpa state machine server-side & RLS ketat, status dapat meloncat tidak valid `[INFERRED]` | Fase 2 (`F2.1`): perketat RLS; Fase 3: implementasi penuh workflow verifikasi & penanganan |
| 8 | **Riwayat Penanganan Laporan** | Skema & tampilan baca saja | Tabel `laporan_riwayat_status` & `penanganan_log` + kartu read-only di `LaporanDetailView` | Tidak ada placeholder eksplisit | Pencatatan otomatis entri awal `menunggu_verifikasi` saat laporan dibuat & setiap transisi status | Modul Pelaporan (`F2.4`) & Fase 3 | Tanpa penulisan riwayat awal saat create laporan, timeline riwayat akan kosong pada Fase 2 `[INFERRED]` | Fase 2 (`F2.4`): wajib catat entri awal di `laporan_riwayat_status` saat laporan dibuat; transisi lanjutan di Fase 3 |
| 9 | **Dokumentasi Foto & Bukti Lapangan** | Infrastruktur Storage & read view siap | Bucket privat `laporan-bukti`, tabel `laporan_foto`, RLS Storage, `uploadLaporanEvidence`, `verifyImageMagicBytes`, signed URL 1 jam di `LaporanDetailView` | Tidak ada UI upload | Multi-foto upload pada form buat laporan (`bukti_awal`), galeri `<img>` + lightbox modal, hapus foto, upload bukti penanganan/selesai (Fase 3) | `next.config.mjs` `bodySizeLimit`, `laporan_foto`, Storage `laporan-bukti` | `verifyImageMagicBytes` fail-open jika `.slice` tidak ada; `backgroundImage` CSS tanpa `alt`/lightbox; potensi orphan file jika DB gagal tanpa rollback | Fase 2 (`F2.1` & `F2.4`): perbaiki fail-closed + `bodySizeLimit` + integrasi upload multi-foto + rollback atomik + galeri `<img>`/lightbox |
| 10 | **Manajemen Wilayah** (`/admin/wilayah`) | Read-only & tabel kosong | Menampilkan tabel `nama_wilayah`, `kabupaten_kota`, `center_lat`, `center_lng`, `created_at` | Teks *"Operasi tambah/ubah wilayah akan diaktifkan pada Fase 4"* | Seed data wilayah Indonesia, Server Actions CRUD wilayah (tambah/ubah/hapus dengan proteksi FK) | Dibutuhkan langsung oleh Form Pelaporan (`wilayah_id NOT NULL`) & Peta (`center_lat/lng`) | **CRITICAL BLOCKER FASE 2**: `public.wilayah` kosong (`0` baris), membuat form pelaporan mustahil dipakai `[VERIFIED]` | **Tarik ke awal Fase 2 (`F2.2`)**: seed wilayah + CRUD Admin Wilayah minimal |
| 11 | **Manajemen Berita & Informasi** (`/berita`, `/berita/[id]`, `/admin/berita`) | **Fungsional penuh (CRUD + Storage)** | Create/Update/Delete berita + upload/replace/delete `berita-images`, filter status admin, halaman publik & detail | Tidak ada | Konten aktual (0 baris), filter kategori/search di `/berita`, pratinjau/hapus gambar sampul saat edit, canonical link pakai `slug` bukan UUID | `berita`, `berita-images`, `next.config.mjs` `bodySizeLimit` | Upload gambar berita > 1 MB akan gagal karena `bodySizeLimit` default Next.js `[INFERRED]`; belum diuji E2E dengan artikel nyata | Fase 2 (`F2.1`): naikkan `bodySizeLimit` & jalankan uji E2E CRUD Berita live; polish opsional (`/berita/[slug]`, filter) di Fase 2/4 |
| 12 | **Profil & Pengaturan Pengguna** (`/admin/pengguna`, `/admin/pengaturan`, `/petugas/profil`, `/pelapor/profil`) | Read-only | Tampilan `profiles` untuk Admin, `ProfileSummaryView` untuk Petugas/Pelapor, status sistem & Fast Login di `/admin/pengaturan` | Teks *"Pengelolaan ubah role akan dilengkapi pada Fase 4"* | Form ubah `full_name` & `wilayah_id` profil sendiri, manajemen ubah role & wilayah petugas oleh Admin | `profiles`, `wilayah` | Seluruh 3 akun demo masih bernama `"Pengguna Baru"` `[VERIFIED]` | Fase 2: opsional update nama akun demo; edit profil & manajemen role penuh di Fase 4 |

---

## 5. Hasil Audit GIS

### 5.1. Kondisi GIS Aktual `[VERIFIED]`
- **Library Peta**: **Tidak ada** (`package.json` tidak memuat library GIS apa pun).
- **Rendering Saat Ini**:
  - `LandingExplorer.jsx` (`/`): Kanvas SVG 7 pulau Indonesia (`viewBox="0 0 1000 450"`) + pin HTML absolut menggunakan `projectToIndonesiaMap(lat, lng)` (`minLng: 94.5..141.5`, `minLat: -11.5..6.5`, di-clamp ke `x: 6..88%`, `y: 12..86%`). Memiliki slot komentar `#leaflet-map-slot` siap diganti.
  - `MapOverviewBox` (`SharedUI.jsx`, dipakai di `/peta`, `/admin/peta`, `/petugas/peta`): Duplikasi SVG yang sama, tanpa panel detail, tanpa filter, dan tanpa legenda warna status.
- **Struktur & Validasi Koordinat**:
  - Database: `wilayah.center_lat/lng` dan `laporan_karhutla.latitude/longitude` bertipe `double precision` (`float8`) dengan `CHECK (-90..90)` dan `CHECK (-180..180)`.
  - Frontend: `parseCoord()` & `isValidLatLng()` di `src/lib/normalizers.js` memvalidasi rentang global `-90..90` & `-180..180`.
  - **Gap Validasi**: Belum ada pengecekan rentang geografis Indonesia (`lat: -11.5..6.5`, `lng: 94.5..142.0`) atau pencegahan titik sentinel `(0, 0)` pada input pelaporan `[VERIFIED]`.
- **Diferensiasi Marker & Kepatuhan Aturan GIS**:
  - Marker dibedakan berdasarkan 5 status (`STATUS_META`: amber, biru, merah-oranye, hijau, abu-abu).
  - Menyertakan label eksplisit *"Titik menunjukkan laporan warga, bukan deteksi hotspot satelit"* (sesuai `AGENTS.md`) `[VERIFIED]`.
  - Data hotspot satelit (NASA FIRMS / VIIRS / MODIS / Sipongi) **tidak tersedia** dan tidak dicampur dengan laporan warga `[VERIFIED]`.
- **Fitur GIS yang Belum Tersedia** `[VERIFIED]`:
  1. Tile basemap interaktif (OpenStreetMap, Citra Satelit Esri World Imagery, Topografi OpenTopoMap) & kontrol zoom/pan/reset view.
  2. *Coordinate Picker* interaktif pada form buat laporan (klik peta, geser marker, tombol GPS *Geolocation API*, sinkronisasi input manual lat/lng, auto-flyTo saat memilih `wilayah`).
  3. *Marker Clustering* saat titik laporan meningkat (kritis untuk kinerja & keterbacaan pada koordinat rapat).
  4. Filter peta terintegrasi (wilayah, status, rentang tanggal, jenis kejadian, tingkat keparahan, pencarian kata kunci) pada `/peta`, `/admin/peta`, `/petugas/peta`.
  5. Pencarian lokasi (berdasarkan master `wilayah` dan opsional geocoding/koordinat).
  6. Layer batas administrasi wilayah (GeoJSON provinsi/kabupaten belum tersedia di repo maupun DB).
  7. Legenda status interaktif pada kanvas peta & tautan navigasi koordinat eksternal (mis. Google Maps/OSM untuk petugas lapangan).
  8. Strategi skalabilitas query: `fetchNormalizedDataset` saat ini memuat maksimal `100–200` baris secara SSR tanpa filter `bbox` atau filter server-side `[VERIFIED]`.

### 5.2. Evaluasi Library Peta (Justifikasi Teknis — Belum Diinstal)
Karena aplikasi menggunakan **Next.js 16.4 + React 19.3 + React Compiler**, pemilihan library GIS harus mempertimbangkan kompatibilitas SSR, React 19, lisensi gratis tanpa API key wajib, dan ukuran bundle:

| Opsi | Kelebihan | Kekurangan / Risiko | Rekomendasi |
|---|---|---|---|
| **Opsi A (Disarankan): Vanilla `leaflet` + `leaflet.markercluster` (dibungkus komponen React 19 + `next/dynamic(..., { ssr: false })`)** | Bebas konflik peer-dependency React 19 / React Compiler; sangat ringan (~45 KB gzipped); dukungan OSM/Esri Satellite gratis tanpa token; ekosistem clustering sangat matang; mudah dikontrol imperatif (`flyTo`, draggable marker, fitBounds). | Menulis lifecycle `useEffect` mount/cleanup `L.map()` sendiri (~150 baris reusable). | **Paling aman & stabil untuk Next.js 16 + React 19** |
| **Opsi B: `react-leaflet` v5 + `leaflet`** | API deklaratif React (`<MapContainer>`, `<Marker>`). | Perlu verifikasi kompatibilitas `react-leaflet@5` dengan `reactCompiler: true` & plugin clustering (`react-leaflet-cluster` sering tertinggal dukungan React 19) `[INFERRED]`. | Alternatif jika clustering kompatibel diuji terlebih dahulu |
| **Opsi C: `maplibre-gl`** | Rendering WebGL vector tiles sangat cepat untuk >10.000 titik. | Bundle jauh lebih besar (~250+ KB), setup style/sprite vector tile lebih kompleks, overkill untuk skala ratusan–ribuan titik laporan warga Fase 2 `[INFERRED]`. | Tidak diperlukan di Fase 2; pertimbangkan hanya jika data melampaui puluhan ribu titik/poligon |

### 5.3. Evaluasi PostGIS (Justifikasi Teknis — Tidak Diaktifkan di Fase 2)
- **Status Remote**: Ekstensi `postgis` (`3.3.7`) tersedia pada `pg_available_extensions` (`installed_version: null`), **tidak aktif** `[VERIFIED]`.
- **Keputusan Rekomendasi**: **JANGAN mengaktifkan PostGIS pada Fase 2.**
  - **Alasan 1 (Kesesuaian Kebutuhan)**: Seluruh kebutuhan Fase 2 adalah penyimpanan titik (`latitude`, `longitude`), filter berdasarkan `wilayah_id`/status/waktu, dan tampilan/clustering di client Leaflet. Tidak ada kebutuhan query polygon-in-point (`ST_Contains`), pencarian radius terdekat (`ST_DWithin`), atau input poligon luas terbakar (`geometry(Polygon, 4326)`).
  - **Alasan 2 (Kinerja & Kompleksitas)**: Untuk query bounding-box peta (jika dibutuhkan nanti), composite B-tree index pada `(latitude, longitude)` sudah sangat efisien di PostgreSQL untuk puluhan ribu titik tanpa overhead PostGIS.
  - **Alasan 3 (Kebersihan Keamanan Supabase)**: Mengaktifkan PostGIS membuat tabel sistem `spatial_ref_sys` yang perlu penanganan schema `extensions` agar tidak memicu temuan RLS pada Supabase Security Advisor `[INFERRED]`.
  - **Kapan Evaluasi Ulang**: Pada **Fase 4+** jika pengguna memerlukan deteksi otomatis wilayah dari titik koordinat (poligon batas administrasi server-side), perhitungan jarak petugas terdekat, atau pemetaan poligon area terbakar.

---

## 6. Hasil Audit Supabase dan Database

### 6.1. Skema, Relasi, Constraint, & Index `[VERIFIED]`
- **8 Tabel `public` aktif**: `wilayah`, `profiles`, `laporan_karhutla`, `penanganan_log`, `berita`, `laporan_foto`, `penugasan_laporan`, `laporan_riwayat_status`.
- **PK & FK**: Seluruh tabel menggunakan `uuid PRIMARY KEY` (`gen_random_uuid()` kecuali `profiles.id` → `auth.users(id)`). Relasi FK lengkap (`laporan_karhutla` terhubung ke `wilayah`, `profiles` via `pelapor_id`, `petugas_id`, `verified_by`; anak tabel `laporan_foto`, `penugasan_laporan`, `laporan_riwayat_status`, `penanganan_log` cascade ke `laporan_karhutla`).
- **Index**: 29 index aktif (termasuk seluruh FK index, composite `idx_laporan_karhutla_wilayah_status`, `idx_laporan_karhutla_status_created_at`, `idx_berita_published_feed`, dan partial unique index `idx_penugasan_laporan_active_unique`).
  - *Performance Advisor*: 6 catatan `INFO` (`unused_index`) — wajar karena tabel masih 0 baris; **0 peringatan `auth_rls_initplan`** dan **0 `multiple_permissive_policies`** `[VERIFIED]`.
- **Trigger & Functions**:
  - `auth.users` → `on_auth_user_created` (`public.handle_new_user()`, `SECURITY DEFINER`, `SET search_path = ''`, selalu set `role = 'pelapor'`).
  - `public.berita` & `public.laporan_karhutla` → `set_updated_at()`.
  - `public.penugasan_laporan` → `trg_sync_laporan_petugas` (`private.sync_laporan_petugas_from_penugasan()`).
  - Helper RLS: `private.get_my_role()` dan `private.has_role(text[])` (`SECURITY DEFINER`, `SET search_path = ''`).
  - Artefak legacy: `public.get_my_role()` masih ada di remote (`SECURITY INVOKER`, 0 dependensi, hak `EXECUTE` sudah dicabut dari `anon`/`authenticated`) `[VERIFIED]`.

### 6.2. Konsistensi Migrasi Lokal vs Remote `[VERIFIED]`
| Lokal (`supabase/migrations/`) | Remote (`supabase_migrations`) | Status |
|---|---|---|
| `20261118000100_fase1_5_berita.sql` | `20261120124604` (`fase1_5_berita`) | Isi setara, **timestamp berbeda** |
| `20261118000200_fase1_5_laporan_penugasan_foto_riwayat.sql` | `20261120124707` (`fase1_5_laporan_penugasan_foto_riwayat`) | Isi setara (kecuali `DROP FUNCTION public.get_my_role()` & 3 policy `{service_role}` masih tersisa di remote), **timestamp berbeda** |
| `20261118000300_fase1_5_storage_buckets_rls.sql` | `20261120125003` (`fase1_5_rls_and_storage_buckets`) | Bucket aktif; bucket kosong `media-karhutla` & 3 policy `{service_role}` Storage masih tersisa di remote, **timestamp berbeda** |
| `20261120000400_fase1_5_cleanup_optional.sql` | *(Belum diterapkan)* | Menunggu persetujuan pengguna |

> **Peringatan Operasional**: Dilarang menjalankan `supabase db push` sebelum rekonsiliasi histori migrasi dilakukan, karena CLI akan mencoba menerapkan ulang file `20261118*` `[VERIFIED]`.

### 6.3. Audit RLS & Storage Policies (Fokus Khusus Celah Akses) `[VERIFIED]`
Seluruh 8 tabel `public` memiliki `rowsecurity = true` (`33` policy `public` + `11` policy `storage.objects`), tetapi ditemukan **4 celah/ketidaksinkronan kebijakan yang wajib diperbaiki**:

1. **`public.laporan_karhutla` — Policy `UPDATE` (`"Petugas dan Admin update laporan"`)** — **TERLALU LUAS** `[VERIFIED]`:
   - Definisi aktual: `USING (private.has_role(ARRAY['petugas', 'admin']))` & `WITH CHECK (private.has_role(ARRAY['petugas', 'admin']))`.
   - Dampak: Petugas A dapat mengubah laporan yang belum ditugaskan, laporan milik Petugas B, bahkan mengubah kolom administratif (`verified_by`, `verified_at`, `pelapor_id`, `wilayah_id`, `status = 'ditolak'`).
   - Rekomendasi perbaikan: Pisahkan/perketat policy `UPDATE` sehingga `admin` boleh mengubah semua laporan, sedangkan `petugas` **hanya** boleh memperbarui baris dengan `petugas_id = (SELECT auth.uid())` dan `status IN ('terverifikasi', 'ditangani')` (dengan `WITH CHECK` status tujuan `IN ('ditangani', 'selesai')`), ditambah `BEFORE UPDATE` trigger penjaga kolom agar non-admin tidak bisa mengubah `pelapor_id`, `wilayah_id`, `verified_by`, `verified_at`, `petugas_id`, `judul`, `deskripsi`, `latitude`, `longitude`.
2. **`public.penanganan_log` — Policy `INSERT` (`"Petugas dan Admin tambah log penanganan"`)** — **TERLALU LUAS** `[VERIFIED]`:
   - Definisi aktual: `private.has_role(['petugas', 'admin']) AND (petugas_id IS NULL OR petugas_id = auth.uid() OR private.has_role(['admin']))`.
   - Dampak: Petugas dapat menyisipkan log penanganan palsu ke `laporan_id` mana pun meskipun tidak ditugaskan kepadanya!
   - Rekomendasi perbaikan: Wajibkan `EXISTS (SELECT 1 FROM public.laporan_karhutla l WHERE l.id = laporan_id AND l.petugas_id = (SELECT auth.uid()))` dan `petugas_id = (SELECT auth.uid())` untuk role `petugas`.
3. **`public.laporan_karhutla` — Policy `INSERT` (`"User login buat laporan"`)** — **KURANG KETAT PADA KOLOM ADMIN** `[VERIFIED]`:
   - Definisi aktual: `pelapor_id = (SELECT auth.uid()) AND status = 'menunggu_verifikasi'::report_status`.
   - Dampak: Pemanggilan langsung PostgREST dengan JWT `pelapor` dapat menyisipkan nilai palsu pada `verified_by`, `verified_at`, `petugas_id`, atau `catatan_verifikasi`.
   - Rekomendasi perbaikan: Tambahkan syarat `verified_by IS NULL AND verified_at IS NULL AND petugas_id IS NULL AND catatan_verifikasi IS NULL` pada `WITH CHECK` untuk non-admin.
4. **Ketidaksinkronan Minor `storage.objects` vs `laporan_foto` + Kebersihan `private` & `jenis_kejadian`** `[VERIFIED]`:
   - `laporan_foto` `SELECT` mengizinkan petugas via `penugasan_laporan (status_penugasan <> 'dibatalkan')`, sedangkan `storage.objects` `SELECT` untuk `laporan-bukti` hanya mengecek `l.petugas_id = auth.uid()`.
   - `laporan_karhutla.jenis_kejadian` belum memiliki `CHECK` constraint daftar nilai valid.
   - Schema `private` masih memiliki `GRANT USAGE` untuk `anon` (`private` `nspacl` menunjukkan `anon=U/postgres`).

### 6.4. Kesesuaian Database dengan Kebutuhan Fase 2
- Skema tabel inti (`wilayah`, `laporan_karhutla`, `laporan_foto`, `laporan_riwayat_status`) **sudah sangat siap secara struktural** untuk Fase 2 `[VERIFIED]`.
- Tidak perlu menambah tabel baru untuk Fase 2; cukup:
  1. Migrasi hardening RLS & `CHECK` constraint `jenis_kejadian` (+ opsional index `(latitude, longitude)` jika filter bbox diaktifkan).
  2. Pengisian data `public.wilayah` (seed awal + CRUD Admin).
  3. Menambahkan `waktu_kejadian` pada query `EXTENDED_LAPORAN_COLS` di `src/lib/normalizers.js`.

---

## 7. Hasil Audit Keamanan

### Ringkasan Temuan Berdasarkan Tingkat Risiko

| Risiko | ID | Temuan | Bukti & Referensi | Status |
|---|---|---|---|---|
| **Critical** | **SEC-C1** | `next@16.4.0` terdampak **2 advisory Critical** (`GHSA-2464-fhr4-w9xw` RCE Image Optimization SVG, `GHSA-673q-mjm6-r5xr` RCE `use cache` typed arrays), **1 High** (`GHSA-p3m5-59mp-jv5r` DoS Server Actions App Router), dan **7 Moderate** (a.l. `GHSA-f3mh-rxg3-f5g2` paparan HttpOnly cookie pada Edge runtime). Tersedia patch non-breaking **`next@16.4.6`**. *(Catatan: alur auth/RBAC/service-role aplikasi sendiri tidak ditemukan celah kritis).* | `hotspot-khartula/package.json#L14`, output `npm audit --json` (2026-11-20) | `[VERIFIED]` |
| **High** | **SEC-H1** | Policy `UPDATE` `public.laporan_karhutla` (`"Petugas dan Admin update laporan"`) mengizinkan setiap `petugas` mengubah laporan apa pun & kolom apa pun. | `pg_policies` (`public.laporan_karhutla`), `supabase/migrations/20261118000200_*.sql#L429-L434` | `[VERIFIED]` |
| **High** | **SEC-H2** | Policy `INSERT` `public.penanganan_log` (`"Petugas dan Admin tambah log penanganan"`) tidak memeriksa apakah `laporan_id` ditugaskan ke `petugas` terkait. | `pg_policies` (`public.penanganan_log`), `supabase/migrations/20261118000200_*.sql#L479-L490` | `[VERIFIED]` |
| **Medium** | **SEC-M1** | Policy `INSERT` `public.laporan_karhutla` belum mengunci `verified_by`, `verified_at`, `petugas_id`, `catatan_verifikasi` agar wajib `NULL` saat pelaporan baru. | `pg_policies` (`public.laporan_karhutla`), `20261118000200_*.sql#L420-L427` | `[VERIFIED]` |
| **Medium** | **SEC-M2** | Supabase Security Advisor melaporkan `WARN`: `auth_leaked_password_protection` (Leaked Password Protection nonaktif pada Supabase Auth). | `get_advisors(type="security")` (2026-11-20) | `[VERIFIED]` |
| **Medium** | **SEC-M3** | `verifyImageMagicBytes()` pada `src/lib/storage.js#L105-L107` bersifat *fail-open* (`return true` jika `!file || typeof file.slice !== "function"`). | `hotspot-khartula/src/lib/storage.js#L104-L107` | `[VERIFIED]` |
| **Medium** | **SEC-M4** | `next.config.mjs` tidak mengonfigurasi `serverActions.bodySizeLimit` (default 1 MB) sedangkan validasi aplikasi & Storage mengizinkan 5 MB — rawan error 413 atau mendorong workaround tidak aman di client. | `hotspot-khartula/next.config.mjs`, `src/lib/storage.js#L6` | `[VERIFIED]` |
| **Medium** | **SEC-M5** | Belum ada proteksi rate-limit / anti-spam untuk pengiriman laporan baru (`createLaporanAction`) ketika form publik/pelapor dibuka pada Fase 2. | Desain Fase 2 (`F2.4`) | `[INFERRED]` |
| **Medium** | **SEC-M6** | Policy `SELECT` `public.profiles` (`USING (true)` untuk `authenticated`) memungkinkan `pelapor` membaca seluruh daftar `id, full_name, role, wilayah_id` via PostgREST langsung (bukan data sensitif email/password, namun berpotensi enumerasi role). | `pg_policies` (`public.profiles`) | `[VERIFIED]` |
| **Low** | **SEC-L1** | Artefak legacy remote: izin `anon` pada `private` schema/fungsi, `public.get_my_role()`, 3 policy `{service_role}` di `public.*`, 3 policy `{service_role}` di `storage.objects`, bucket kosong `media-karhutla`. | `pg_namespace`, `pg_policies`, `storage.buckets` | `[VERIFIED]` |
| **Low** | **SEC-L2** | Ketidaksinkronan timestamp migrasi lokal (`20261118*`) vs remote (`20261120*`) berisiko re-apply jika `supabase db push` dijalankan tanpa rekonsiliasi. | `list_migrations` vs `supabase/migrations/` | `[VERIFIED]` |
| **Low** | **SEC-L3** | Deprecate konvensi `src/middleware.js` → `src/proxy.js` pada Next.js 16. | `hotspot-khartula/src/middleware.js`, laporan build Fase 1.5 | `[VERIFIED]` |
| **Low** | **SEC-L4** | DevDependency transitif `minimatch` (`7.0.0–11.0.0` via `@typescript-eslint/*`) memiliki advisory Moderate `GHSA-g3hv-75wg-m249` (hanya berdampak di lingkungan lint/dev, bukan runtime produksi). | Output `npm audit --json` (2026-11-20) | `[VERIFIED]` |

---

## 8. Daftar Masalah dan Risiko

| ID | Kategori | Masalah / Risiko | Tingkat | Dampak ke Fase 2 | Mitigasi |
|---|---|---|---|---|---|
| **RISK-01** | Data / Blocker | Tabel `public.wilayah` kosong (`0` baris), sedangkan `laporan_karhutla.wilayah_id` adalah `NOT NULL` FK. | **Critical (Blocker)** | Form Buat Laporan tidak bisa menyimpan data sama sekali. | Selesaikan `F2.2` (seed wilayah + CRUD Admin Wilayah) sebelum `F2.4`. |
| **RISK-02** | Arsitektur Upload | Default `serverActions.bodySizeLimit` (1 MB) < batas file gambar (5 MB) & rencana multi-foto (hingga 3 foto = 15 MB). | **High (Blocker)** | Upload foto berita/laporan > 1 MB gagal HTTP `413`. | Set `experimental.serverActions.bodySizeLimit` di `next.config.mjs` (mis. `'10mb'`/`'16mb'`) atau gunakan pola upload direct-to-Storage + server verification; tangani di `F2.1`. |
| **RISK-03** | Keamanan RLS | Policy `UPDATE` `laporan_karhutla` & `INSERT` `penanganan_log` untuk `petugas` terlalu luas; `INSERT` `laporan_karhutla` belum mengunci kolom admin. | **High** | Data laporan/log bisa dimanipulasi lintas role/penugasan via API langsung. | Terapkan migrasi hardening RLS pada `F2.1` sebelum fitur tulis laporan dibuka. |
| **RISK-04** | GIS & React 19 | Library Leaflet menggunakan `window`/`document` (tidak SSR-safe) dan beberapa wrapper React pihak ketiga bermasalah dengan React 19 + `reactCompiler: true`. | **High** | Hydration mismatch, crash build SSR, atau double-init map container (`Map container is already initialized`). | Gunakan vanilla `leaflet` + `leaflet.markercluster` dalam komponen client dinamis (`ssr: false`) dengan cleanup `map.remove()` ketat di `useEffect`. |
| **RISK-05** | Storage Orphan Files | Jika upload foto ke `laporan-bukti` sukses lalu `INSERT` ke `laporan_karhutla` atau `laporan_foto` gagal, file tertinggal di Storage. | **Medium** | Kebocoran kuota Storage & data tidak konsisten. | Implementasikan rollback eksplisit (`deleteStorageObject`) pada blok error `createLaporanAction`, mengikuti pola `berita.js`. |
| **RISK-06** | Skala Data Peta | `fetchNormalizedDataset` hardcode `limit: 100–200` dan filter dilakukan di memori client/server; hitungan `SummaryCardsGrid` akan terpotong jika laporan > limit. | **Medium** | Statistik & titik peta tidak akurat saat data tumbuh. | Gunakan query agregasi/filter server-side & pagination daftar laporan pada `F2.5`. |
| **RISK-07** | Keamanan Dependensi | `next@16.4.0` memiliki 2 advisory **Critical** & 1 **High** (Server Actions DoS), fix tersedia di `next@16.4.6`; migrasi timestamp lokal vs remote berbeda. | **Critical–High** | Risiko kerentanan framework (khususnya Server Actions) & konflik migrasi CLI. | Upgrade `next` & `eslint-config-next` ke `16.4.6` pada `F2.1` (dengan persetujuan pengguna) & jangan jalankan `supabase db push` tanpa rekonsiliasi. |
| **RISK-08** | Kualitas UX / Error | Belum ada route `error.js`, belum ada validasi batas wilayah Indonesia pada koordinat, dan tidak ada test suite otomatis. | **Medium** | Error tak terduga menampilkan halaman crash bawaan; pelapor bisa salah menaruh titik di luar Indonesia. | Tambahkan `error.js`, soft-warning batas koordinat Indonesia, dan skrip unit/integration test di `F2.1`/`F2.4`/`F2.6`. |

---

## 9. Rekomendasi Prioritas

Urutan implementasi Fase 2 disesuaikan dengan **dependensi teknis aktual hasil audit** (bukan urutan administratif semata):

1. **Prioritas 1 — Hardening Fondasi, Keamanan RLS & Konfigurasi Upload (`F2.1`)**:
   - *Alasan*: Menutup 3 celah RLS (`SEC-H1`, `SEC-H2`, `SEC-M1`), memperbaiki `bodySizeLimit` (`RISK-02`) dan `verifyImageMagicBytes` fail-closed (`SEC-M3`), serta menyelaraskan migrasi/upgrade Next.js sebelum ada fitur tulis laporan baru yang masuk ke produksi/staging.
2. **Prioritas 2 — Data Master Wilayah & CRUD Admin Wilayah (`F2.2`)**:
   - *Alasan*: Audit menemukan `public.wilayah = 0` baris (`RISK-01`). Walaupun roadmap lama menempatkan Manajemen Wilayah di Fase 4, tanpa data `wilayah` yang valid (beserta `center_lat`, `center_lng`), modul pelaporan (`F2.4`) dan pemusatan peta per wilayah (`F2.3`/`F2.5`) **secara teknis terblokir**. Menarik seed + CRUD dasar Wilayah ke `F2.2` membuka seluruh blokir Fase 2.
3. **Prioritas 3 — Mesin Peta GIS Reusable (`F2.3`)**:
   - *Alasan*: Formulir pelaporan (`F2.4`) membutuhkan komponen `CoordinatePickerMap` yang dibangun di atas engine Leaflet yang sama dengan peta pemantauan (`F2.5`). Membangun mesin peta reusable terlebih dahulu mencegah duplikasi kode GIS.
4. **Prioritas 4 — Modul Pelaporan Karhutla End-to-End + Multi-Foto Bukti (`F2.4`)**:
   - *Alasan*: Inti operasional Fase 2 untuk menghasilkan data kejadian nyata (koordinat + foto bukti privat + riwayat awal) sehingga seluruh halaman peta dan daftar memiliki alur data hidup dari hulu ke hilir.
5. **Prioritas 5 — Integrasi Peta GIS, Filter Multi-Dimensi & Sinkronisasi 4 Portal (`F2.5`)**:
   - *Alasan*: Setelah engine peta (`F2.3`) dan data laporan nyata (`F2.4`) tersedia, mengganti placeholder SVG di `/`, `/peta`, `/admin/peta`, `/petugas/peta` serta menambah filter/search/pagination menjadi langsung teruji dengan data riil.
6. **Prioritas 6 — Pengujian Otomatis, Regresi & Validasi Independen Hydrogen (`F2.6`)**:
   - *Alasan*: Memastikan zero regression pada Fase 1.5 (`LOGIN VERIFIED`), verifikasi lintas role & Storage, serta menyiapkan paket bukti validasi untuk Gemini Hydrogen.

---

## 10. Roadmap FASE 2

> **Asumsi Estimasi Waktu**: Estimasi di bawah mengasumsikan 1 implementer utama (Gemini Neon CLI) + 1 siklus validasi independen (Gemini Hydrogen), tanpa hambatan jaringan/downtime Supabase, dan seluruh keputusan teknis (Bagian 15) sudah disetujui sebelum `F2.1` dimulai. Estimasi bersifat indikatif, bukan komitmen pasti.

| ID | Subfase | Pekerjaan Utama | Dependensi | Prioritas | Kompleksitas | Estimasi Indikatif | Kriteria Selesai |
|---|---|---|---|---|---|---|---|
| **F2.1** | Stabilitas Fondasi, Keamanan RLS & Konfigurasi | Hardening RLS (`laporan_karhutla` INSERT/UPDATE, `penanganan_log` INSERT), `CHECK jenis_kejadian`, config `bodySizeLimit`, fix `verifyImageMagicBytes` fail-closed, route `error.js`, upgrade Next.js (bila disetujui) & cleanup opsional | Persetujuan pengguna (Keputusan #1–#4) | **P0 (Wajib Pertama)** | **M** | 0.5–1 hari kerja | Migrasi hardening aktif; uji negatif RLS petugas/pelapor lulus; `bodySizeLimit` mendukung 5 MB+; `lint` & `build` lulus |
| **F2.2** | Master Wilayah & Prasyarat Data Pelaporan | Seed data awal `public.wilayah` (dengan `center_lat/lng` valid), Server Actions & UI CRUD Wilayah di `/admin/wilayah`, tambah `waktu_kejadian` di `normalizers.js` | `F2.1` | **P0 (Unblocker)** | **M** | 0.5–1 hari kerja | `public.wilayah` terisi data valid; Admin dapat tambah/ubah/hapus wilayah (dengan guard FK); dropdown wilayah & koordinat pusat siap dipakai peta & form |
| **F2.3** | Fondasi Mesin Peta GIS Interaktif (Leaflet) | Instalasi `leaflet` (+ clustering), komponen reusable `HotmapCanvas` (basemap switcher, status markers, popup, cluster, fitBounds) & `CoordinatePickerMap` (klik peta, drag marker, GPS, sync input, warning batas Indonesia) | `F2.1`, Persetujuan Library GIS (#5) | **P1 (Core GIS)** | **L** | 1–1.5 hari kerja | Peta interaktif render bersih tanpa SSR error di Next.js 16 + React 19; pan/zoom/basemap/clustering & picker koordinat berfungsi di desktop & mobile |
| **F2.4** | Modul Pelaporan Karhutla End-to-End & Bukti Foto | Aktivasi `/pelapor/laporan/buat` (`CreateLaporanForm` + `CoordinatePickerMap` + multi-foto), `src/lib/actions/laporan.js` (`createLaporanAction` + rollback Storage + tulis `laporan_riwayat_status`), upgrade galeri foto `<img>` + lightbox & mini-map di `LaporanDetailView` | `F2.1`, `F2.2`, `F2.3` | **P1 (Core Bisnis)** | **L** | 1.5–2 hari kerja | Pelapor/Admin dapat mengirim laporan lengkap dengan titik peta & 1–3 foto ke `laporan-bukti`; tampil langsung di `/pelapor/laporan/[id]` beserta signed URL & riwayat awal; RLS isolasi antar-pelapor terverifikasi |
| **F2.5** | Integrasi Peta GIS, Filter & Sinkronisasi 4 Portal | Ganti placeholder SVG pada `/`, `/peta`, `/admin/peta`, `/petugas/peta` dengan `HotmapCanvas`; tambah filter multi-dimensi (wilayah, status, tanggal, jenis kejadian, search), sinkronisasi peta ↔ daftar, filter "Tugas Saya" di petugas, pagination/server filtering | `F2.2`, `F2.3`, `F2.4` | **P1 (Integrasi)** | **L** | 1.5–2 hari kerja | Seluruh 4 halaman peta aktif menggunakan Leaflet terintegrasi dengan tabel & filter; tidak ada lagi placeholder SVG; statistik tidak terpotong limit |
| **F2.6** | Pengujian Otomatis, Regresi & Handover Hydrogen | Skrip unit/integration test helper GIS/validasi/storage, uji E2E seluruh 3 role + `anon`, cek dead link 26 route, audit build/lint/responsif mobile, susun `FASE_2_NEON_COMPLETION_REPORT.md` | `F2.1`–`F2.5` | **P1 (Release Gate)** | **M** | 0.5–1 hari kerja | Seluruh skenario uji & regresi Fase 1.5 PASS; 0 error build/lint; seluruh bukti validasi siap diperiksa Gemini Hydrogen |

---

## 11. Detail Setiap Subfase

### Subfase F2.1 — Stabilitas Fondasi, Keamanan RLS & Konfigurasi
1. **Nama Subfase**: Stabilitas Fondasi, Keamanan RLS & Konfigurasi Pra-Implementasi
2. **Tujuan**: Menutup celah keamanan RLS/Storage/konfigurasi yang ditemukan pada audit sebelum membuka fitur penulisan data laporan dan upload multi-foto.
3. **Fitur yang Dikerjakan**:
   - Konfigurasi `experimental.serverActions.bodySizeLimit` (mis. `'16mb'` untuk mendukung 3 foto × 5 MB + metadata form) pada `hotspot-khartula/next.config.mjs` (atau arsitektur signed-upload jika diputuskan pengguna).
   - Perbaikan `verifyImageMagicBytes()` di `src/lib/storage.js` agar *fail-closed* (`return false` jika `!file || typeof file.slice !== "function"`).
   - Penambahan error boundary (`src/app/error.js`, `src/app/admin/error.js`, `src/app/petugas/error.js`, `src/app/pelapor/error.js`) dengan pesan ramah pengguna & tombol coba lagi.
   - *(Jika disetujui pengguna)*: Upgrade `next` & `eslint-config-next` dari `16.4.0` ke versi patch aman terbaru + evaluasi migrasi `src/middleware.js` → `src/proxy.js`.
   - *(Jika disetujui pengguna)*: Penyelarasan histori migrasi lokal vs remote & penerapan pembersihan opsional `000400`.
4. **File / Direktori Terdampak**:
   - `hotspot-khartula/next.config.mjs`
   - `hotspot-khartula/package.json` & `package-lock.json` *(hanya jika upgrade Next.js disetujui)*
   - `hotspot-khartula/src/lib/storage.js`
   - `hotspot-khartula/src/app/error.js` (+ `admin/error.js`, `petugas/error.js`, `pelapor/error.js`)
   - `supabase/migrations/<timestamp>_fase2_1_rls_hardening.sql`
5. **Ketergantungan Pekerjaan**: Persetujuan eksplisit pengguna atas keputusan keamanan, upgrade Next.js, dan perubahan RLS database.
6. **Perubahan Database**:
   - Migrasi `fase2_1_rls_hardening`:
     - Perketat policy `UPDATE` `public.laporan_karhutla`: pisahkan/kondisikan agar `petugas` hanya boleh update baris dengan `petugas_id = (SELECT auth.uid())` dan `status IN ('terverifikasi', 'ditangani')` dengan `WITH CHECK (status IN ('ditangani', 'selesai'))`.
     - Tambahkan `BEFORE UPDATE` trigger `private.guard_laporan_update_columns()` agar role `petugas` tidak dapat mengubah kolom milik pelapor/admin (`pelapor_id`, `wilayah_id`, `judul`, `deskripsi`, `latitude`, `longitude`, `verified_by`, `verified_at`, `petugas_id`).
     - Perketat policy `INSERT` `public.laporan_karhutla`: untuk non-admin wajib `verified_by IS NULL AND verified_at IS NULL AND petugas_id IS NULL AND catatan_verifikasi IS NULL`.
     - Perketat policy `INSERT` `public.penanganan_log`: untuk role `petugas`, wajib `petugas_id = (SELECT auth.uid())` dan `EXISTS (SELECT 1 FROM public.laporan_karhutla l WHERE l.id = laporan_id AND l.petugas_id = (SELECT auth.uid()))`.
     - Tambahkan `CHECK` constraint `jenis_kejadian IN ('kebakaran_lahan', 'kebakaran_hutan', 'kebakaran_gambut', 'asap_pekat', 'lainnya')` (nullable/default `'kebakaran_lahan'`).
     - *(Opsional)* Terapkan isi `20261120000400_fase1_5_cleanup_optional.sql` + aktifkan `Leaked Password Protection` via Supabase Auth settings.
7. **Pertimbangan Keamanan & RLS**:
   - Seluruh policy baru wajib memakai `(SELECT auth.uid())` dan `(SELECT private.has_role(...))` agar bebas regresi `auth_rls_initplan` dan `multiple_permissive_policies`.
   - Tidak ada weakening autentikasi/otorisasi.
8. **Skenario Pengujian**:
   - Uji negatif token `petugas`: coba `UPDATE laporan_karhutla` pada laporan tanpa `petugas_id` → harus ditolak RLS (`0` rows / `42501`).
   - Uji negatif token `petugas`: coba `INSERT penanganan_log` pada laporan bukan tugasnya → harus ditolak RLS (`42501`).
   - Uji negatif token `pelapor`: coba `INSERT laporan_karhutla` dengan `verified_by = auth.uid()` atau `status = 'terverifikasi'` → harus ditolak RLS (`42501`).
   - Uji upload gambar Berita berukuran 2–4 MB via `/admin/berita` → harus berhasil tanpa HTTP `413`.
   - Uji `verifyImageMagicBytes({})` → mengembalikan `false`.
9. **Kriteria Penerimaan**:
   - Security Advisor Supabase bersih (termasuk `auth_leaked_password_protection` jika diaktifkan di dashboard).
   - Seluruh uji negatif RLS gagal dengan penolakan yang tepat.
   - `npm run lint` dan `npm run build` lulus tanpa error.
10. **Risiko & Mitigasi**:
    - *Risiko*: Upgrade Next.js 16.x menimbulkan breaking change kecil (`proxy.js`). *Mitigasi*: Jalankan full regression test login/RBAC setelah upgrade; jika pengguna memilih menunda upgrade ke akhir Fase 2, jalankan F2.1 tanpa upgrade dependency.
11. **Hasil Akhir**: Migrasi hardening aktif & terverifikasi, `next.config.mjs` siap multi-foto 5 MB, `storage.js` fail-closed, error boundaries terpasang.

---

### Subfase F2.2 — Master Wilayah & Prasyarat Data Pelaporan
1. **Nama Subfase**: Master Wilayah & Prasyarat Data Pelaporan
2. **Tujuan**: Membuka blocker utama Fase 2 (`public.wilayah = 0` baris) sehingga formulir pelaporan memiliki referensi wilayah valid beserta koordinat pusat (`center_lat`, `center_lng`) untuk auto-fokus peta GIS.
3. **Fitur yang Dikerjakan**:
   - Menyediakan seed idempoten wilayah rawan karhutla Indonesia pada `supabase/seed/002_wilayah_indonesia.sql` (contoh: Provinsi/Kabupaten prioritas karhutla seperti Riau, Jambi, Sumatera Selatan, Kalimantan Barat, Kalimantan Tengah, Kalimantan Selatan, Kalimantan Timur, Papua Selatan — dengan `center_lat` & `center_lng` akurat).
   - Implementasi Server Actions CRUD Wilayah (`src/lib/actions/wilayah.js`: `createWilayahAction`, `updateWilayahAction`, `deleteWilayahAction`) dengan `requireRole(["admin"])`, validasi nama tidak kosong, validasi koordinat valid, dan proteksi penghapusan bila masih dirujuk oleh `laporan_karhutla` atau `profiles`.
   - Upgrade `/admin/wilayah` dengan komponen `AdminWilayahManager.jsx` (form tambah/edit, konfirmasi hapus via `ConfirmDialog`, pencarian cepat).
   - Perbarui `EXTENDED_LAPORAN_COLS` di `src/lib/normalizers.js` agar turut membaca `waktu_kejadian` dan memformatnya dengan benar.
4. **File / Direktori Terdampak**:
   - `supabase/seed/002_wilayah_indonesia.sql`
   - `hotspot-khartula/src/lib/actions/wilayah.js` *(NEW)*
   - `hotspot-khartula/src/components/admin/AdminWilayahManager.jsx` *(NEW)*
   - `hotspot-khartula/src/app/admin/wilayah/page.js`
   - `hotspot-khartula/src/lib/normalizers.js`
5. **Ketergantungan Pekerjaan**: `F2.1`.
6. **Perubahan Database**: Tidak ada perubahan DDL; hanya operasi data seed `INSERT ... ON CONFLICT (nama_wilayah, kabupaten_kota) DO NOTHING` pada `public.wilayah` (setelah persetujuan pengguna).
7. **Pertimbangan Keamanan & RLS**:
   - Seluruh mutasi di `src/lib/actions/wilayah.js` dilindungi `requireRole(["admin"])` di server + diperkuat RLS `public.wilayah` (hanya `admin` untuk `INSERT`/`UPDATE`/`DELETE`; publik/authenticated `SELECT`).
   - Validasi rentang koordinat `isValidLatLng(centerLat, centerLng)` dan angka finite di server.
8. **Skenario Pengujian**:
   - Admin menambah wilayah baru, mengedit koordinat pusat, lalu menghapus wilayah yang belum dipakai laporan.
   - Admin mencoba menambah duplikat `(nama_wilayah, kabupaten_kota)` → ditolak dengan pesan ramah (`23505`).
   - Admin mencoba menghapus wilayah yang sudah memiliki laporan → ditolak aman (menampilkan pesan keterkaitan FK `23503`).
   - Petugas & Pelapor mencoba memanggil mutasi wilayah → ditolak server action & RLS.
9. **Kriteria Penerimaan**:
   - `public.wilayah` memiliki minimal daftar wilayah Indonesia valid dengan `center_lat`/`center_lng`.
   - `/admin/wilayah` mendukung CRUD penuh dan langsung terefleksi di dropdown wilayah `/` dan `/pelapor/laporan/buat`.
10. **Risiko & Mitigasi**:
    - *Risiko*: Koordinat pusat wilayah keliru (tertukar lat/lng). *Mitigasi*: Validasi rentang Indonesia (`lat: -11.5..6.5`, `lng: 94.5..142.0`) di skrip seed dan warning di form Admin.
11. **Hasil Akhir**: Master `wilayah` terisi & dapat dikelola Admin, `normalizers.js` memuat `waktu_kejadian`.

---

### Subfase F2.3 — Fondasi Mesin Peta GIS Interaktif (Reusable Leaflet Engine)
1. **Nama Subfase**: Fondasi Mesin Peta GIS Interaktif
2. **Tujuan**: Membangun lapisan komponen peta GIS interaktif yang ringan, SSR-safe, reusable di seluruh halaman, dan patuh pada aturan GIS proyek.
3. **Fitur yang Dikerjakan**:
   - Instalasi `leaflet` dan `leaflet.markercluster` (setelah persetujuan pengguna pada Keputusan #5) + import CSS Leaflet secara aman.
   - Helper utilitas GIS baru `src/lib/gis.js`:
     - Konstanta bounding box Indonesia (`INDONESIA_CENTER = [-2.5, 118.0]`, `INDONESIA_BOUNDS`), fungsi `isWithinIndonesiaBounds(lat, lng)`, formatter koordinat (`formatCoordinates`), dan generator URL navigasi eksternal (OpenStreetMap/Google Maps).
     - Pembuat ikon marker berbasis status (`STATUS_META`) menggunakan `L.divIcon` (tanpa bergantung pada broken default PNG webpack/Turbopack Leaflet!).
   - Komponen `src/components/map/HotmapCanvas.jsx` (dibungkus loader dinamis `HotmapMap.jsx` dengan `next/dynamic(..., { ssr: false })`):
     - Basemap switcher: **OpenStreetMap Standard**, **Esri World Imagery (Satelit)**, **OpenTopoMap (Topografi)**.
     - Kontrol zoom, tombol *Reset View Indonesia*, tombol *Fit All Markers*, dan *Legenda Status*.
     - *Marker Clustering* otomatis via `leaflet.markercluster` agar performa tetap lancar untuk ratusan–ribuan titik.
     - Popup informasi ringkas marker + callback `onSelectReport(id)` untuk sinkronisasi dua arah dengan tabel/panel detail + prop `focusTarget` (`{ lat, lng, zoom }`) untuk *flyTo*.
     - Disclaimer permanen: *"Titik menunjukkan laporan warga, bukan deteksi hotspot satelit."*
   - Komponen `src/components/map/CoordinatePickerMap.jsx` (dibungkus dynamic `ssr: false`):
     - Klik peta untuk meletakkan/memindahkan marker, dukungan drag marker, tombol *"Gunakan Lokasi GPS Saya"* (`navigator.geolocation` dengan fallback pesan error izin/timeout).
     - Sinkronisasi dua arah dengan input angka `latitude` & `longitude` (presisi 6 desimal).
     - Auto-`flyTo` ke `center_lat`/`center_lng` ketika user memilih `wilayah`.
     - Peringatan non-blocking (atau validasi sesuai keputusan) jika koordinat berada di luar batas geografis Indonesia.
4. **File / Direktori Terdampak**:
   - `hotspot-khartula/package.json` & `package-lock.json`
   - `hotspot-khartula/src/app/globals.css` (style minor marker/cluster Leaflet)
   - `hotspot-khartula/src/lib/gis.js` *(NEW)*
   - `hotspot-khartula/src/components/map/HotmapCanvas.jsx` *(NEW)*
   - `hotspot-khartula/src/components/map/HotmapMap.jsx` *(NEW — dynamic wrapper `ssr: false`)*
   - `hotspot-khartula/src/components/map/CoordinatePickerMap.jsx` *(NEW)*
   - `hotspot-khartula/src/components/map/CoordinatePicker.jsx` *(NEW — dynamic wrapper `ssr: false`)*
5. **Ketergantungan Pekerjaan**: `F2.1`, persetujuan instalasi library GIS.
6. **Perubahan Database**: Tidak ada (PostGIS tetap tidak diaktifkan).
7. **Pertimbangan Keamanan & RLS**:
   - Seluruh konten popup Leaflet wajib di-escape/dibangun via DOM API (`document.createElement` / `textContent`), **DILARANG** menyisipkan `judul`/`deskripsi`/`wilayah` mentah ke template string HTML `bindPopup(...)` agar bebas kerentanan **DOM XSS**!
   - Tile URL hanya menggunakan HTTPS terpercaya (OSM, Esri, OpenTopoMap) dengan atribusi resmi.
8. **Skenario Pengujian**:
   - Render peta pada halaman SSR Next.js 16 (tidak ada error `window is not defined` atau hydration mismatch).
   - Stress-test client-side dengan 500+ titik simulasi lokal (hanya saat test, bukan data produksi) → clustering aktif, pan/zoom mulus.
   - Uji *DOM XSS*: judul laporan mengandung `<img src=x onerror=alert(1)>` → ter-render sebagai teks biasa di popup, tidak mengeksekusi script.
   - Uji `CoordinatePicker`: klik peta, drag pin, ketik lat/lng manual, ganti basemap, dan pilih wilayah → posisi marker sinkron 100%.
9. **Kriteria Penerimaan**:
   - Kedua komponen peta reusable (`HotmapMap`, `CoordinatePicker`) berjalan stabil di desktop & mobile tanpa console error.
   - Zero XSS pada popup Leaflet.
   - `npm run lint` & `npm run build` lulus.
10. **Risiko & Mitigasi**:
    - *Risiko*: React 19 Strict Mode memicu mount ganda `L.map()` → error `Map container is already initialized`. *Mitigasi*: Cek ref instance sebelum inisialisasi & panggil `map.remove()` secara penuh pada cleanup `useEffect`.
    - *Risiko*: Tile server publik sementara lambat/diblokir jaringan tertentu. *Mitigasi*: Sediakan 3 pilihan basemap & fallback tile error notice.
11. **Hasil Akhir**: Library peta reusable + helper GIS siap dikonsumsi oleh Form Pelaporan (`F2.4`) dan 4 halaman peta (`F2.5`).

---

### Subfase F2.4 — Modul Pelaporan Karhutla End-to-End & Bukti Foto (`laporan-bukti`)
1. **Nama Subfase**: Modul Pelaporan Karhutla End-to-End & Dokumentasi Foto Bukti
2. **Tujuan**: Mengaktifkan fitur inti pelaporan kejadian karhutla oleh Pelapor (dan Admin) lengkap dengan pemilihan koordinat peta interaktif, validasi server ketat, unggah multi-foto bukti ke bucket privat `laporan-bukti`, serta pencatatan riwayat status awal.
3. **Fitur yang Dikerjakan**:
   - Server Action `src/lib/actions/laporan.js`:
     - `createLaporanAction(_prevState, formData)`:
       - Guard `requireRole(["pelapor", "admin"])`.
       - Validasi server: `judul` (3–160 char), `deskripsi` (5–3000 char), `wilayah_id` (UUID valid & ada di `public.wilayah`), `latitude` & `longitude` (`isValidLatLng`, tolak `(0, 0)`), `jenis_kejadian` (allowlist), `tingkat_keparahan` (opsional, allowlist `rendah/sedang/tinggi/kritis`), `estimasi_luas` (opsional, numeric >= 0), `alamat_lokasi` (opsional, maks 300 char), `waktu_kejadian` (opsional, ISO date valid, tidak di masa depan > 1 hari).
       - Validasi foto bukti (`bukti_foto`, 0–3 file atau minimal 1 file sesuai keputusan pengguna): periksa ukuran `<= 5 MB`, MIME/ekstensi, dan `verifyImageMagicBytes()` pada setiap file.
       - Alur transaksi aman:
         1. `INSERT` ke `public.laporan_karhutla` dengan `pelapor_id = user.id` & `status = 'menunggu_verifikasi'` (dapatkan `laporan.id`).
         2. Upload setiap foto ke bucket privat `laporan-bukti` via `uploadLaporanEvidence(supabase, user.id, laporan.id, file)`.
         3. `INSERT` metadata ke `public.laporan_foto` (`jenis_foto = 'bukti_awal'`, `uploaded_by = user.id`).
         4. Jika step 2 atau 3 gagal → **rollback**: hapus semua objek Storage yang sempat terunggah & hapus/tandai kegagalan secara bersih (catatan: karena `pelapor` tidak memiliki hak `DELETE` pada `laporan_karhutla`, validasi seluruh file + upload **sebelum** `INSERT laporan_karhutla` dengan folder `user.id/laporan-<uuid_client_or_generated>`, lalu `INSERT laporan_karhutla` + `laporan_foto`; jika `INSERT` DB gagal, hapus seluruh file Storage yang baru diunggah — `pelapor` MEMILIKI hak `DELETE` pada folder miliknya sendiri di `laporan-bukti`! Pola ini **100% atomik tanpa meninggalkan baris laporan korup ataupun orphan Storage** `[INFERRED]`).
         5. `INSERT` entri riwayat awal ke `public.laporan_riwayat_status` (`status_sebelumnya: null`, `status_baru: 'menunggu_verifikasi'`, `changed_by: user.id`, `catatan: 'Laporan dikirim oleh pelapor'`).
       - `revalidatePath` untuk `/`, `/peta`, `/pelapor`, `/pelapor/laporan`, `/admin`, `/admin/laporan`, `/admin/peta`, `/petugas`, `/petugas/laporan`, `/petugas/peta`, lalu `redirect('/pelapor/laporan/' + laporanId)` (atau return success + link).
   - Komponen `src/components/laporan/CreateLaporanForm.jsx`:
     - Menggantikan placeholder di `src/app/pelapor/laporan/buat/page.js`.
     - Integrasi `CoordinatePicker`, dropdown `wilayah` (otomatis `flyTo` peta ke pusat wilayah), seluruh field laporan terstruktur, multi-file picker dengan pratinjau thumbnail & hapus sebelum submit, loading/disabled state, dan error summary jelas.
   - Peningkatan `src/components/laporan/LaporanDetailView.jsx`:
     - Tambahkan pratinjau lokasi pada mini peta Leaflet (`HotmapMap` mode single-marker read-only) + tombol buka koordinat di Google Maps/OSM.
     - Perbaiki galeri `fotoList` dari CSS `backgroundImage` menjadi elemen `<img alt=...>` semantik dengan modal *lightbox* perbesar gambar & informasi ukuran/jenis foto.
     - Tampilkan `waktu_kejadian` (jika berbeda/tersedia) pada sidebar informasi laporan.
4. **File / Direktori Terdampak**:
   - `hotspot-khartula/src/lib/actions/laporan.js` *(NEW)*
   - `hotspot-khartula/src/components/laporan/CreateLaporanForm.jsx` *(NEW)*
   - `hotspot-khartula/src/app/pelapor/laporan/buat/page.js`
   - `hotspot-khartula/src/components/laporan/LaporanDetailView.jsx`
   - `hotspot-khartula/src/components/laporan/FotoGalleryLightbox.jsx` *(NEW)*
5. **Ketergantungan Pekerjaan**: `F2.1`, `F2.2`, `F2.3`.
6. **Perubahan Database**: Tidak ada perubahan skema (memanfaatkan 100% tabel & bucket yang sudah ada).
7. **Pertimbangan Keamanan & RLS**:
   - `petugas` diblokir dari `/pelapor/laporan/buat` (middleware + `requireRole(["pelapor", "admin"])`).
   - Foto tersimpan di bucket privat `laporan-bukti/<auth.uid()>/...` dan hanya diakses via `createSignedUrl` (kedaluwarsa 1 jam).
   - Validasi *magic bytes* di server menolak file non-gambar yang disamarkan (`.svg`/`.html`/`.exe` diubah ke `.jpg`).
   - Tidak memercayai `pelapor_id` atau `status` dari `formData` client — selalu di-set di server.
   - Proteksi anti-submit ganda (`isPending` + tombol disabled).
8. **Skenario Pengujian**:
   - Pelapor mengirim laporan lengkap dengan titik dari klik peta & 2 foto (JPEG + PNG) → berhasil, redirect ke `/pelapor/laporan/[id]`, foto tampil via signed URL, riwayat awal `menunggu_verifikasi` tercatat.
   - Uji negatif: submit tanpa koordinat / koordinat di luar `-90..90` / file > 5 MB / file teks berganti ekstensi `.jpg` → ditolak rapi dengan pesan error tanpa menulis ke DB atau Storage.
   - Uji visibilitas lintas role:
     - `anon` membuka `/` & `/peta` → laporan baru berstatus `menunggu_verifikasi` **TIDAK** muncul (sesuai RLS).
     - `admin` membuka `/admin/laporan` & `/admin/laporan/[id]` → laporan baru **MUNCUL** beserta foto bukti (signed URL).
     - `pelapor` lain mencoba membuka `/pelapor/laporan/[id]` milik Pelapor A → ditolak (`Laporan tidak ditemukan`).
9. **Kriteria Penerimaan**:
   - Alur buat laporan hingga lihat detail + foto + riwayat berjalan 100% end-to-end dengan data nyata di Supabase.
   - Rollback Storage terbukti tidak meninggalkan file yatim saat insert gagal.
10. **Risiko & Mitigasi**:
    - *Risiko*: Pengguna mengirim 3 foto sekaligus mendekati 15 MB sehingga koneksi lambat timeout. *Mitigasi*: Batasi maksimal 3 foto per laporan, tampilkan indikator progres submit, dan pertimbangkan kompresi client opsional (tetap validasi server).
11. **Hasil Akhir**: Fitur Pelaporan Karhutla + Bukti Foto Privat berfungsi penuh.

---

### Subfase F2.5 — Integrasi Peta GIS, Filter Multi-Dimensi & Sinkronisasi 4 Portal
1. **Nama Subfase**: Integrasi Peta GIS, Filter Multi-Dimensi & Sinkronisasi Seluruh Portal
2. **Tujuan**: Menghilangkan seluruh placeholder peta SVG, mengintegrasikan peta interaktif dengan daftar laporan di seluruh 4 halaman peta (`/`, `/peta`, `/admin/peta`, `/petugas/peta`), serta memperbaiki skalabilitas filter & statistik laporan.
3. **Fitur yang Dikerjakan**:
   - Komponen reusable `src/components/map/PetaLaporanExplorer.jsx` untuk menyatukan peta Leaflet + filter bar + kartu detail terpilih + sinkronisasi tabel laporan:
     - Filter: rentang tanggal (`startDate`, `endDate`), `wilayah`, `status`, `jenis_kejadian`, `tingkat_keparahan`, pencarian kata kunci (`judul`/`alamat_lokasi`/`wilayah`), serta filter khusus Petugas (*"Semua Laporan"* vs *"Ditugaskan ke Saya"*).
     - Sinkronisasi dua arah: klik marker di peta → sorot baris tabel & buka panel detail; klik baris tabel → `flyTo` ke marker di peta & buka popup/panel detail.
     - Tombol reset filter, tombol *Fit ke Hasil Filter*, dan info jumlah titik valid vs total laporan.
   - Upgrade 4 halaman peta:
     1. **`/` (`LandingExplorer.jsx`)**: Ganti konten `#leaflet-map-slot` (SVG placeholder) dengan `HotmapMap`, pertahankan desain hero + 6 kartu status + daftar laporan + berita terbaru.
     2. **`/peta` (`PublicPetaPage`)**: Ganti `MapOverviewBox` + `LaporanTable` statis dengan `PetaLaporanExplorer` (publik hanya melihat laporan `terverifikasi`/`ditangani`/`selesai` sesuai RLS).
     3. **`/admin/peta` (`AdminPetaPage`)**: Ganti `MapOverviewBox` dengan `PetaLaporanExplorer` mode admin (semua status + tautan cepat ke `/admin/laporan/[id]`).
     4. **`/petugas/peta` (`PetugasPetaPage`)**: Ganti `MapOverviewBox` dengan `PetaLaporanExplorer` mode petugas (tab *"Semua"* / *"Ditugaskan ke Saya"* + tombol arah koordinat + tautan ke `/petugas/laporan/[id]`).
   - Peningkatan skalabilitas data di `src/lib/normalizers.js` & daftar laporan (`/*/laporan`):
     - Tambah helper `fetchStatusCounts(supabase, filters)` berbasis count query agar kartu KPI tidak salah hitung jika total laporan melebihi `limit`.
     - Tambah filter query-param (`?status=&wilayah=&q=&page=`) dan pagination sederhana pada `/admin/laporan`, `/petugas/laporan`, dan `/pelapor/laporan`.
   - Hapus penggunaan `MapOverviewBox` SVG placeholder (atau arsipkan bila tidak lagi dipakai) agar tidak ada kode peta ganda.
4. **File / Direktori Terdampak**:
   - `hotspot-khartula/src/components/map/PetaLaporanExplorer.jsx` *(NEW)*
   - `hotspot-khartula/src/components/landing/LandingExplorer.jsx`
   - `hotspot-khartula/src/app/peta/page.js`
   - `hotspot-khartula/src/app/admin/peta/page.js`
   - `hotspot-khartula/src/app/petugas/peta/page.js`
   - `hotspot-khartula/src/app/admin/laporan/page.js`
   - `hotspot-khartula/src/app/petugas/laporan/page.js`
   - `hotspot-khartula/src/app/pelapor/laporan/page.js`
   - `hotspot-khartula/src/lib/normalizers.js`
   - `hotspot-khartula/src/components/ui/SharedUI.jsx`
5. **Ketergantungan Pekerjaan**: `F2.2`, `F2.3`, `F2.4`.
6. **Perubahan Database**: *(Opsional)* Index B-tree `(latitude, longitude)` pada `public.laporan_karhutla` jika volume data memerlukan filter bounding-box server-side di masa depan.
7. **Pertimbangan Keamanan & RLS**:
   - Pastikan query pencarian (`q`) menggunakan parameterized Supabase `.ilike()` (tanpa string interpolation SQL mentah; sanitasi wildcard `%`/`_` jika perlu).
   - Publik (`/`, `/peta`) tetap tunduk pada RLS `anon` (hanya `terverifikasi`, `ditangani`, `selesai`).
8. **Skenario Pengujian**:
   - Filter wilayah di `/peta` → marker & tabel tersaring bersamaan dan peta melakukan `fitBounds` ke titik tersaring.
   - Klik baris di tabel `/admin/peta` → peta `flyTo` ke titik tersebut & menampilkan panel detail + tautan `/admin/laporan/[id]`.
   - Uji responsivitas layout peta + panel detail pada viewport mobile (`375px`) dan desktop (`1440px`).
   - Uji empty state saat filter tidak menghasilkan laporan (peta tetap stabil menampilkan Indonesia tanpa crash).
9. **Kriteria Penerimaan**:
   - Seluruh 4 halaman peta menggunakan Leaflet interaktif; 0 halaman tersisa yang masih memakai SVG placeholder.
   - Filter, pencarian, dan sinkronisasi peta ↔ daftar berjalan mulus di semua role.
   - Daftar laporan mendukung pencarian, filter, dan pagination.
10. **Risiko & Mitigasi**:
    - *Risiko*: Layout peta di mobile tertutup panel detail atau sulit di-scroll. *Mitigasi*: Atur tinggi responsif (`h-[380px] lg:h-[520px]`), panel detail bertumpuk vertikal di bawah peta pada `< lg`, dan hindari scroll-trap pada mobile.
11. **Hasil Akhir**: Ekosistem Peta GIS terintegrasi penuh di seluruh portal publik, admin, dan petugas.

---

### Subfase F2.6 — Pengujian Otomatis, Regresi & Validasi Independen Fase 2
1. **Nama Subfase**: Pengujian Otomatis, Regresi & Persiapan Validasi Independen
2. **Tujuan**: Memverifikasi kualitas, keamanan, dan kestabilan seluruh fitur Fase 2 tanpa regresi pada Fase 1.5, serta menyediakan bukti lengkap bagi Gemini Hydrogen.
3. **Fitur yang Dikerjakan**:
   - Menambahkan skrip uji otomatis ringan (Node `node:test` built-in — **0 dependency tambahan!**) di `hotspot-khartula/tests/` dan script `"test": "node --test tests/*.test.mjs"` di `package.json` untuk menguji:
     - `src/lib/gis.js` (validasi koordinat, batas Indonesia, formatter).
     - `src/lib/storage.js` (validasi file, fail-closed `verifyImageMagicBytes`, path safety).
     - `src/lib/normalizers.js` (`isValidLatLng`, `isUuid`, normalizer status/tanggal/luas).
     - `src/lib/auth.js` (`normalizeRole`, `isPathAllowedForRole`, anti open-redirect).
   - Menjalankan pengujian E2E lengkap (3 akun demo + `anon`) pada `next build` + `next start`.
   - Audit seluruh link navigasi (desktop & mobile) di 26 route — memastikan 0 dead link dan 0 HTTP 404/500.
   - Menyusun laporan akhir `docs/reports/FASE_2_NEON_COMPLETION_REPORT.md` dengan instruksi & bukti validasi untuk Gemini Hydrogen.
4. **File / Direktori Terdampak**:
   - `hotspot-khartula/package.json` (tambah script `"test"`)
   - `hotspot-khartula/tests/gis.test.mjs`, `storage.test.mjs`, `normalizers.test.mjs`, `auth.test.mjs` *(NEW)*
   - `docs/reports/FASE_2_NEON_COMPLETION_REPORT.md` *(NEW saat eksekusi selesai)*
5. **Ketergantungan Pekerjaan**: `F2.1` s.d. `F2.5`.
6. **Perubahan Database**: Tidak ada (cleanup data uji yang dibuat selama E2E agar database tetap bersih).
7. **Pertimbangan Keamanan & RLS**:
   - Pengujian RLS dilakukan dengan sesi/token pengguna aktual (`pelapor`, `petugas`, `admin`, `anon`) — bukan bypass `service_role`.
   - Memastikan tidak ada rahasia/password tercetak pada log atau tersimpan di Git.
8. **Skenario Pengujian**:
   - Seluruh skenario pada Bagian 13 (Strategi Pengujian) & regresi penuh Fase 1.5 (Normal Login, Fast Login, Logout, RBAC, CRUD Berita).
9. **Kriteria Penerimaan**:
   - `npm run lint`, `npm test`, `npm run build` semuanya exit code `0`.
   - Seluruh pengujian E2E & RLS lulus 100%, tidak ada regresi Fase 1.5.
10. **Risiko & Mitigasi**:
    - *Risiko*: Data uji tertinggal di database produksi/staging. *Mitigasi*: Tandai data uji jelas dan bersihkan setelah verifikasi, kecuali seed `wilayah` resmi.
11. **Hasil Akhir**: Aplikasi siap diserahkan untuk validasi independen Gemini Hydrogen.

---

## 12. Acceptance Criteria Keseluruhan Fase 2

Fase 2 dinyatakan **SELESAI & SIAP VALIDASI HYDROGEN** apabila seluruh kriteria berikut terpenuhi:

1. **Keamanan & Database**:
   - Policy `UPDATE` `laporan_karhutla`, `INSERT` `laporan_karhutla`, dan `INSERT` `penanganan_log` sudah diperketat dan teruji negatif dengan token sesi aktual.
   - `verifyImageMagicBytes` bersifat fail-closed; `next.config.mjs` mendukung unggahan hingga 5 MB per gambar tanpa error `413`.
   - Supabase Security Advisor bebas temuan kritis/tinggi; 0 peringatan `auth_rls_initplan` / `multiple_permissive_policies`.
2. **Master Wilayah**:
   - `public.wilayah` terisi data wilayah Indonesia valid (`center_lat`, `center_lng`) dan dapat dikelola CRUD oleh Admin di `/admin/wilayah`.
3. **Peta GIS Interaktif**:
   - Seluruh 4 halaman peta (`/`, `/peta`, `/admin/peta`, `/petugas/peta`) menggunakan Leaflet interaktif dengan basemap switcher, marker berbeda warna per status, clustering, popup bebas XSS, dan label eksplisit *"laporan warga, bukan deteksi hotspot satelit"*.
   - Peta dan daftar laporan tersinkronisasi dua arah dengan filter multi-dimensi.
   - Tidak ada lagi komponen SVG placeholder aktif.
4. **Pelaporan End-to-End & Bukti Foto**:
   - Pelapor & Admin dapat membuat laporan baru melalui `/pelapor/laporan/buat` dengan pemilih titik peta (`CoordinatePicker`), koordinat valid, dan unggah foto bukti ke bucket privat `laporan-bukti`.
   - Laporan baru tersimpan di `laporan_karhutla`, metadata foto di `laporan_foto`, dan riwayat awal di `laporan_riwayat_status`.
   - Foto bukti tampil via signed URL di `LaporanDetailView` dengan galeri `<img>` + lightbox, dan tidak dapat diakses oleh pelapor lain atau `anon`.
5. **Kualitas, Navigasi & Regresi**:
   - Seluruh 26 route & navigasi desktop/mobile berjalan tanpa dead link atau console error.
   - `npm run lint`, `npm test`, dan `npm run build` lulus 100%.
   - Seluruh fitur Fase 1.5 (Normal Login, Fast Login, Logout, RBAC, CRUD Berita) tetap lulus tanpa regresi.

---

## 13. Strategi Pengujian

| Lapisan Pengujian | Metode & Alat | Cakupan Utama |
|---|---|---|
| **Static & Build** | `npm run lint`, `npm run build` | ESLint 0 error/warning, kompilasi Next.js 16 Turbopack + React Compiler sukses untuk seluruh route (termasuk dynamic import Leaflet). |
| **Unit Testing** | `node --test` (`hotspot-khartula/tests/*.test.mjs`) | Validasi koordinat (`isValidLatLng`, `isWithinIndonesiaBounds`), validasi file & *magic bytes* fail-closed, normalizer status/luas/tanggal, `isPathAllowedForRole`, anti open-redirect. |
| **Database & RLS Live** | Token sesi aktual 3 role (`admin`, `petugas`, `pelapor`) + `anon` | Uji positif & negatif `SELECT`/`INSERT`/`UPDATE`/`DELETE` pada `wilayah`, `laporan_karhutla`, `laporan_foto`, `laporan_riwayat_status`, `penanganan_log`, dan Storage `laporan-bukti` + `berita-images`. |
| **Alur Bisnis E2E** | Browser uji pada `next start` | Admin CRUD Wilayah → Pelapor Buat Laporan (map picker + 2 foto) → Cek detail & signed URL → Cek `anon` tidak melihat `menunggu_verifikasi` → Admin melihat laporan di `/admin/laporan` & `/admin/peta` → Admin CRUD Berita dengan foto 2 MB. |
| **Pengujian GIS** | Browser Desktop (`1440px`) & Mobile (`375px`) | Pan/zoom, ganti 3 basemap, klik peta & drag pin, GPS geolocation fallback, clustering banyak titik, sinkronisasi klik tabel ↔ marker, uji *DOM XSS* pada popup marker. |
| **Pengujian Regresi** | Checklist Fase 1.5 | Normal Login, Fast Login, Logout, redirect `anon` + preservasi query string, blokir akses lintas-role (`307`). |

---

## 14. Strategi Validasi Independen Gemini Hydrogen

Setelah Gemini Neon CLI menyelesaikan implementasi (per subfase atau keseluruhan Fase 2), **Gemini Hydrogen** akan menjalankan validasi independen secara read-only terhadap kode & runtime.

### 14.1. Matriks Pemeriksaan Hydrogen per Subfase
| Subfase | Pemeriksaan Kode | Pemeriksaan DB & RLS | Pengujian Role & Bisnis | Pengujian GIS | Build/Lint & Regresi |
|---|---|---|---|---|---|
| **F2.1** | Audit diff `next.config.mjs`, `storage.js`, `error.js`, `package.json` | Inspeksi `pg_policies`, trigger `guard_laporan_update_columns`, `get_advisors` | Uji negatif `petugas` update laporan orang lain & `pelapor` spoof `verified_by` | — | `lint`, `build`, regresi login/RBAC |
| **F2.2** | Audit `actions/wilayah.js`, `AdminWilayahManager.jsx`, `normalizers.js` | Cek baris `public.wilayah`, validitas `center_lat/lng`, constraint FK | Admin CRUD Wilayah; Petugas/Pelapor diblokir | Validasi koordinat pusat wilayah | `lint`, `build` |
| **F2.3** | Audit `gis.js`, `HotmapCanvas.jsx` (khususnya pencegahan DOM XSS & cleanup `map.remove()`) | Konfirmasi PostGIS tetap nonaktif | — | Uji 3 basemap, zoom/pan, clustering, `CoordinatePicker`, mobile viewport, zero hydration error | `lint`, `build` |
| **F2.4** | Audit `actions/laporan.js` (validasi server, urutan upload + rollback atomik), `CreateLaporanForm.jsx`, `LaporanDetailView.jsx` | Cek entri di `laporan_karhutla`, `laporan_foto`, `laporan_riwayat_status`, `storage.objects` | Pelapor submit laporan + foto; cek isolasi Pelapor B & `anon`; Admin lihat detail & signed URL; uji file palsu ditolak | Uji picker koordinat → tersimpan persis di DB → render di mini-map detail | `lint`, `test`, `build` |
| **F2.5** | Audit `PetaLaporanExplorer.jsx`, 4 halaman peta, query filter & pagination | Cek query `ilike` aman & count KPI akurat | Uji visibilitas status per role (`anon` vs `admin` vs `petugas`) | Uji sinkronisasi peta ↔ daftar, semua filter, tidak ada sisa SVG placeholder | `lint`, `build`, cek 26 route |
| **F2.6** | Review test suite `tests/*.test.mjs` & laporan penyelesaian Neon | Pastikan database bersih dari sisa data uji sementara | Regresi penuh Fase 1.5 (3 akun demo Normal & Fast Login, RBAC, Berita) | Smoke test seluruh 4 halaman peta desktop & mobile | `npm run lint`, `npm test`, `npm run build` |

### 14.2. Paket Bukti yang Wajib Diserahkan Neon kepada Hydrogen
1. `git status`, daftar commit/file berubah, dan ringkasan diff untuk setiap subfase (`docs/reports/FASE_2_NEON_COMPLETION_REPORT.md`).
2. File SQL migrasi baru di `supabase/migrations/` beserta output verifikasi `pg_policies` & `get_advisors(type="security"|"performance")`.
3. Log eksekusi aktual `npm run lint`, `npm test`, dan `npm run build` (termasuk status warning Next.js).
4. Matriks hasil uji E2E & RLS berbasis sesi aktual (status HTTP, respon penolakan RLS, verifikasi signed URL & cleanup Storage).
5. Daftar skenario uji GIS yang dijalankan (termasuk pengujian XSS popup & responsivitas mobile) beserta catatan kendala/limitasi secara jujur.

---

## 15. Daftar Keputusan Teknis yang Membutuhkan Persetujuan Pengguna

Sebelum eksekusi Fase 2 dimulai, mohon persetujuan/keputusan pengguna atas **7 poin** berikut:

1. **Hardening RLS & Migrasi Database (`F2.1`)**:
   - Apakah pengguna menyetujui penerapan migrasi baru pada remote Supabase untuk: (a) memperketat policy `UPDATE` `laporan_karhutla` & trigger penjaga kolom petugas, (b) memperketat `INSERT` `penanganan_log` ke laporan yang ditugaskan saja, (c) mengunci kolom verifikasi pada `INSERT` `laporan_karhutla`, dan (d) menambah `CHECK` pada `jenis_kejadian`?
2. **Pembersihan Opsional & Auth Security Advisor (`F2.1`)**:
   - Apakah pengguna menyetujui penerapan `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql`, penghapusan bucket kosong legacy `media-karhutla`, pengaktifan *Leaked Password Protection* di Supabase Auth, serta pembaruan `full_name` 3 akun demo dari `'Pengguna Baru'` ke nama deskriptif?
3. **Rekonsiliasi Timestamp Migrasi Lokal vs Remote**:
   - Apakah pengguna ingin menyelaraskan histori migrasi lokal (`20261118*`) terhadap remote (`20261120*`) sebelum menambahkan migrasi Fase 2, atau tetap menerapkan migrasi Fase 2 via Supabase MCP dengan penamaan timestamp sinkron ke depan?
4. **Upgrade Keamanan Next.js (`16.4.0` → `16.4.6`)**:
   - `npm audit` mengonfirmasi 2 kerentanan **Critical** & 1 **High** (DoS Server Actions) pada `next@16.4.0` yang diperbaiki melalui patch non-breaking `next@16.4.6`. **Sangat disarankan** untuk dijalankan di `F2.1` (beserta evaluasi migrasi `middleware.js` → `proxy.js`). Apakah pengguna menyetujui upgrade `next@16.4.6` di `F2.1`?
5. **Pemilihan Library GIS (`F2.3`)**:
   - Disarankan: **Vanilla `leaflet` + `leaflet.markercluster`** (dibungkus komponen React 19 `ssr: false` — bebas konflik peer-dependency React 19 / React Compiler). Apakah pengguna menyetujui pilihan ini atau menginginkan `react-leaflet` v5 / `maplibre-gl`?
6. **Aturan Validasi Form Pelaporan (`F2.4`)**:
   - (a) Apakah **foto bukti awal wajib minimal 1 foto** saat mengirim laporan, atau opsional (0–3 foto)? *(Rekomendasi: opsional 0–3 foto di tahap demo/uji, atau minimal 1 foto untuk validitas lapangan — pilih sesuai kebutuhan operasional).*
   - (b) Apakah koordinat di luar batas Indonesia (`lat -11.5..6.5`, `lng 94.5..142.0`) **diblokir keras** atau hanya menampilkan **peringatan konfirmasi**? *(Rekomendasi: blokir keras di server/client kecuali ada alasan operasional di luar RI).*
7. **Strategi Upload Multi-Foto (`F2.1` & `F2.4`)**:
   - Disarankan: Naikkan `experimental.serverActions.bodySizeLimit` di `next.config.mjs` ke `'16mb'` (tetap validasi *magic bytes* penuh di server via `createLaporanAction`, maksimal 3 foto × 5 MB). Alternatif: Direct client upload ke Supabase Storage + server metadata commit. Apakah pengguna menyetujui pendekatan Server Action `'16mb'`?

---

## 16. Hal yang TIDAK Termasuk dalam Scope FASE 2

Untuk menjaga fokus, stabilitas, dan kepatuhan pada pembagian fase `AGENTS.md`, item berikut secara eksplisit **TIDAK dikerjakan pada Fase 2**:

1. **Verifikasi, Penolakan, Penugasan Petugas, dan Update Penanganan Lapangan** (UI & Server Actions persetujuan/penolakan laporan oleh Admin, assign/reassign petugas, update status `ditangani` → `selesai`, unggah foto penanganan/selesai, input `penanganan_log`) → **Scope Fase 3**.
2. **Dashboard Analitik Lanjutan & Pelaporan Statistik** (grafik tren waktu, heatmap sebaran, ekspor CSV/PDF, metrik SLA waktu respons) → **Scope Fase 4**.
3. **Manajemen Pengguna Lanjutan & Edit Profil Lengkap** (ubah role pengguna & assign `wilayah_id` oleh Admin di `/admin/pengguna`, ubah profil/kata sandi mandiri) → **Scope Fase 4** *(kecuali pembaruan opsional nama 3 akun demo bila disetujui)*.
4. **Aktivasi PostGIS & Analisis Spasial Server-Side** (poligon batas administrasi `geometry`, query radius `ST_DWithin`, deteksi wilayah otomatis via `ST_Contains`, gambar poligon luas terbakar) → **Evaluasi Fase 4+**.
5. **Integrasi Data Hotspot Satelit Eksternal** (NASA FIRMS / VIIRS / MODIS / Sipongi API) → **Di luar scope Fase 2** (peta Fase 2 khusus memetakan laporan masyarakat sesuai `AGENTS.md`).
6. **Pengujian Beban Produksi, CI/CD Pipeline, & Deployment Produksi** → **Scope Fase 5**.
