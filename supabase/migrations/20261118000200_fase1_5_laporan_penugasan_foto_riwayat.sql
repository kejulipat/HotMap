-- =============================================================================
-- Migration 002 (Fase 1.5): Rekonsiliasi & Hardening Tabel Inti, Penugasan
--                           (`petugas_id`), Foto Bukti, Riwayat Status,
--                           `penanganan_log`, Index FK, Constraint, & RLS
-- =============================================================================
-- Prasyarat: Jalankan Migration 001 terlebih dahulu (`private.has_role`, `private.get_my_role`).
-- Catatan:
--   1. Menyatukan kolom penugasan pada `public.laporan_karhutla` menjadi `petugas_id`
--      (me-rename `assigned_to` -> `petugas_id` bila sudah ada).
--   2. Mempertahankan `public.penanganan_log` untuk log lapangan petugas sekaligus
--      menambahkan index FK, constraint, dan kebijakan RLS least-privilege.
-- =============================================================================

BEGIN;

-- 1. Rekonsiliasi kolom `assigned_to` -> `petugas_id` & perluasan kolom `public.laporan_karhutla`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laporan_karhutla' AND column_name = 'assigned_to'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laporan_karhutla' AND column_name = 'petugas_id'
  ) THEN
    ALTER TABLE public.laporan_karhutla RENAME COLUMN assigned_to TO petugas_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laporan_karhutla' AND column_name = 'assigned_to'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laporan_karhutla' AND column_name = 'petugas_id'
  ) THEN
    UPDATE public.laporan_karhutla SET petugas_id = COALESCE(petugas_id, assigned_to) WHERE petugas_id IS NULL AND assigned_to IS NOT NULL;
    ALTER TABLE public.laporan_karhutla DROP COLUMN assigned_to;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'laporan_karhutla_assigned_to_fkey'
      AND conrelid = 'public.laporan_karhutla'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'laporan_karhutla_petugas_id_fkey'
      AND conrelid = 'public.laporan_karhutla'::regclass
  ) THEN
    ALTER TABLE public.laporan_karhutla
      RENAME CONSTRAINT laporan_karhutla_assigned_to_fkey TO laporan_karhutla_petugas_id_fkey;
  END IF;
END $$;

ALTER TABLE public.laporan_karhutla
  ADD COLUMN IF NOT EXISTS jenis_kejadian text DEFAULT 'kebakaran_lahan',
  ADD COLUMN IF NOT EXISTS alamat_lokasi text,
  ADD COLUMN IF NOT EXISTS estimasi_luas numeric(10, 2) CHECK (
    estimasi_luas IS NULL OR estimasi_luas >= 0
  ),
  ADD COLUMN IF NOT EXISTS tingkat_keparahan text CHECK (
    tingkat_keparahan IS NULL OR tingkat_keparahan IN ('rendah', 'sedang', 'tinggi', 'kritis')
  ),
  ADD COLUMN IF NOT EXISTS petugas_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Jadikan kolom URL foto legacy opsional agar kompatibel dengan tabel multi-foto `laporan_foto`
ALTER TABLE public.laporan_karhutla
  ALTER COLUMN foto_kejadian_url DROP NOT NULL;

ALTER TABLE public.penanganan_log
  ALTER COLUMN foto_bukti_url DROP NOT NULL;

-- 2. Pastikan seluruh kolom audit timestamp NOT NULL DEFAULT now()
UPDATE public.wilayah SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.wilayah
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

UPDATE public.profiles SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

UPDATE public.laporan_karhutla SET created_at = now() WHERE created_at IS NULL;
UPDATE public.laporan_karhutla SET updated_at = now() WHERE updated_at IS NULL;
ALTER TABLE public.laporan_karhutla
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

UPDATE public.penanganan_log SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.penanganan_log
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

-- Trigger updated_at otomatis pada public.laporan_karhutla
DROP TRIGGER IF EXISTS trg_laporan_karhutla_updated_at ON public.laporan_karhutla;
CREATE TRIGGER trg_laporan_karhutla_updated_at
  BEFORE UPDATE ON public.laporan_karhutla
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Tambahkan CHECK & UNIQUE constraints secara idempoten pada 4 tabel inti
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wilayah_nama_wilayah_not_blank_check' AND conrelid = 'public.wilayah'::regclass
  ) THEN
    ALTER TABLE public.wilayah ADD CONSTRAINT wilayah_nama_wilayah_not_blank_check CHECK (char_length(trim(nama_wilayah)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wilayah_kabupaten_kota_not_blank_check' AND conrelid = 'public.wilayah'::regclass
  ) THEN
    ALTER TABLE public.wilayah ADD CONSTRAINT wilayah_kabupaten_kota_not_blank_check CHECK (char_length(trim(kabupaten_kota)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wilayah_center_lat_range_check' AND conrelid = 'public.wilayah'::regclass
  ) THEN
    ALTER TABLE public.wilayah ADD CONSTRAINT wilayah_center_lat_range_check CHECK (center_lat BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wilayah_center_lng_range_check' AND conrelid = 'public.wilayah'::regclass
  ) THEN
    ALTER TABLE public.wilayah ADD CONSTRAINT wilayah_center_lng_range_check CHECK (center_lng BETWEEN -180 AND 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wilayah_nama_kabupaten_key' AND conrelid = 'public.wilayah'::regclass
  ) THEN
    ALTER TABLE public.wilayah ADD CONSTRAINT wilayah_nama_kabupaten_key UNIQUE (nama_wilayah, kabupaten_kota);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_full_name_not_blank_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_not_blank_check CHECK (char_length(trim(full_name)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'laporan_karhutla_judul_not_blank_check' AND conrelid = 'public.laporan_karhutla'::regclass
  ) THEN
    ALTER TABLE public.laporan_karhutla ADD CONSTRAINT laporan_karhutla_judul_not_blank_check CHECK (char_length(trim(judul)) >= 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'laporan_karhutla_deskripsi_not_blank_check' AND conrelid = 'public.laporan_karhutla'::regclass
  ) THEN
    ALTER TABLE public.laporan_karhutla ADD CONSTRAINT laporan_karhutla_deskripsi_not_blank_check CHECK (char_length(trim(deskripsi)) >= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'laporan_karhutla_latitude_range_check' AND conrelid = 'public.laporan_karhutla'::regclass
  ) THEN
    ALTER TABLE public.laporan_karhutla ADD CONSTRAINT laporan_karhutla_latitude_range_check CHECK (latitude BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'laporan_karhutla_longitude_range_check' AND conrelid = 'public.laporan_karhutla'::regclass
  ) THEN
    ALTER TABLE public.laporan_karhutla ADD CONSTRAINT laporan_karhutla_longitude_range_check CHECK (longitude BETWEEN -180 AND 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'penanganan_log_catatan_not_blank_check' AND conrelid = 'public.penanganan_log'::regclass
  ) THEN
    ALTER TABLE public.penanganan_log ADD CONSTRAINT penanganan_log_catatan_not_blank_check CHECK (char_length(trim(catatan_penanganan)) > 0);
  END IF;
END $$;

-- 4. Index FK & Composite Index pada `profiles`, `laporan_karhutla`, dan `penanganan_log`
CREATE INDEX IF NOT EXISTS idx_profiles_wilayah_id
  ON public.profiles (wilayah_id);

CREATE INDEX IF NOT EXISTS idx_laporan_karhutla_pelapor_id
  ON public.laporan_karhutla (pelapor_id);
CREATE INDEX IF NOT EXISTS idx_laporan_karhutla_petugas_id
  ON public.laporan_karhutla (petugas_id);
CREATE INDEX IF NOT EXISTS idx_laporan_karhutla_verified_by
  ON public.laporan_karhutla (verified_by);
CREATE INDEX IF NOT EXISTS idx_laporan_karhutla_wilayah_status
  ON public.laporan_karhutla (wilayah_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_karhutla_status_created_at
  ON public.laporan_karhutla (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_penanganan_log_laporan_id
  ON public.penanganan_log (laporan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_penanganan_log_petugas_id
  ON public.penanganan_log (petugas_id);

-- 5. Tabel multi-foto bukti laporan & tindak lanjut
CREATE TABLE IF NOT EXISTS public.laporan_foto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_id uuid NOT NULL REFERENCES public.laporan_karhutla(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  jenis_foto text NOT NULL DEFAULT 'bukti_awal' CHECK (
    jenis_foto IN ('bukti_awal', 'verifikasi', 'penanganan', 'selesai')
  ),
  mime_type text NOT NULL CHECK (
    mime_type IN ('image/jpeg', 'image/png', 'image/webp')
  ),
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 5242880),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laporan_foto_laporan_id
  ON public.laporan_foto (laporan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_foto_uploaded_by
  ON public.laporan_foto (uploaded_by);

-- 6. Tabel penugasan petugas (menyimpan histori penugasan, hanya 1 penugasan aktif per laporan)
CREATE TABLE IF NOT EXISTS public.penugasan_laporan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_id uuid NOT NULL REFERENCES public.laporan_karhutla(id) ON DELETE CASCADE,
  petugas_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status_penugasan text NOT NULL DEFAULT 'ditugaskan' CHECK (
    status_penugasan IN ('ditugaskan', 'diterima', 'dalam_penanganan', 'selesai', 'dibatalkan')
  ),
  catatan text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_penugasan_laporan_laporan_id
  ON public.penugasan_laporan (laporan_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_penugasan_laporan_petugas_id
  ON public.penugasan_laporan (petugas_id, status_penugasan);
CREATE INDEX IF NOT EXISTS idx_penugasan_laporan_assigned_by
  ON public.penugasan_laporan (assigned_by);

CREATE UNIQUE INDEX IF NOT EXISTS idx_penugasan_laporan_active_unique
  ON public.penugasan_laporan (laporan_id)
  WHERE status_penugasan IN ('ditugaskan', 'diterima', 'dalam_penanganan');

-- Trigger sinkronisasi otomatis kolom `petugas_id` pada `laporan_karhutla` (di schema `private`)
CREATE OR REPLACE FUNCTION private.sync_laporan_petugas_from_penugasan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status_penugasan IN ('ditugaskan', 'diterima', 'dalam_penanganan', 'selesai') THEN
    UPDATE public.laporan_karhutla
    SET petugas_id = NEW.petugas_id, updated_at = now()
    WHERE id = NEW.laporan_id;
  ELSIF NEW.status_penugasan = 'dibatalkan' THEN
    UPDATE public.laporan_karhutla
    SET petugas_id = NULL, updated_at = now()
    WHERE id = NEW.laporan_id AND petugas_id = NEW.petugas_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_laporan_petugas_from_penugasan() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_laporan_petugas ON public.penugasan_laporan;
CREATE TRIGGER trg_sync_laporan_petugas
  AFTER INSERT OR UPDATE OF status_penugasan, petugas_id ON public.penugasan_laporan
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_laporan_petugas_from_penugasan();

DROP FUNCTION IF EXISTS public.sync_laporan_petugas_from_penugasan();

-- 7. Tabel audit riwayat perubahan status laporan
CREATE TABLE IF NOT EXISTS public.laporan_riwayat_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_id uuid NOT NULL REFERENCES public.laporan_karhutla(id) ON DELETE CASCADE,
  status_sebelumnya text,
  status_baru text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laporan_riwayat_laporan_id
  ON public.laporan_riwayat_status (laporan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_riwayat_changed_by
  ON public.laporan_riwayat_status (changed_by);

-- 8. Least-Privilege Table Grants
REVOKE ALL ON TABLE public.wilayah FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.wilayah TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wilayah TO authenticated;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

REVOKE ALL ON TABLE public.laporan_karhutla FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.laporan_karhutla TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.laporan_karhutla TO authenticated;

REVOKE ALL ON TABLE public.penanganan_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.penanganan_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.penanganan_log TO authenticated;

REVOKE ALL ON TABLE public.laporan_foto FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.laporan_foto TO authenticated;

REVOKE ALL ON TABLE public.penugasan_laporan FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.penugasan_laporan TO authenticated;

REVOKE ALL ON TABLE public.laporan_riwayat_status FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.laporan_riwayat_status TO authenticated;

ALTER TABLE public.wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_karhutla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penanganan_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_foto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penugasan_laporan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_riwayat_status ENABLE ROW LEVEL SECURITY;

-- 9. Kebijakan RLS `public.wilayah` (bebas multiple_permissive_policies)
DROP POLICY IF EXISTS "Admin kelola wilayah" ON public.wilayah;
DROP POLICY IF EXISTS "Wilayah dapat dilihat publik" ON public.wilayah;
DROP POLICY IF EXISTS "Admin tambah wilayah" ON public.wilayah;
DROP POLICY IF EXISTS "Admin ubah wilayah" ON public.wilayah;
DROP POLICY IF EXISTS "Admin hapus wilayah" ON public.wilayah;

CREATE POLICY "Wilayah dapat dilihat publik"
  ON public.wilayah
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin tambah wilayah"
  ON public.wilayah
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.has_role(ARRAY['admin'])));

CREATE POLICY "Admin ubah wilayah"
  ON public.wilayah
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])))
  WITH CHECK ((SELECT private.has_role(ARRAY['admin'])));

CREATE POLICY "Admin hapus wilayah"
  ON public.wilayah
  FOR DELETE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])));

-- 10. Kebijakan RLS `public.profiles` (menutup celah privilege escalation kolom `role`)
DROP POLICY IF EXISTS "Admin kelola semua profil" ON public.profiles;
DROP POLICY IF EXISTS "Profil dapat dilihat semua user login" ON public.profiles;
DROP POLICY IF EXISTS "User bisa update profil sendiri" ON public.profiles;
DROP POLICY IF EXISTS "Pengguna update profil sendiri atau admin kelola semua" ON public.profiles;
DROP POLICY IF EXISTS "Admin tambah profil" ON public.profiles;
DROP POLICY IF EXISTS "Admin hapus profil" ON public.profiles;

CREATE POLICY "Profil dapat dilihat semua user login"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin tambah profil"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.has_role(ARRAY['admin'])));

CREATE POLICY "Pengguna update profil sendiri atau admin kelola semua"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.has_role(ARRAY['admin']))
  )
  WITH CHECK (
    (SELECT private.has_role(ARRAY['admin']))
    OR (
      id = (SELECT auth.uid())
      AND role = (SELECT private.get_my_role())
    )
  );

CREATE POLICY "Admin hapus profil"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])));

-- 11. Kebijakan RLS `public.laporan_karhutla` (initplan + single SELECT policy per role)
DROP POLICY IF EXISTS "Admin hapus laporan" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "Pelapor lihat laporan sendiri" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "Petugas dan Admin lihat semua laporan" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "Petugas dan Admin update laporan" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "Publik lihat laporan terverifikasi" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "Pengguna login lihat laporan sesuai akses" ON public.laporan_karhutla;
DROP POLICY IF EXISTS "User login buat laporan" ON public.laporan_karhutla;

CREATE POLICY "Publik lihat laporan terverifikasi"
  ON public.laporan_karhutla
  FOR SELECT
  TO anon
  USING (
    status = ANY (ARRAY['terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status])
  );

CREATE POLICY "Pengguna login lihat laporan sesuai akses"
  ON public.laporan_karhutla
  FOR SELECT
  TO authenticated
  USING (
    status = ANY (ARRAY['terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status])
    OR pelapor_id = (SELECT auth.uid())
    OR (SELECT private.has_role(ARRAY['petugas', 'admin']))
  );

CREATE POLICY "User login buat laporan"
  ON public.laporan_karhutla
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pelapor_id = (SELECT auth.uid())
    AND status = 'menunggu_verifikasi'::public.report_status
  );

CREATE POLICY "Petugas dan Admin update laporan"
  ON public.laporan_karhutla
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['petugas', 'admin'])))
  WITH CHECK ((SELECT private.has_role(ARRAY['petugas', 'admin'])));

CREATE POLICY "Admin hapus laporan"
  ON public.laporan_karhutla
  FOR DELETE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])));

-- 12. Kebijakan RLS `public.penanganan_log`
DROP POLICY IF EXISTS "Log penanganan dapat dilihat publik" ON public.penanganan_log;
DROP POLICY IF EXISTS "Petugas dan Admin tambah log penanganan" ON public.penanganan_log;
DROP POLICY IF EXISTS "Publik lihat log penanganan laporan terverifikasi" ON public.penanganan_log;
DROP POLICY IF EXISTS "Pengguna login lihat log penanganan sesuai akses laporan" ON public.penanganan_log;
DROP POLICY IF EXISTS "Admin hapus log penanganan" ON public.penanganan_log;

CREATE POLICY "Publik lihat log penanganan laporan terverifikasi"
  ON public.penanganan_log
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.laporan_karhutla AS l
      WHERE l.id = laporan_id
        AND l.status = ANY (ARRAY['terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status])
    )
  );

CREATE POLICY "Pengguna login lihat log penanganan sesuai akses laporan"
  ON public.penanganan_log
  FOR SELECT
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['petugas', 'admin']))
    OR EXISTS (
      SELECT 1
      FROM public.laporan_karhutla AS l
      WHERE l.id = laporan_id
        AND (
          l.pelapor_id = (SELECT auth.uid())
          OR l.status = ANY (ARRAY['terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status])
        )
    )
  );

CREATE POLICY "Petugas dan Admin tambah log penanganan"
  ON public.penanganan_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT private.has_role(ARRAY['petugas', 'admin']))
    AND (
      petugas_id IS NULL
      OR petugas_id = (SELECT auth.uid())
      OR (SELECT private.has_role(ARRAY['admin']))
    )
  );

CREATE POLICY "Admin hapus log penanganan"
  ON public.penanganan_log
  FOR DELETE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])));

-- 13. Kebijakan RLS `public.laporan_foto`
DROP POLICY IF EXISTS "Akses baca foto laporan terbatas" ON public.laporan_foto;
DROP POLICY IF EXISTS "Pelapor upload foto laporan sendiri" ON public.laporan_foto;
DROP POLICY IF EXISTS "Hapus foto oleh pemilik atau admin" ON public.laporan_foto;

CREATE POLICY "Akses baca foto laporan terbatas"
  ON public.laporan_foto
  FOR SELECT
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['admin']))
    OR uploaded_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.laporan_karhutla AS l
      WHERE l.id = laporan_id
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
  );

CREATE POLICY "Pelapor upload foto laporan sendiri"
  ON public.laporan_foto
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    AND (
      (SELECT private.has_role(ARRAY['admin']))
      OR (
        jenis_foto = 'bukti_awal'
        AND EXISTS (
          SELECT 1
          FROM public.laporan_karhutla AS l
          WHERE l.id = laporan_id AND l.pelapor_id = (SELECT auth.uid())
        )
      )
      OR (
        (SELECT private.has_role(ARRAY['petugas']))
        AND jenis_foto IN ('penanganan', 'selesai')
        AND EXISTS (
          SELECT 1
          FROM public.laporan_karhutla AS l
          WHERE l.id = laporan_id AND l.petugas_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "Hapus foto oleh pemilik atau admin"
  ON public.laporan_foto
  FOR DELETE
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['admin']))
    OR uploaded_by = (SELECT auth.uid())
  );

-- 14. Kebijakan RLS `public.penugasan_laporan`
DROP POLICY IF EXISTS "Admin dan petugas terkait membaca penugasan" ON public.penugasan_laporan;
DROP POLICY IF EXISTS "Hanya admin membuat penugasan" ON public.penugasan_laporan;
DROP POLICY IF EXISTS "Admin atau petugas terkait update status penugasan" ON public.penugasan_laporan;

CREATE POLICY "Admin dan petugas terkait membaca penugasan"
  ON public.penugasan_laporan
  FOR SELECT
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['admin']))
    OR petugas_id = (SELECT auth.uid())
  );

CREATE POLICY "Hanya admin membuat penugasan"
  ON public.penugasan_laporan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT private.has_role(ARRAY['admin']))
    AND assigned_by = (SELECT auth.uid())
  );

CREATE POLICY "Admin atau petugas terkait update status penugasan"
  ON public.penugasan_laporan
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['admin']))
    OR petugas_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT private.has_role(ARRAY['admin']))
    OR (
      petugas_id = (SELECT auth.uid())
      AND status_penugasan IN ('diterima', 'dalam_penanganan', 'selesai')
    )
  );

-- 15. Kebijakan RLS `public.laporan_riwayat_status`
DROP POLICY IF EXISTS "Riwayat status terbaca oleh admin, petugas ditugaskan, dan pelapor pemilik" ON public.laporan_riwayat_status;
DROP POLICY IF EXISTS "Role berhak mencatat riwayat status" ON public.laporan_riwayat_status;

CREATE POLICY "Riwayat status terbaca oleh admin, petugas ditugaskan, dan pelapor pemilik"
  ON public.laporan_riwayat_status
  FOR SELECT
  TO authenticated
  USING (
    (SELECT private.has_role(ARRAY['admin']))
    OR EXISTS (
      SELECT 1
      FROM public.laporan_karhutla AS l
      WHERE l.id = laporan_id
        AND (
          l.pelapor_id = (SELECT auth.uid())
          OR l.petugas_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "Role berhak mencatat riwayat status"
  ON public.laporan_riwayat_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = (SELECT auth.uid())
    AND (
      (SELECT private.has_role(ARRAY['admin']))
      OR (
        (SELECT private.has_role(ARRAY['petugas']))
        AND EXISTS (
          SELECT 1
          FROM public.laporan_karhutla AS l
          WHERE l.id = laporan_id AND l.petugas_id = (SELECT auth.uid())
        )
      )
      OR (
        status_sebelumnya IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.laporan_karhutla AS l
          WHERE l.id = laporan_id AND l.pelapor_id = (SELECT auth.uid())
        )
      )
    )
  );

-- 16. Hapus fungsi legacy `public.get_my_role()` yang sudah digantikan oleh `private.*`
DROP FUNCTION IF EXISTS public.get_my_role();

COMMIT;
