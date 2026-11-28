# Laporan Bahasa, Framework, Library & Teknologi — HotMap (SIPKARHUTLA)

- **Nama Aplikasi:** HotMap (SIPKARHUTLA — Sistem Informasi Web GIS Operasional Karhutla)
- **Direktori Aplikasi:** `hotspot-khartula/`
- **Tanggal Laporan:** 2026-11-28
- **Referensi Commit:** `main` (`19a5586`)
- **Sumber Data:** Verifikasi langsung terhadap `hotspot-khartula/package.json`, `hotspot-khartula/package-lock.json`, kode sumber `src/`, migrasi `supabase/migrations/`, serta database PostgreSQL Supabase (`twhclfubwvahcbgohckx`).

---

## 1. Bahasa Pemrograman & Format Kode

| Bahasa / Format | Ekstensi & Jumlah File di Repo | Peran dalam Aplikasi |
|---|---:|---|
| **JavaScript (ES Modules)** | `.js` (55), `.mjs` (9) | Logika aplikasi Next.js App Router (halaman, Server Actions, middleware, utilitas GIS, caching, normalizer data, konfigurasi, dan unit test). |
| **JSX (React)** | `.jsx` (29) | Komponen antarmuka pengguna (Landing, Peta Leaflet, Dashboard multi-role, Form pelaporan, Lightbox, Navbar, Footer). |
| **SQL & PL/pgSQL** | `.sql` (10) | Skema database PostgreSQL, migrasi, indeks, constraint, Row Level Security (RLS), trigger sinkronisasi/guard kolom, RPC transaksional, dan seed data. |
| **CSS3 (Tailwind CSS v4)** | `.css` (1) | Design tokens organik-editorial, animasi UI halus (`prefers-reduced-motion`), serta kustomisasi tampilan Leaflet & MarkerCluster (`src/app/globals.css`). |
| **JSON** | `.json` (4) | Manifest dependensi (`package.json`, `package-lock.json`) dan konfigurasi alias path (`jsconfig.json`). |
| **SVG / WebP / PNG / ICO** | `.svg` (7), `.webp` (1), `.png` (1), `.ico` (1) | Logo vektor HotMap, favicon/app icons (`icon.svg`, `favicon.ico`, `apple-icon.png`), dan foto hero terkompresi (`hero-forest.webp`). |
| **Markdown** | `.md` (51) | Dokumentasi proyek, laporan fase, panduan audit, dan laporan kepatuhan teknis (`AUDIT_REPORT.md`). |

---

## 2. Framework & Runtime Utama

| Teknologi | Versi Terpasang | Peran & Fitur yang Digunakan |
|---|---|---|
| **Next.js** | `16.4.6` | Framework full-stack utama menggunakan **App Router**, **React Server Components (RSC)**, **Server Actions**, **Middleware** (proteksi route & refresh sesi SSR), **Turbopack** (build & dev), **`next/image`** (optimisasi AVIF/WebP), **`next/font/google`**, **`unstable_cache` / `revalidateTag`**, dan file-based metadata icons (`icon.svg`, `favicon.ico`, `apple-icon.png`). |
| **React & React DOM** | `19.3.0` | Library antarmuka pengguna dengan hooks React 19 (`useActionState`, `useTransition`, `useSyncExternalStore`, React `cache()`). |
| **React Compiler** (`babel-plugin-react-compiler`) | `1.0.0` | Optimisasi kompilasi komponen React otomatis (diaktifkan melalui `reactCompiler: true` di `next.config.mjs`). |
| **Node.js** | `v24.20.0` | Runtime server lokal, build tooling, skrip utilitas (`scripts/`), dan built-in test runner (`node --test`). |

---

## 3. Library Styling, UI & Tipografi

| Library / Teknologi | Versi Terpasang | Peran dalam Aplikasi |
|---|---|---|
| **Tailwind CSS** | `4.3.5` | Utility-first CSS framework (`@import "tailwindcss"`, `@theme inline`) untuk seluruh tata letak responsif desktop & mobile dengan tema organik-editorial. |
| **@tailwindcss/postcss** | `4.3.5` | Integrasi PostCSS untuk kompilasi Tailwind CSS v4 (`postcss.config.mjs`). |
| **Google Fonts (`next/font/google`)** | Bawaan Next.js | Self-hosted font **Playfair Display** (heading serif), **Inter** (teks UI sans-serif), dan **Geist Mono** (koordinat/data monospace). |
| **CSS Animations & Browser APIs** | Standar Web | Keyframe GPU-composited (`transform`/`opacity`), `IntersectionObserver` (`RevealOnScroll.jsx` & lazy-mount peta Beranda), serta dukungan aksesibilitas `prefers-reduced-motion`. |

---

## 4. Library & Teknologi Web GIS (Pemetaan)

| Library / Layanan | Versi / Tipe | Peran dalam Aplikasi |
|---|---|---|
| **Leaflet** | `1.9.4` | Engine peta GIS interaktif (marker berbasis status laporan, popup DOM aman anti-XSS, `flyTo`/`fitBounds`, Coordinate Picker drag/click). |
| **Leaflet.markercluster** | `1.5.3` | Pengelompokan (clustering) marker titik laporan otomatis dengan badge warna berjenjang dan `zoomToShowLayer()` saat fokus dari tabel. |
| **OpenStreetMap (OSM)** | Tile Layer | Basemap default **Peta Jalan (OSM)** (`tile.openstreetmap.org`). |
| **Esri World Imagery (ArcGIS)** | Tile Layer | Basemap **Citra Satelit** (`server.arcgisonline.com`). |
| **OpenTopoMap** | Tile Layer | Basemap **Topografi** (`tile.opentopomap.org`) pada halaman peta operasional lengkap. |
| **Browser Geolocation & ResizeObserver API** | Standar Web | Deteksi koordinat perangkat pada form pelaporan (`CoordinatePickerMap.jsx`) dan sinkronisasi ukuran kanvas Leaflet (`HotmapCanvas.jsx`) agar tile tidak terpotong. |

---

## 5. Backend, Database, Autentikasi & Storage

| Teknologi / Library | Versi Terpasang | Peran dalam Aplikasi |
|---|---|---|
| **@supabase/supabase-js** | `2.119.0` | Klien utama untuk query database PostgreSQL, RPC, autentikasi, dan manajemen berkas Supabase Storage. |
| **@supabase/ssr** | `0.12.7` | Integrasi sesi autentikasi berbasis cookie HTTP-only untuk Next.js App Router (Server Components, Server Actions, dan Middleware). |
| **Supabase PostgreSQL** | `17.11` | Database relasional utama untuk tabel `profiles`, `wilayah`, `laporan_karhutla`, `laporan_foto`, `penugasan_laporan`, `penanganan_log`, `laporan_riwayat_status`, dan `berita`. |
| **PostgreSQL RLS, Trigger & RPC** | Native Postgres | Otorisasi server & database berbasis role (`admin`, `petugas`, `pelapor`, `anon`), trigger `trg_sync_laporan_petugas` & `trg_guard_laporan_update_columns`, serta transaksi atomik `assign_petugas_atomic` & `update_penanganan_atomic` (`SECURITY INVOKER`). |
| **Supabase Auth** | Managed Service | Autentikasi email/password, registrasi pelapor (dengan trigger pembuatan profil otomatis), manajemen sesi JWT, dan fitur *Fast Login* berbasis env server-only. |
| **Supabase Storage** | Managed Service | Penyimpanan gambar pada bucket privat `laporan-bukti` (akses via *signed URL* + RLS) dan bucket publik `berita-images`, dilengkapi validasi MIME, ukuran maks 5 MB, serta pemeriksaan *magic bytes* fail-closed (`src/lib/storage.js`). |

---

## 6. Teknologi Caching & Optimisasi Performa

| Lapisan Caching | Implementasi | Fungsi |
|---|---|---|
| **Next.js Persistent Data Cache** | `unstable_cache` + `revalidateTag` (`src/lib/public-cache.js`) | Menyimpan hasil query publik lintas request di server dan otomatis diinvalidasi saat mutasi laporan/berita/wilayah. |
| **Server In-Memory & Request Deduplication** | `src/lib/server-cache.js` + React `cache()` | Deduplikasi request dalam penerbangan (*in-flight*) dan cache dataset terisolasi per scope pengguna (`admin`, `petugas:<uid>`, `pelapor:<uid>`, `anon`). |
| **Next.js Router Client Cache** | `experimental.staleTimes` (`next.config.mjs`) | Mempercepat perpindahan halaman (`dynamic: 60s`, `static: 300s`). |
| **Browser Cache (`localStorage`)** | `src/lib/client-cache.js` | Menyimpan preferensi basemap pengguna dan snapshot data publik ber-TTL sebagai fallback ringan. |
| **Service Worker (`Cache Storage`)** | `public/sw.js` + `CacheRegistrar.jsx` | Cache-first untuk tile peta GIS (maks 250 tile) dan stale-while-revalidate untuk aset `/images/*` serta bundle statis tanpa menyentuh auth/API Supabase. |
| **HTTP Cache & Compression** | `next.config.mjs` (`compress: true`, `headers()`) | Kompresi respons HTTP dan header `Cache-Control: public, max-age=31536000, immutable` untuk gambar lokal. |

---

## 7. Kualitas Kode, Pengujian & Infrastruktur Deployment

| Kategori | Teknologi / Versi | Keterangan |
|---|---|---|
| **Linter** | **ESLint** `9.39.5` + **`eslint-config-next`** `16.4.6` | Flat config (`eslint.config.mjs`) dengan aturan Core Web Vitals & React Hooks/Compiler. |
| **Automated Unit Testing** | **Node.js Built-in Test Runner** (`node --test`) | 14 unit test (`tests/gis.test.mjs`, `workflow.test.mjs`, `storage.test.mjs`, `server-cache.test.mjs`, `client-cache.test.mjs`). |
| **Version Control** | **Git & GitHub** | Repository `https://github.com/kejulipat/HotMap` (branch aktif tunggal: `main`). |
| **Hosting & Deployment** | **Vercel** | Platform hosting & CI/CD otomatis Next.js (`https://petahotpsotindonesia.vercel.app/`). |
| **Cloud Backend** | **Supabase Cloud** | Managed PostgreSQL 17.11, Auth, dan Object Storage (`twhclfubwvahcbgohckx`). |
