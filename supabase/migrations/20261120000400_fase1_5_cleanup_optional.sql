-- =============================================================================
-- Migration 004 (Fase 1.5 — Opsional / Pembersihan Artefak Legacy & Least-Privilege)
-- =============================================================================
-- STATUS: BELUM DITERAPKAN KE DATABASE REMOTE (Memerlukan persetujuan eksplisit pengguna).
-- Tujuan:
--   1. Mencabut izin USAGE/EXECUTE role `anon` yang tidak digunakan pada schema
--      `private` dan fungsi `private.get_my_role()` / `private.has_role(text[])`
--      (seluruh policy `TO anon` tidak memanggil fungsi di schema `private`).
--   2. Menghapus fungsi legacy `public.get_my_role()` yang sudah tidak memiliki
--      dependensi (terverifikasi 0 baris pada `pg_depend`).
--   3. Menghapus 3 policy legacy berskop `{service_role}` yang sudah tidak diperlukan
--      pada tabel `public.laporan_karhutla`, `public.profiles`, dan `public.wilayah`
--      (karena `service_role` memiliki atribut BYPASSRLS secara bawaan).
--
-- Catatan:
--   - Penghapusan bucket kosong `media-karhutla` dan 3 policy legacy `storage.objects`
--     berskop `{service_role}` tidak dimasukkan di sini karena `storage.buckets`
--     dilindungi trigger Supabase Storage API dan `storage.objects` dimiliki oleh
--     role internal Supabase Storage; pembersihan bucket legacy sebaiknya dilakukan
--     melalui Supabase Dashboard Storage atau Storage Admin API setelah persetujuan.
-- =============================================================================

BEGIN;

-- 1. Least-privilege pada schema `private`: cukup `authenticated` yang membutuhkan
REVOKE EXECUTE ON FUNCTION private.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION private.has_role(text[]) FROM anon;
REVOKE USAGE ON SCHEMA private FROM anon;

-- 2. Hapus fungsi legacy `public.get_my_role()` (sudah digantikan oleh `private.*`)
DROP FUNCTION IF EXISTS public.get_my_role();

-- 3. Hapus policy legacy berskop `{service_role}` di tabel `public.*`
DROP POLICY IF EXISTS "Petugas dan Admin lihat semua laporan" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "Admin kelola semua profil" ON public.profiles;
DROP POLICY IF EXISTS "Admin kelola wilayah" ON public.wilayah;

COMMIT;
