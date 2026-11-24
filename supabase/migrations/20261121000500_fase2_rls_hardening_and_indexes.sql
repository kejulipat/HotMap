-- =============================================================================
-- Migration 005 (Fase 2): Hardening RLS Least-Privilege, Column Guard Trigger,
--                         Constraint jenis_kejadian, & Index Koordinat GIS
-- =============================================================================
-- STATUS: LOKAL — MENUNGGU PERSETUJUAN PENGGUNA SEBELUM DITERAPKAN KE REMOTE.
-- Tujuan:
--   1. Memperketat policy UPDATE pada `public.laporan_karhutla` sehingga:
--      - `admin` dapat memperbarui laporan sesuai kewenangan.
--      - `petugas` HANYA dapat memperbarui laporan yang ditugaskan kepadanya
--        (`petugas_id = (SELECT auth.uid())`) dengan status transisi valid
--        (`terverifikasi`/`ditangani` -> `ditangani`/`selesai`).
--   2. Menambahkan BEFORE UPDATE trigger `private.guard_laporan_update_columns()`
--      agar non-admin (`petugas`) tidak dapat mengubah kolom administratif atau
--      identitas laporan (`pelapor_id`, `wilayah_id`, `judul`, `deskripsi`,
--      `latitude`, `longitude`, `verified_by`, `verified_at`, `petugas_id`,
--      `jenis_kejadian`, `alamat_lokasi`, `estimasi_luas`, `tingkat_keparahan`,
--      `waktu_kejadian`).
--   3. Memperketat policy INSERT pada `public.laporan_karhutla` agar non-admin
--      wajib mengisi `verified_by`, `verified_at`, `petugas_id`, dan
--      `catatan_verifikasi` dengan NULL.
--   4. Memperketat policy INSERT pada `public.penanganan_log` agar `petugas`
--      HANYA dapat menambah log pada laporan yang benar-benar ditugaskan kepadanya.
--   5. Menambahkan CHECK constraint untuk `public.laporan_karhutla.jenis_kejadian`.
--   6. Menambahkan composite B-tree index `(latitude, longitude)` untuk query GIS.
--   7. Menyelaraskan policy SELECT `storage.objects` bucket `laporan-bukti` dengan
--      `public.laporan_foto` (termasuk `penugasan_laporan` non-dibatalkan).
-- =============================================================================

BEGIN;

-- 1. Constraint daftar nilai valid `jenis_kejadian`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'laporan_karhutla_jenis_kejadian_check'
      AND conrelid = 'public.laporan_karhutla'::regclass
  ) THEN
    ALTER TABLE public.laporan_karhutla
      ADD CONSTRAINT laporan_karhutla_jenis_kejadian_check
      CHECK (
        jenis_kejadian IS NULL
        OR jenis_kejadian IN (
          'kebakaran_lahan',
          'kebakaran_hutan',
          'kebakaran_gambut',
          'asap_pekat',
          'lainnya'
        )
      );
  END IF;
END $$;

-- 2. Composite index koordinat untuk query spasial / bounding-box ringan tanpa PostGIS
CREATE INDEX IF NOT EXISTS idx_laporan_karhutla_lat_lng
  ON public.laporan_karhutla (latitude, longitude);

-- 3. Trigger penjaga kolom UPDATE `public.laporan_karhutla` (defense-in-depth untuk non-admin)
CREATE OR REPLACE FUNCTION private.guard_laporan_update_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_role public.user_role;
BEGIN
  -- Bypass untuk operasi sistem internal / trigger backend (tanpa auth.uid() / service_role)
  v_uid := (SELECT auth.uid());
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.role INTO v_role
  FROM public.profiles AS p
  WHERE p.id = v_uid;

  -- Admin diizinkan mengubah seluruh kolom sesuai kewenangan
  IF v_role = 'admin'::public.user_role THEN
    RETURN NEW;
  END IF;

  -- Petugas hanya diizinkan memperbarui progres status (dan updated_at) pada tugas miliknya
  IF v_role = 'petugas'::public.user_role THEN
    IF OLD.petugas_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'Petugas hanya dapat memperbarui laporan yang ditugaskan kepadanya.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.pelapor_id IS DISTINCT FROM OLD.pelapor_id
      OR NEW.wilayah_id IS DISTINCT FROM OLD.wilayah_id
      OR NEW.judul IS DISTINCT FROM OLD.judul
      OR NEW.deskripsi IS DISTINCT FROM OLD.deskripsi
      OR NEW.latitude IS DISTINCT FROM OLD.latitude
      OR NEW.longitude IS DISTINCT FROM OLD.longitude
      OR NEW.waktu_kejadian IS DISTINCT FROM OLD.waktu_kejadian
      OR NEW.jenis_kejadian IS DISTINCT FROM OLD.jenis_kejadian
      OR NEW.alamat_lokasi IS DISTINCT FROM OLD.alamat_lokasi
      OR NEW.estimasi_luas IS DISTINCT FROM OLD.estimasi_luas
      OR NEW.tingkat_keparahan IS DISTINCT FROM OLD.tingkat_keparahan
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.petugas_id IS DISTINCT FROM OLD.petugas_id
      OR NEW.catatan_verifikasi IS DISTINCT FROM OLD.catatan_verifikasi
    THEN
      RAISE EXCEPTION 'Petugas tidak diizinkan mengubah field administratif atau identitas laporan.'
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status NOT IN ('terverifikasi'::public.report_status, 'ditangani'::public.report_status)
      OR NEW.status NOT IN ('ditangani'::public.report_status, 'selesai'::public.report_status)
    THEN
      RAISE EXCEPTION 'Transisi status tidak diizinkan untuk role petugas.'
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Role pengguna tidak memiliki izin memperbarui laporan.'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION private.guard_laporan_update_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_laporan_update_columns ON public.laporan_karhutla;
CREATE TRIGGER trg_guard_laporan_update_columns
  BEFORE UPDATE ON public.laporan_karhutla
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_laporan_update_columns();

-- 4. Perketat policy INSERT `public.laporan_karhutla` (cegah spoofing kolom admin oleh pelapor)
DROP POLICY IF EXISTS "User login buat laporan" ON public.laporan_karhutla;
CREATE POLICY "User login buat laporan"
  ON public.laporan_karhutla
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT private.has_role(ARRAY['admin']))
    OR (
      pelapor_id = (SELECT auth.uid())
      AND status = 'menunggu_verifikasi'::public.report_status
      AND verified_by IS NULL
      AND verified_at IS NULL
      AND petugas_id IS NULL
      AND catatan_verifikasi IS NULL
    )
  );

-- 5. Perketat policy UPDATE `public.laporan_karhutla` (least-privilege petugas)
DROP POLICY IF EXISTS "Petugas dan Admin update laporan" ON public.laporan_karhutla;
CREATE POLICY "Petugas dan Admin update laporan"
  ON public.laporan_karhutla
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['admin']))
    OR (
      (SELECT private.has_role(ARRAY['petugas']))
      AND petugas_id = (SELECT auth.uid())
      AND status IN ('terverifikasi'::public.report_status, 'ditangani'::public.report_status)
    )
  )
  WITH CHECK (
    (SELECT private.has_role(ARRAY['admin']))
    OR (
      (SELECT private.has_role(ARRAY['petugas']))
      AND petugas_id = (SELECT auth.uid())
      AND status IN ('ditangani'::public.report_status, 'selesai'::public.report_status)
    )
  );

-- 6. Perketat policy INSERT `public.penanganan_log` (petugas hanya boleh log tugas miliknya)
DROP POLICY IF EXISTS "Petugas dan Admin tambah log penanganan" ON public.penanganan_log;
CREATE POLICY "Petugas dan Admin tambah log penanganan"
  ON public.penanganan_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT private.has_role(ARRAY['admin']))
    OR (
      (SELECT private.has_role(ARRAY['petugas']))
      AND petugas_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.laporan_karhutla AS l
        WHERE l.id = laporan_id
          AND l.petugas_id = (SELECT auth.uid())
      )
    )
  );

-- 7. Selaraskan policy SELECT `storage.objects` bucket `laporan-bukti` dengan `laporan_foto`
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
            OR (
              (SELECT private.has_role(ARRAY['petugas']))
              AND (
                l.petugas_id = (SELECT auth.uid())
                OR EXISTS (
                  SELECT 1
                  FROM public.penugasan_laporan AS pg
                  WHERE pg.laporan_id = l.id
                    AND pg.petugas_id = (SELECT auth.uid())
                    AND pg.status_penugasan <> 'dibatalkan'
                )
              )
            )
          )
      )
    )
  );

COMMIT;
