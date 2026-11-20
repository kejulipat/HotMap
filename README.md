# HotMap

**HotMap** adalah aplikasi Web GIS operasional untuk pelaporan, pemetaan, dan pemantauan penanganan kebakaran hutan dan lahan (karhutla). Aplikasi utama berada pada direktori `hotspot-khartula/`.

## Versi

- **Versi Aplikasi:** `0.1.0`
- **Status Pengembangan:** Tahap Fondasi & Pra-Fase 2 (Fase 1.5 selesai)

## Teknologi yang Digunakan

| Teknologi | Versi | Kegunaan |
| --- | --- | --- |
| Next.js (App Router) | `16.4.0` | Framework web full-stack |
| React & React DOM | `19.3.0` | Antarmuka pengguna (JSX) |
| Tailwind CSS | `^4` (`@tailwindcss/postcss` `^4.3.5`) | Styling responsif |
| Supabase JS | `^2.119.0` | Database PostgreSQL, Auth, & Storage |
| Supabase SSR | `^0.12.7` | Integrasi sesi autentikasi server/client |
| ESLint | `^9` (`eslint-config-next` `16.4.0`) | Linting kode |

## Fitur

### Fitur Aktif
- **Portal Publik:** Beranda ringkasan kejadian, halaman peta sebaran laporan, serta berita dan informasi karhutla.
- **Autentikasi & Hak Akses Berbasis Role:** Login, registrasi, proteksi route, dan kebijakan Row Level Security (RLS) untuk peran **Admin**, **Petugas**, dan **Pelapor**.
- **Dashboard Multi-Role:** Navigasi dan halaman khusus sesuai peran untuk memantau laporan, wilayah, pengguna, dan profil.
- **Manajemen Berita:** Pengelolaan artikel berita oleh Admin beserta unggah gambar melalui Supabase Storage.
- **Monitoring Data Laporan:** Daftar laporan, detail kejadian, dan riwayat penanganan yang terhubung langsung ke Supabase.

### Fitur Tahap Lanjutan (Roadmap)
- **Peta Interaktif & Pelaporan (Fase 2):** Peta GIS interaktif, input laporan warga dengan pemilih koordinat, dan unggah foto bukti.
- **Verifikasi & Penanganan (Fase 3):** Verifikasi laporan, penugasan petugas lapangan, serta pembaruan progres penanganan.
- **Dashboard Operasional Lanjutan (Fase 4):** Visualisasi dan analitik monitoring operasional.
