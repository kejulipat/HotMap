# FASE 2 — COMPLETION REPORT (HOTMAP)

- **Proyek**: HOTMAP (`hotspot-khartula/`) — Web GIS Operasional Karhutla
- **Mode Eksekusi**: Full Implementation — One Shot (Fase 2)
- **Tanggal Penyelesaian**: 2026-11-21
- **Status Implementasi**: **SELESAI DI SISI KODE & MIGRATION LOKAL — MENUNGGU PERSETUJUAN PENERAPAN MIGRATION/SEED REMOTE & AUDIT INDEPENDEN GEMINI HYDROGEN**
- **Supabase Project Ref (Read-Only Verified)**: `twhclfubwvahcbgohckx`

---

## 1. Executive Summary

Seluruh ruang lingkup implementasi **FASE 2 HOTMAP** (A s.d. H) telah selesai diimplementasikan pada repository aplikasi `hotspot-khartula/` beserta file migration hardening RLS dan seed master wilayah lokal pada `supabase/`.

Ringkasan pencapaian utama:
1. **Peta GIS Interaktif (`Leaflet` + `leaflet.markercluster`)**: Menggantikan 100% placeholder peta SVG pada seluruh 4 halaman peta (`/`, `/peta`, `/admin/peta`, `/petugas/peta`) serta menambahkan mini-map di detail laporan dan *coordinate picker* interaktif di formulir pelaporan.
2. **Alur Operasional End-to-End Karhutla**: Pelaporan oleh `pelapor` (koordinat peta + multi-foto privat ke `laporan-bukti` + rollback atomik + riwayat awal) → Verifikasi, penentuan prioritas & penugasan petugas oleh `admin` → Pembaruan progres lapangan & unggah bukti penanganan oleh `petugas` (terbatas ketat pada tugas miliknya) → Pemantauan status & riwayat audit oleh semua pihak berwenang.
3. **Dashboard Analitik Data Aktual**: Seluruh KPI status (`fetchExactStatusCounts`), distribusi wilayah, tren 14 hari, statistik penugasan, aktivitas petugas, dan ringkasan berita pada `/admin`, `/petugas`, dan `/pelapor` dihitung langsung dari data Supabase.
4. **Manajemen Administrasi Penuh**: CRUD Wilayah (`/admin/wilayah`), Manajemen Pengguna & Role (`/admin/pengguna`), Profil Mandiri (`/pelapor/profil`, `/petugas/profil`), Filter & Pencarian Berita (`/berita`), dan CRUD Berita (`/admin/berita`).
5. **Keamanan & Kualitas**: Validasi *magic bytes* gambar dibuat *fail-closed*, `serverActions.bodySizeLimit` dinaikkan ke `16mb`, proteksi DOM XSS pada popup Leaflet via DOM API (`textContent`), otorisasi server-side ketat pada seluruh mutasi, serta migration lokal hardening RLS (`20261121000500_fase2_rls_hardening_and_indexes.sql`) siap diterapkan setelah persetujuan pengguna.
6. **Pengujian Terverifikasi**: `npm run lint` (**0 error/warning**), `npm test` (**13/13 PASS**), `npm run build` (**26/26 route sukses**), dan uji E2E live lintas 3 role + `anon` (**38/38 PASS** dengan cleanup bersih).

> **Catatan Penting Validasi Independen**: Dokumen ini merupakan laporan implementer. Hasil implementasi **belum divalidasi secara independen** dan siap diperiksa oleh **Gemini Hydrogen**.

---

## 2. Branch dan Commit Sumber

- **Branch Sumber Pengembangan**: `preview/fast-login` (`e964dee` — mencakup `main` `f414b6f`, Fast Login Fase 1.5, serta optimisasi server TTL cache & loading skeleton).
- **Branch Preview Terpisah (Tidak Dicampur)**: `preview/no-fast-login` (`047c02d`) tetap terpisah dan tidak dicampur dengan pengembangan Fase 2.
- **Branch Kerja Fase 2**: Dibangun pada `feature/fase-2-one-shot` dan sesuai instruksi pengguna pada akhir pekerjaan diganti namanya menjadi `feature/fitur-peta` (setelah menghapus pointer branch lama `feature/fitur-peta`).
- **Status Fast Login**: Dipertahankan aktif pada branch pengembangan ini (terverifikasi pada `GET /login`).

---

## 3. Daftar Fitur yang Selesai

- **A. Fondasi & Integrasi Data**: `next.config.mjs` (`bodySizeLimit: "16mb"` + `staleTimes`), `verifyImageMagicBytes` fail-closed, 4 route error boundaries (`error.js`), perbaikan konflik CSS dark-mode, normalizer `waktu_kejadian`, `fetchExactStatusCounts`, `fetchAdminAnalytics`, serta `invalidateHotmapCache` di seluruh Server Actions.
- **B. Modul Pelaporan Karhutla**: Formulir aktif `/pelapor/laporan/buat` (`CreateLaporanForm`), `CoordinatePicker` (klik peta, drag marker, GPS, auto-flyTo wilayah, validasi batas Indonesia), multi-foto bukti (0–3 foto, pratinjau & hapus, rollback Storage atomik), pencatatan riwayat status awal, galeri `<img>` + lightbox, dan mini-map di detail laporan.
- **C. Modul Administrasi Laporan**: Filter multi-dimensi & pagination di `/admin/laporan`, panel verifikasi/tolak/status/prioritas (`verifyAndUpdateLaporanAction`), penugasan/pengalihan/pembatalan petugas (`assignPetugasAction`, `cancelPenugasanAction`), dan hapus laporan beserta cleanup Storage (`deleteLaporanAction`).
- **D. Modul Penugasan & Operasional Petugas**: Pemisahan tab *Tugas Saya* vs *Semua Laporan* di `/petugas`, `/petugas/laporan`, `/petugas/peta`; panel `PetugasPenangananPanel` dengan otorisasi server-side ketat (`laporan.petugas_id === user.id`), transisi status `terverifikasi -> ditangani -> selesai`, catatan lapangan, dan unggah foto bukti penanganan/selesai.
- **E. Riwayat & State Machine Status**: State machine terpusat pada `src/lib/workflow.js` dan pencatatan audit tak-terubah pada `public.laporan_riwayat_status` untuk setiap transisi.
- **F. Peta GIS & Visualisasi Spasial**: Engine reusable `HotmapCanvas` / `HotmapMap` berbasis `leaflet` + `leaflet.markercluster`, 3 basemap (OSM, Esri Satellite, OpenTopoMap), toggle clustering, fokus titik, reset RI, legenda 5 status, popup anti-XSS, penanganan koordinat tidak valid, sinkronisasi dua arah peta ↔ tabel pada `/`, `/peta`, `/admin/peta`, `/petugas/peta`.
- **G. Dashboard & Analitik**: Dashboard Admin (exact KPI, belum ditangani, distribusi wilayah, tren 14 hari, statistik penugasan, aktivitas petugas terbaru, ringkasan berita), Dashboard Petugas (Total Tugas Saya, Tugas Aktif, Tugas Selesai, daftar tugas terbaru), Dashboard Pelapor (exact KPI, status pemantauan, ringkasan tindak lanjut terakhir).
- **H. Manajemen Administrasi**: CRUD Wilayah (`/admin/wilayah`), Manajemen Pengguna & Role (`/admin/pengguna`, proteksi anti self-demotion), Edit Profil Mandiri (`/pelapor/profil`, `/petugas/profil`, tanpa eksposur kolom `role`), Filter & Pencarian Berita Publik (`/berita`).

---

## 4. Daftar File yang Dibuat atau Diubah

### File Baru (`supabase/`)
- `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql`
- `supabase/seed/002_wilayah_indonesia.sql`

### File Baru (`hotspot-khartula/`)
- `hotspot-khartula/src/lib/gis.js`
- `hotspot-khartula/src/lib/workflow.js`
- `hotspot-khartula/src/lib/actions/laporan.js`
- `hotspot-khartula/src/lib/actions/wilayah.js`
- `hotspot-khartula/src/lib/actions/users.js`
- `hotspot-khartula/src/components/map/HotmapCanvas.jsx`
- `hotspot-khartula/src/components/map/HotmapMap.jsx`
- `hotspot-khartula/src/components/map/CoordinatePickerMap.jsx`
- `hotspot-khartula/src/components/map/CoordinatePicker.jsx`
- `hotspot-khartula/src/components/map/PetaLaporanExplorer.jsx`
- `hotspot-khartula/src/components/laporan/CreateLaporanForm.jsx`
- `hotspot-khartula/src/components/laporan/FotoGalleryLightbox.jsx`
- `hotspot-khartula/src/components/laporan/AdminLaporanActionPanel.jsx`
- `hotspot-khartula/src/components/laporan/PetugasPenangananPanel.jsx`
- `hotspot-khartula/src/components/laporan/LaporanFilterTable.jsx`
- `hotspot-khartula/src/components/admin/AdminWilayahManager.jsx`
- `hotspot-khartula/src/components/admin/AdminUsersManager.jsx`
- `hotspot-khartula/src/components/berita/PublicBeritaExplorer.jsx`
- `hotspot-khartula/src/app/error.js`
- `hotspot-khartula/src/app/admin/error.js`
- `hotspot-khartula/src/app/petugas/error.js`
- `hotspot-khartula/src/app/pelapor/error.js`
- `hotspot-khartula/tests/gis.test.mjs`
- `hotspot-khartula/tests/workflow.test.mjs`
- `hotspot-khartula/tests/storage.test.mjs`
- `hotspot-khartula/tests/server-cache.test.mjs`

### File Diubah (`hotspot-khartula/`)
- `hotspot-khartula/package.json` & `package-lock.json` (tambah `leaflet`, `leaflet.markercluster`, script `test`)
- `hotspot-khartula/next.config.mjs` (`experimental.serverActions.bodySizeLimit: "16mb"`)
- `hotspot-khartula/src/app/layout.js` & `src/app/globals.css`
- `hotspot-khartula/src/lib/storage.js` (perbaikan fail-closed `verifyImageMagicBytes`)
- `hotspot-khartula/src/lib/normalizers.js` (`waktu_kejadian`, `fetchExactStatusCounts`, `fetchAdminAnalytics`)
- `hotspot-khartula/src/components/ui/SharedUI.jsx` (hapus placeholder SVG `MapOverviewBox`)
- `hotspot-khartula/src/components/ui/ProfileSummaryView.jsx` (tambah form edit profil diri sendiri)
- `hotspot-khartula/src/components/layout/DashboardShell.jsx`, `src/app/petugas/layout.js`, `src/app/pelapor/layout.js` (tautan balik Portal Admin)
- `hotspot-khartula/src/components/landing/LandingExplorer.jsx` (ganti SVG dengan `HotmapMap`)
- `hotspot-khartula/src/components/laporan/LaporanDetailView.jsx` (galeri lightbox + mini-map GIS + tautan Maps/OSM)
- `hotspot-khartula/src/app/peta/page.js`, `src/app/berita/page.js`
- `hotspot-khartula/src/app/pelapor/page.js`, `src/app/pelapor/laporan/page.js`, `src/app/pelapor/laporan/buat/page.js`, `src/app/pelapor/profil/page.js`
- `hotspot-khartula/src/app/petugas/page.js`, `src/app/petugas/peta/page.js`, `src/app/petugas/laporan/page.js`, `src/app/petugas/laporan/[id]/page.js`, `src/app/petugas/profil/page.js`
- `hotspot-khartula/src/app/admin/page.js`, `src/app/admin/peta/page.js`, `src/app/admin/laporan/page.js`, `src/app/admin/laporan/[id]/page.js`, `src/app/admin/wilayah/page.js`, `src/app/admin/pengguna/page.js`

### Dokumentasi Laporan (`docs/reports/`)
- `docs/reports/FASE_2_ARGON_COMPLETION_REPORT.md`
- `docs/reports/FASE_2_ARGON_TEST_MATRIX.md`

---

## 5. Perubahan Arsitektur

1. **Pemisahan Modul Client-Safe vs Server-Only**: Konstanta peran (`ROLE_LABELS`, `normalizeRole`) serta state machine (`workflow.js`) dan helper GIS (`gis.js`) dipisahkan tanpa mengimpor `next/headers`, mencegah kebocoran bundel server ke Client Components.
2. **Engine GIS Terpusat (`ssr: false`)**: Seluruh peta menggunakan dynamic wrapper `HotmapMap` & `CoordinatePicker` di atas vanilla `leaflet` + `leaflet.markercluster` agar kompatibel 100% dengan Next.js 16 Turbopack dan React 19 Compiler tanpa konflik peer-dependency.
3. **Upload Multi-Foto Atomik dengan Rollback**: Pada `createLaporanAction`, foto divalidasi (MIME, ekstensi, batas 5 MB, *magic bytes* fail-closed) dan diunggah ke `<uid>/<draftFolder>/...` sebelum insert DB; bila insert DB gagal, file Storage langsung dihapus otomatis.
4. **Agregasi Exact Count**: Kartu KPI status pada seluruh portal kini memakai `fetchExactStatusCounts` (`count: exact, head: true`) sehingga tidak terpotong oleh `limit` daftar tabel.

---

## 6. Perubahan Database

- Tidak ada perubahan DDL yang dijalankan langsung ke Supabase remote (mematuhi aturan Bagian 5 Master Prompt).
- Tidak ada tabel baru yang ditambahkan; seluruh fitur Fase 2 memanfaatkan 8 tabel inti `public` yang sudah ada (`wilayah`, `profiles`, `laporan_karhutla`, `laporan_foto`, `penugasan_laporan`, `laporan_riwayat_status`, `penanganan_log`, `berita`).
- **PostGIS tidak diaktifkan**: Evaluasi teknis mengonfirmasi kebutuhan spasial Fase 2 berbasis titik (`double precision` + `CHECK` + composite B-tree index `(latitude, longitude)`), sehingga PostGIS belum diperlukan.

---

## 7. Daftar Migration & Seed Lokal

1. **`supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql`** *(Status: LOKAL — Menunggu Persetujuan Penerapan Remote)*:
   - Constraint `CHECK` pada `laporan_karhutla.jenis_kejadian`.
   - Composite index `idx_laporan_karhutla_lat_lng` pada `(latitude, longitude)`.
   - Trigger `BEFORE UPDATE` `private.guard_laporan_update_columns()` mencegah role `petugas` mengubah kolom administratif/identitas laporan.
   - Policy `INSERT` `laporan_karhutla` mewajibkan `verified_by`, `verified_at`, `petugas_id`, `catatan_verifikasi` bernilai `NULL` untuk non-admin.
   - Policy `UPDATE` `laporan_karhutla` membatasi `petugas` hanya pada `petugas_id = (SELECT auth.uid())` dan transisi status valid (`terverifikasi`/`ditangani` → `ditangani`/`selesai`).
   - Policy `INSERT` `penanganan_log` membatasi `petugas` hanya pada laporan yang ditugaskan kepadanya.
   - Penyelarasan policy `SELECT` `storage.objects` bucket `laporan-bukti` dengan `laporan_foto`.
2. **`supabase/seed/002_wilayah_indonesia.sql`** *(Status: LOKAL — Menunggu Persetujuan / Dapat Juga Diisi via `/admin/wilayah`)*:
   - 12 wilayah prioritas karhutla Indonesia (Riau, Jambi, Sumatera Selatan, Kalimantan Barat/Tengah/Selatan/Timur, Sulawesi Selatan, NTT, Papua Selatan) dengan koordinat pusat terverifikasi, idempoten (`ON CONFLICT DO NOTHING`).

---

## 8. Perubahan RLS

- **Di sisi aplikasi (Aktif sekarang)**: Server Actions (`updatePenangananPetugasAction`, `verifyAndUpdateLaporanAction`, `assignPetugasAction`, `createLaporanAction`, `adminUpdateUserAction`, `updateMyProfileAction`, `wilayah.js`) menegakkan pemeriksaan role, kepemilikan, assignment `petugas_id === user.id`, dan transisi state machine di server sebelum menyentuh database.
- **Di sisi database PostgreSQL (Siap dalam migration 005)**: Pengetatan RLS + column-guard trigger untuk `laporan_karhutla`, `penanganan_log`, dan `storage.objects` telah ditulis menggunakan `(SELECT auth.uid())` dan `(SELECT private.has_role(...))` agar bebas regresi `auth_rls_initplan` dan `multiple_permissive_policies`. **Belum diterapkan ke remote karena menunggu persetujuan eksplisit pengguna.**

---

## 9. Perubahan Storage

- `verifyImageMagicBytes()` di `src/lib/storage.js` diperbaiki menjadi **fail-closed** (`return false` bila objek file tidak memiliki `.slice`).
- `next.config.mjs` menaikkan `experimental.serverActions.bodySizeLimit` menjadi `"16mb"` agar unggah 1–3 foto bukti (hingga 5 MB/foto) melalui Server Actions tidak terpotong HTTP `413`.
- Galeri foto bukti di `LaporanDetailView` ditingkatkan ke `FotoGalleryLightbox` (`<img alt=...>` + modal lightbox) menggunakan Signed URL berbatas waktu (1 jam) dari bucket privat `laporan-bukti`.
- Tidak ada perubahan langsung pada bucket/policy Storage remote.

---

## 10. Implementasi GIS

- **Library**: `leaflet` + `leaflet.markercluster` (Vanilla JS dalam komponen React 19 `ssr: false`).
- **Basemap**: OpenStreetMap Standard, Esri World Imagery (Satelit), OpenTopoMap (Topografi).
- **Fitur Aktif**: Marker dibedakan warna per 5 status (`STATUS_PIN_COLORS`), clustering otomatis (dapat di-toggle), popup anti-XSS berbasis DOM API (`textContent`), tombol *Fokus Titik* & *Reset RI*, filter wilayah/tanggal/status/prioritas/pencarian, sinkronisasi klik peta ↔ daftar, validasi koordinat Indonesia (`lat -11.5..6.5`, `lng 94.5..142.0`, tolak `(0, 0)`), GPS Geolocation picker, serta tautan eksternal Google Maps & OSM.
- **Transparansi Data Hotspot Satelit**: Sumber data hotspot satelit eksternal (mis. NASA FIRMS / Sipongi) membutuhkan API key/kredensial terpisah dan **tidak dibuatkan data palsu**. Peta menampilkan disclaimer permanen *"Titik menunjukkan laporan warga, bukan deteksi hotspot satelit."*

---

## 11. Implementasi Setiap Modul

| Modul | Route Utama | Status |
|---|---|---|
| Beranda & Peta Publik | `/`, `/peta` | **Selesai** (Leaflet interaktif, filter, sinkronisasi tabel) |
| Berita Publik & Admin | `/berita`, `/berita/[id]`, `/admin/berita` | **Selesai** (Filter kategori/search publik + CRUD Admin) |
| Pelaporan Karhutla | `/pelapor/laporan/buat`, `/pelapor/laporan`, `/pelapor/laporan/[id]` | **Selesai** (Map picker, multi-foto privat, riwayat) |
| Administrasi Laporan | `/admin/laporan`, `/admin/laporan/[id]`, `/admin/peta` | **Selesai** (Verifikasi, prioritas, penugasan, hapus, peta) |
| Operasional Petugas | `/petugas`, `/petugas/laporan`, `/petugas/laporan/[id]`, `/petugas/peta` | **Selesai** (Filter Tugas Saya, update progres & bukti, guard server) |
| Dashboard Analitik | `/admin`, `/petugas`, `/pelapor` | **Selesai** (100% data aktual Supabase) |
| Manajemen Wilayah | `/admin/wilayah` | **Selesai** (CRUD penuh + guard FK + validasi koordinat RI) |
| Manajemen Pengguna & Profil | `/admin/pengguna`, `/pelapor/profil`, `/petugas/profil` | **Selesai** (Edit role/wilayah Admin, edit profil mandiri non-role) |

---

## 12. Pengujian yang Dilakukan

1. **Static Analysis (`npm run lint`)**: ESLint Next.js 16 + React 19 Compiler rules.
2. **Unit Testing (`npm test` — `node --test tests/*.test.mjs`)**: 13 skenario pada `gis.js`, `workflow.js`, `storage.js`, dan `server-cache.js`.
3. **Production Build (`npm run build`)**: Kompilasi penuh Turbopack Next.js 16 untuk 26 route.
4. **Live HTTP & End-to-End Test (`next start` @ `127.0.0.1:3098` + Live Supabase `twhclfubwvahcbgohckx`)**: 38 skenario mencakup Auth 3 role, public routes, Fast Login UI, redirect `anon`, RLS negatif, alur bisnis penuh (Admin Wilayah → Pelapor Laporan & Foto → Admin Verifikasi & Penugasan → Trigger Sync → Petugas Penanganan & Foto → Pelapor Cek Hasil & 4 Riwayat Audit), dan cleanup penuh ke baseline `0` baris uji.

---

## 13. Hasil Lint dan Build

- **`npm run lint`**: **PASS** (`exit code 0`, `0` error, `0` warning).
- **`npm test`**: **PASS** (`13/13` tests passed, `0` failed).
- **`npm run build`**: **PASS** (`exit code 0`, compiled in `3.1s`, seluruh 26 route sukses).
  - *Catatan build*: Next.js `16.4.0` menampilkan rekomendasi upgrade keamanan (`next@16.4.6`) dan peringatan deprecate `middleware.js` → `proxy.js` (tidak dilakukan upgrade paksa pada branch ini agar tetap non-breaking tanpa persetujuan eksplisit).

---

## 14. Hasil Pengujian Role

- **Admin (`admin.demo@hotmap.local`)**: Normal Login PASS, buat/hapus wilayah uji PASS, lihat laporan `menunggu_verifikasi` PASS, signed URL foto pelapor PASS, verifikasi & set prioritas PASS, penugasan petugas & sinkronisasi trigger `petugas_id` PASS.
- **Petugas (`petugas.demo@hotmap.local`)**: Normal Login PASS, ditolak `INSERT wilayah` (`42501`) PASS, ditolak eskalasi `profiles.role` (`42501`) PASS, baca signed URL foto pelapor pada tugasnya PASS, unggah foto penanganan & update `ditangani` → `selesai` + log PASS.
- **Pelapor (`pelapor.demo@hotmap.local`)**: Normal Login PASS, ditolak `INSERT wilayah` (`42501`) PASS, ditolak eskalasi `profiles.role` (`42501`) PASS, ditolak `INSERT status='terverifikasi'` (`42501`) PASS, unggah foto privat + buat laporan + baca 4 riwayat akhir PASS.
- **Anon**: `/`, `/peta`, `/berita`, `/login`, `/register` HTTP `200` PASS; `/admin`, `/petugas`, `/pelapor`, `/dashboard`, `/test-db` HTTP `307` → `/login?redirectTo=...` PASS; tidak dapat membaca laporan `menunggu_verifikasi` PASS; dapat membaca laporan `terverifikasi` PASS.

---

## 15. Hasil Pengujian End-to-End

Total **38/38 skenario PASS (`0 FAIL`)**. Setelah pengujian selesai, seluruh objek Storage dan baris uji (`wilayah`, `laporan_karhutla`, `laporan_foto`, `penugasan_laporan`, `laporan_riwayat_status`, `penanganan_log`) dibersihkan dan diverifikasi kembali ke baseline (`0` baris uji tersisa). Detail lengkap tersedia pada [FASE_2_ARGON_TEST_MATRIX.md](file:///D:/Projek/01%20-%20Coding/Pemrograman%20Web/Tugas%20Akhir/HotMap/docs/reports/FASE_2_ARGON_TEST_MATRIX.md).

---

## 16. Fitur yang Belum Selesai / Pending

1. **Penerapan Migration 005 ke Supabase Remote (`PENDING APPROVAL`)**: File `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` siap di lokal, belum diterapkan ke remote sesuai aturan keamanan Master Prompt.
2. **Seed Data Master Wilayah Remote (`PENDING APPROVAL`)**: Tabel `public.wilayah` pada remote masih `0` baris karena tidak boleh mengubah data produksi tanpa izin; pengguna dapat menjalankan `supabase/seed/002_wilayah_indonesia.sql` atau menambah wilayah langsung melalui UI `/admin/wilayah`.
3. **Layer Hotspot Satelit Eksternal (`DI LUAR KREDENSIAL TERSEDIA`)**: Integrasi API eksternal (NASA FIRMS / Sipongi) belum diaktifkan karena memerlukan API key layanan eksternal; peta secara jujur hanya memetakan laporan warga.
4. **Browser Headless Visual/DOM E2E**: Pengujian HTTP + API/RLS/Storage end-to-end dijalankan langsung (`38/38 PASS`), sedangkan interaksi klik browser headless penuh (drag marker Leaflet di browser nyata) ditandai `NOT TESTED` secara otomatis dan direkomendasikan diverifikasi pada audit Gemini Hydrogen.

---

## 17. Risiko yang Masih Tersisa

1. **Celah Direct-API RLS Remote Sebelum Migration 005 Diterapkan**: Sebelum `20261121000500_fase2_rls_hardening_and_indexes.sql` diterapkan ke remote, proteksi least-privilege `petugas` pada `UPDATE laporan_karhutla` dan `INSERT penanganan_log` baru aktif pada lapisan **Next.js Server Actions** (`src/lib/actions/laporan.js`), belum di level PostgREST direct API.
2. **Kerentanan Patch `next@16.4.0`**: Next.js `16.4.0` memiliki rekomendasi patch keamanan ke `16.4.6` (tersedia pula branch terpisah `chore/next-upgrade-16.4.6` di repository).
3. **Supabase Auth Security Advisor**: `auth_leaked_password_protection` masih berstatus `WARN` pada dashboard Supabase Auth.
4. **Perbedaan Timestamp Migration Lokal vs Remote**: Jangan menjalankan `supabase db push` sebelum rekonsiliasi histori `supabase_migrations`.

---

## 18. Perubahan Remote yang Menunggu Persetujuan

1. Terapkan `supabase/migrations/20261121000500_fase2_rls_hardening_and_indexes.sql` pada project Supabase `twhclfubwvahcbgohckx` untuk menutup celah RLS direct-API `petugas` dan `pelapor`.
2. Terapkan `supabase/seed/002_wilayah_indonesia.sql` (atau tambahkan wilayah via `/admin/wilayah`) agar `public.wilayah` memiliki data master siap pakai.
3. *(Opsional)* Terapkan `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` dan aktifkan **Leaked Password Protection** pada Supabase Dashboard → Authentication.
4. *(Opsional)* Merge/upgrade keamanan `next@16.4.6` setelah audit Fase 2.

---

## 19. Instruksi Menjalankan Aplikasi

```bash
cd hotspot-khartula
npm install
npm test
npm run lint
npm run build
npm run start
```
Untuk mode pengembangan lokal:
```bash
npm run dev
```
Pastikan `.env.local` berisi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (serta `ENABLE_FAST_LOGIN=true` dan kredensial `DEMO_*` bila menggunakan Fast Login pada lingkungan dev).

---

## 20. Rekomendasi Tahap Selanjutnya

1. Jalankan **Audit Independen oleh Gemini Hydrogen** terhadap branch ini beserta laporan & test matrix.
2. Setelah pengguna menyetujui, terapkan migration `20261121000500_fase2_rls_hardening_and_indexes.sql` dan seed `002_wilayah_indonesia.sql` ke Supabase remote, lalu jalankan ulang uji negatif RLS direct-API untuk mengonfirmasi penolakan `42501` di level database.
3. Pertimbangkan upgrade `next` ke `16.4.6` dan migrasi `src/middleware.js` → `src/proxy.js`.
