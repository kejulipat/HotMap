# HOTMAP — PROJECT GLOBAL INSTRUCTIONS

## Project Identity

HotMap adalah aplikasi Web GIS untuk operasional penanganan kebakaran hutan dan lahan (karhutla).

Repository: https://github.com/kejulipat/HotMap

Direktori aplikasi Next.js: `hotspot-khartula/`

## Technology Stack

- Next.js 16 App Router
- React 19
- JavaScript / JSX
- Supabase
- Supabase Auth
- Supabase Storage
- Tailwind CSS 4

Gunakan teknologi yang sudah tersedia. Jangan mengganti stack tanpa alasan teknis yang jelas.

## Primary Development Goals

HotMap harus mendukung:
1. Pelaporan kejadian karhutla.
2. Pemetaan lokasi kejadian.
3. Verifikasi laporan.
4. Penugasan petugas.
5. Pemantauan penanganan.
6. Dashboard operasional.
7. Pengelolaan berita dan informasi.

## Repository Rules

- Selalu periksa kode aktual sebelum melakukan perubahan.
- Jangan membuat ulang aplikasi dari awal.
- Pertahankan fitur yang sudah berjalan.
- Jangan mengasumsikan database schema.
- Jangan membuat tabel atau kolom duplikat.
- Jangan membuat halaman duplikat.
- Gunakan reusable components.
- Ikuti pola arsitektur yang sudah ada.
- Jangan mengubah file di luar cakupan tugas tanpa alasan dan persetujuan.

## Page and Routing Rules

- Audit seluruh halaman di `src/app/`.
- Identifikasi halaman yang sudah selesai, placeholder, belum dibuat, dan perlu diperbaiki.
- Setiap halaman yang dibutuhkan harus memiliki route yang valid.
- Seluruh halaman harus terhubung dengan navigasi yang sesuai.
- Tidak boleh ada dead links.
- Tidak boleh ada menu yang mengarah ke halaman 404.
- Navigasi desktop dan mobile harus berfungsi.
- Tampilkan active state pada menu.
- Gunakan menu berdasarkan role pengguna.
- Lindungi route dan operasi database dengan otorisasi server, bukan hanya menyembunyikan menu.

## User Roles

Gunakan role yang benar-benar tersedia dalam implementasi Supabase.

Target peran:
- Admin: mengelola laporan, pengguna, wilayah, dan penugasan.
- Petugas: melihat penugasan dan memperbarui progres.
- Pelapor: membuat laporan dan melihat laporan miliknya.

## GIS Rules

- Gunakan peta interaktif untuk menampilkan lokasi laporan.
- Marker harus berasal dari koordinat laporan yang valid.
- Bedakan marker berdasarkan status laporan.
- Peta dan daftar laporan harus saling terintegrasi.
- Jangan menganggap laporan warga sebagai deteksi hotspot satelit.
- Evaluasi library GIS sebelum menambah dependency.
- Jangan mengarang koordinat kejadian.

## Supabase and Security Rules

- Gunakan Supabase untuk sumber data aplikasi.
- Validasi input pada server.
- Terapkan RLS berdasarkan kebutuhan dan role.
- Jangan mengekspos service role key ke client.
- Batasi akses Storage.
- Catat perubahan status dan tindakan operasional.
- Jangan melewati autentikasi atau otorisasi demi mempermudah implementasi.

## Development Workflow

Pengerjaan HotMap dibagi menjadi enam fase:

- Fase 0: Audit repository dan pemetaan halaman.
- Fase 1: Fondasi aplikasi dan navigasi.
- Fase 2: Peta GIS dan pelaporan.
- Fase 3: Verifikasi, penugasan, dan penanganan.
- Fase 4: Dashboard dan monitoring.
- Fase 5: Integrasi dan pengujian akhir.

Kerjakan hanya fase yang diminta pengguna.

Jangan otomatis melanjutkan ke fase berikutnya.

Sebelum mengimplementasikan fase:
1. Periksa kondisi repository terbaru.
2. Identifikasi file yang relevan.
3. Susun rencana perubahan.
4. Periksa dampak terhadap fitur lain.

Setelah implementasi:
1. Laporkan file yang diubah.
2. Laporkan route dan navigasi yang dibuat.
3. Periksa seluruh link navigasi.
4. Jalankan lint dan build jika memungkinkan.
5. Laporkan hasil pengujian secara jujur.
6. Sebutkan pekerjaan yang belum selesai.

## Important Execution Rules

- Jangan membuat fitur palsu.
- Jangan meninggalkan tombol tanpa fungsi.
- Jangan menggunakan data dummy sebagai data produksi.
- Jangan mengklaim pengujian berhasil jika belum dijalankan.
- Jangan melakukan perubahan besar tanpa menjelaskan dampaknya.
- Prioritaskan kestabilan, keamanan, dan integrasi seluruh halaman.

Target akhir: HotMap menjadi Web GIS operasional karhutla yang terintegrasi, aman, responsif, dan memiliki navigasi lengkap.
