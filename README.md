# HotMap

**HotMap** (**SIPKARHUTLA**) adalah aplikasi Web GIS operasional untuk pelaporan, pemetaan, verifikasi, penugasan, dan pemantauan penanganan kebakaran hutan dan lahan (karhutla). Aplikasi utama Next.js berada pada direktori `hotspot-khartula/`.

## Live Deployment

- **Vercel:** [HotMap | Pemantauan Kebakaran Hutan & Lahan](https://petahotpsotindonesia.vercel.app/)

## Versi & Status

- **Versi Aplikasi:** `0.1.0`
- **Status Pengembangan:** Implementasi Fase 2 selesai pada branch `feature/fitur-peta` *(menunggu penyelesaian temuan audit independen & penerapan migration hardening RLS `005` ke Supabase remote sebelum masuk ke Fase 3)*.

## Teknologi yang Digunakan

| Teknologi | Versi | Kegunaan |
| --- | --- | --- |
| Next.js (App Router) | `16.4.0` | Framework web full-stack (SSR, Server Actions, Routing) |
| React & React DOM | `19.3.0` | Antarmuka pengguna (JSX) |
| Tailwind CSS | `^4` (`@tailwindcss/postcss` `^4.3.5`) | Styling responsif |
| Leaflet & MarkerCluster | `^1.9.4` / `^1.5.3` | Peta GIS interaktif, clustering marker, & *coordinate picker* |
| Supabase JS | `^2.119.0` | Database PostgreSQL, Auth, & Storage |
| Supabase SSR | `^0.12.7` | Integrasi sesi autentikasi server/client |
| ESLint | `^9` (`eslint-config-next` `16.4.0`) | Linting kode |

## Fitur

### Fitur Terimplementasi
- **Portal Publik (`/`, `/peta`, `/berita`):** Beranda pemantauan karhutla, halaman peta sebaran laporan warga, serta daftar dan detail berita dengan filter kategori & pencarian.
- **Peta GIS Interaktif (`Leaflet`):** Marker berdasarkan koordinat valid yang dibedakan warna per status (`menunggu_verifikasi`, `terverifikasi`, `ditangani`, `selesai`, `ditolak`), clustering otomatis (dapat di-toggle), 3 pilihan basemap (OpenStreetMap, Citra Satelit Esri, OpenTopoMap), sinkronisasi dua arah peta ↔ daftar laporan, serta *coordinate picker* dengan dukungan GPS.
- **Pelaporan Karhutla (`/pelapor/laporan/buat`):** Pengiriman laporan kejadian oleh pelapor/admin dengan validasi koordinat wilayah Indonesia dan unggah hingga 3 foto bukti ke bucket privat Supabase Storage (`laporan-bukti`).
- **Verifikasi, Penugasan & Penanganan:** Panel admin untuk verifikasi/penolakan laporan, penentuan tingkat keparahan, dan penugasan petugas (`/admin/laporan/[id]`), serta panel tindak lanjut lapangan dan unggah bukti penanganan untuk petugas (`/petugas/laporan/[id]`) lengkap dengan riwayat status.
- **Dashboard & Analitik Multi-Role (`/admin`, `/petugas`, `/pelapor`):** Kartu ringkasan status akurat (`count: exact`), distribusi laporan per wilayah, tren 14 hari terakhir, statistik penugasan, dan log aktivitas petugas terbaru.
- **Manajemen Administrasi (`/admin/wilayah`, `/admin/pengguna`, `/admin/berita`):** CRUD data master wilayah beserta koordinat pusat, pengelolaan role/wilayah pengguna, CRUD berita karhutla, serta pembaruan profil mandiri (`/pelapor/profil`, `/petugas/profil`).
- **Autentikasi, RBAC & Fast Login:** Login/registrasi Supabase Auth, proteksi route berbasis role (**Admin**, **Petugas**, **Pelapor**), dan Fast Login satu klik untuk pengujian role pada lingkungan development/preview (`ENABLE_FAST_LOGIN` dan `DEMO_*`, diproses di server tanpa mengekspos kredensial ke client).

### Catatan & Tahap Lanjutan
- **Titik Peta:** Peta menampilkan laporan kejadian dari masyarakat (bukan deteksi hotspot satelit eksternal).
- **Fase 3 (Berikutnya):** Penguatan lanjutan alur verifikasi, penugasan, dan penanganan serta penyelesaian item audit Fase 2 (termasuk penerapan `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` ke Supabase remote).

## Menjalankan Secara Lokal

```bash
cd hotspot-khartula
npm install
cp .env.example .env.local
```

Lengkapi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` pada `.env.local` (serta variabel `DEMO_*` bila menggunakan Fast Login), lalu jalankan:

```bash
npm run dev
```

Untuk verifikasi pengujian dan build produksi:

```bash
npm test
npm run lint
npm run build
npm run start
```
