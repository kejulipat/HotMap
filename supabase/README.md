# Dokumentasi Database & Migration HotMap (Fase 1.5 — Reconciled & Hardened)

Direktori ini berisi SQL migration terstruktur dan skrip seed non-destruktif yang telah diselaraskan dengan **Supabase Postgres Best Practices** sebelum memasuki **Fase 2 (Web GIS & Pelaporan)**.

## 1. Skema Tabel & Relasi

- `public.wilayah` (`id`, `nama_wilayah`, `kabupaten_kota`, `center_lat`, `center_lng`, `created_at`)
  - Dilengkapi `CHECK` rentang koordinat (`-90..90`, `-180..180`), `CHECK` teks tidak kosong, dan `UNIQUE (nama_wilayah, kabupaten_kota)`.
- `public.profiles` (`id`, `full_name`, `role`, `wilayah_id`, `created_at`)
  - Memiliki index FK `idx_profiles_wilayah_id` dan kebijakan RLS `UPDATE` yang mencegah *privilege escalation* kolom `role` oleh non-admin.
- `public.laporan_karhutla` (`id`, `pelapor_id`, `wilayah_id`, `judul`, `deskripsi`, `latitude`, `longitude`, `foto_kejadian_url`, `status`, `catatan_verifikasi`, `verified_by`, `verified_at`, `petugas_id`, `waktu_kejadian`, `jenis_kejadian`, `alamat_lokasi`, `estimasi_luas`, `tingkat_keparahan`, `created_at`, `updated_at`)
  - Kolom penugasan disatukan menjadi **`petugas_id`** (menggantikan `assigned_to`).
  - Dilengkapi index FK (`pelapor_id`, `petugas_id`, `verified_by`), composite index (`(wilayah_id, status, created_at DESC)`, `(status, created_at DESC)`), `CHECK` koordinat GIS, serta trigger `trg_laporan_karhutla_updated_at`.
- `public.penanganan_log` (`id`, `laporan_id`, `petugas_id`, `status_update`, `catatan_penanganan`, `foto_bukti_url`, `created_at`)
  - Dipertahankan untuk catatan lapangan petugas dengan index `idx_penanganan_log_laporan_id` & `idx_penanganan_log_petugas_id` serta RLS terikat visibilitas laporan.
- `public.berita` (`id`, `judul`, `slug`, `ringkasan`, `isi`, `kategori`, `status`, `gambar_path`, `gambar_url`, `author_id`, `published_at`, `created_at`, `updated_at`)
- `public.laporan_foto` (`id`, `laporan_id`, `storage_path`, `uploaded_by`, `jenis_foto`, `mime_type`, `file_size`, `created_at`)
- `public.penugasan_laporan` (`id`, `laporan_id`, `petugas_id`, `assigned_by`, `status_penugasan`, `catatan`, `assigned_at`, `completed_at`)
- `public.laporan_riwayat_status` (`id`, `laporan_id`, `status_sebelumnya`, `status_baru`, `changed_by`, `catatan`, `created_at`)

## 2. Daftar Migration & Urutan Penerapan

| Urutan | File | Cakupan |
|---|---|---|
| 1 | `migrations/20261118000100_fase1_5_berita.sql` | Schema non-exposed `private` + `private.has_role(text[])` & `private.get_my_role()`, hardening `public.handle_new_user()` (`SET search_path = ''` + revoke RPC execute), `public.set_updated_at()`, tabel `public.berita`, index, dan RLS. |
| 2 | `migrations/20261118000200_fase1_5_laporan_penugasan_foto_riwayat.sql` | Penyatuan kolom `assigned_to` → `petugas_id`, `NOT NULL` pada `created_at`/`updated_at`, `CHECK` koordinat & teks, seluruh FK & composite index, tabel `laporan_foto`, `penugasan_laporan` (+ trigger sinkronisasi `private.sync_laporan_petugas_from_penugasan()`), `laporan_riwayat_status`, hardening `penanganan_log`, least-privilege `GRANT`, dan RLS bebas `auth_rls_initplan` & `multiple_permissive_policies`. |
| 3 | `migrations/20261118000300_fase1_5_storage_buckets_rls.sql` | Pembersihan policy/bucket legacy (`karhutla-media` / `media-karhutla`), pembuatan bucket publik `berita-images` dan bucket privat `laporan-bukti` (maks 5 MB, JPEG/PNG/WebP), serta kebijakan RLS `storage.objects`. |
| Seed | `seed/001_demo_accounts.sql` *(opsional)* | Membuat 3 akun demo (`admin.demo@hotmap.local`, `petugas.demo@hotmap.local`, `pelapor.demo@hotmap.local`) & menyinkronkan `public.profiles`. Alternatif otomatis: `hotspot-khartula/scripts/provision-demo-users.mjs`. |

## 3. Cara Menjalankan Provisioning Akun Demo

1. Tambahkan sementara `SUPABASE_SERVICE_ROLE_KEY=...` ke `hotspot-khartula/.env.local` (jangan di-commit).
2. Jalankan dari folder `hotspot-khartula/`:
   ```bash
   node --env-file=.env.local scripts/provision-demo-users.mjs
   ```
3. Skrip akan membuat/memperbarui 3 akun demo dengan password acak kuat, menyinkronkan `public.profiles`, dan mengisi `DEMO_*` di `.env.local`. Hapus kembali `SUPABASE_SERVICE_ROLE_KEY` dari `.env.local` setelah selesai jika tidak diperlukan.
