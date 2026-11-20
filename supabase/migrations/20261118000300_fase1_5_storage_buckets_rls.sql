-- =============================================================================
-- Migration 003 (Fase 1.5): Supabase Storage Buckets & Storage RLS Policies
-- =============================================================================
-- Prasyarat: Jalankan Migration 001 & 002 terlebih dahulu.
-- Buckets:
--   1. `berita-images`  (public = true, maksimal 5 MB, gambar JPEG/PNG/WebP)
--   2. `laporan-bukti`  (public = false / private, maksimal 5 MB, JPEG/PNG/WebP)
-- Catatan:
--   Membersihkan policy legacy yang salah target (`karhutla-media`) dan bucket
--   kosong legacy (`media-karhutla`) bila tidak memiliki objek.
-- =============================================================================

BEGIN;

-- 1. Bersihkan policy legacy `karhutla-media` dan bucket kosong `media-karhutla`
DROP POLICY IF EXISTS "Admin dan Petugas kelola foto" ON storage.objects;
DROP POLICY IF EXISTS "Publik bisa lihat foto karhutla" ON storage.objects;
DROP POLICY IF EXISTS "User login bisa upload foto karhutla" ON storage.objects;

DELETE FROM storage.buckets
WHERE id = 'media-karhutla'
  AND NOT EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'media-karhutla'
  );

-- 2. Buat / perbarui konfigurasi bucket Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'berita-images',
    'berita-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'laporan-bukti',
    'laporan-bukti',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Kebijakan Storage RLS untuk bucket `berita-images` (Publik baca, Admin tulis/hapus)
DROP POLICY IF EXISTS "Publik membaca gambar berita" ON storage.objects;
CREATE POLICY "Publik membaca gambar berita"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'berita-images');

DROP POLICY IF EXISTS "Admin upload gambar berita" ON storage.objects;
CREATE POLICY "Admin upload gambar berita"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'berita-images'
    AND (SELECT private.has_role(ARRAY['admin']))
  );

DROP POLICY IF EXISTS "Admin perbarui gambar berita" ON storage.objects;
CREATE POLICY "Admin perbarui gambar berita"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'berita-images'
    AND (SELECT private.has_role(ARRAY['admin']))
  )
  WITH CHECK (
    bucket_id = 'berita-images'
    AND (SELECT private.has_role(ARRAY['admin']))
  );

DROP POLICY IF EXISTS "Admin hapus gambar berita" ON storage.objects;
CREATE POLICY "Admin hapus gambar berita"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'berita-images'
    AND (SELECT private.has_role(ARRAY['admin']))
  );

-- 4. Kebijakan Storage RLS untuk bucket `laporan-bukti` (Private)
--    Format path wajib: `<user_id>/<laporan_id_or_draft>/<filename>`
DROP POLICY IF EXISTS "Akses baca bukti laporan sesuai pemilik, petugas ditugaskan, atau admin" ON storage.objects;
CREATE POLICY "Akses baca bukti laporan sesuai pemilik, petugas ditugaskan, atau admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'laporan-bukti'
    AND (
      (SELECT private.has_role(ARRAY['admin']))
      OR (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.laporan_foto AS lf
        JOIN public.laporan_karhutla AS l ON l.id = lf.laporan_id
        WHERE lf.storage_path = name
          AND (
            l.pelapor_id = (SELECT auth.uid())
            OR l.petugas_id = (SELECT auth.uid())
          )
      )
    )
  );

DROP POLICY IF EXISTS "Pengguna terautentikasi upload ke folder miliknya di laporan-bukti" ON storage.objects;
CREATE POLICY "Pengguna terautentikasi upload ke folder miliknya di laporan-bukti"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'laporan-bukti'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Pemilik atau admin perbarui file laporan-bukti" ON storage.objects;
CREATE POLICY "Pemilik atau admin perbarui file laporan-bukti"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'laporan-bukti'
    AND (
      (SELECT private.has_role(ARRAY['admin']))
      OR (storage.foldername(name))[1] = (SELECT auth.uid())::text
    )
  )
  WITH CHECK (
    bucket_id = 'laporan-bukti'
    AND (
      (SELECT private.has_role(ARRAY['admin']))
      OR (storage.foldername(name))[1] = (SELECT auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Pemilik atau admin hapus file laporan-bukti" ON storage.objects;
CREATE POLICY "Pemilik atau admin hapus file laporan-bukti"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'laporan-bukti'
    AND (
      (SELECT private.has_role(ARRAY['admin']))
      OR (storage.foldername(name))[1] = (SELECT auth.uid())::text
    )
  );

COMMIT;
