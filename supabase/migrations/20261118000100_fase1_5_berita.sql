-- =============================================================================
-- Migration 001 (Fase 1.5): Helper Schema Private & Tabel public.berita + RLS
-- =============================================================================
-- Tujuan:
--   1. Menyediakan fungsi helper otorisasi non-exposed `private.has_role(text[])`
--      dan `private.get_my_role()` dengan `SET search_path = ''`.
--   2. Mengamankan fungsi trigger `public.handle_new_user()` & `public.set_updated_at()`.
--   3. Membuat tabel `public.berita` beserta constraint, index, trigger updated_at,
--      dan kebijakan RLS least-privilege tanpa multiple permissive policies.
-- =============================================================================

BEGIN;

-- 1. Schema internal non-exposed untuk helper otorisasi RLS
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION private.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_my_role() TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND lower(trim(p.role::text)) = ANY(allowed_roles)
    );
$$;

REVOKE ALL ON FUNCTION private.has_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(text[]) TO authenticated, anon;

-- 2. Hardening trigger auth.users -> public.profiles (SET search_path & revoke RPC execute)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'Pengguna Baru'),
    'pelapor'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. Fungsi trigger updated_at bersama
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 4. Tabel public.berita
CREATE TABLE IF NOT EXISTS public.berita (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL CHECK (char_length(trim(judul)) >= 3),
  slug text NOT NULL UNIQUE CHECK (char_length(trim(slug)) >= 3),
  ringkasan text,
  isi text NOT NULL CHECK (char_length(trim(isi)) >= 10),
  kategori text NOT NULL DEFAULT 'informasi' CHECK (
    kategori IN ('informasi', 'peringatan', 'penanganan', 'edukasi')
  ),
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'archived')
  ),
  gambar_path text,
  gambar_url text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index untuk query halaman publik (status published terurut terbaru) & FK author
CREATE INDEX IF NOT EXISTS idx_berita_published_feed
  ON public.berita (status, published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_berita_author_id
  ON public.berita (author_id);

DROP TRIGGER IF EXISTS trg_berita_updated_at ON public.berita;
CREATE TRIGGER trg_berita_updated_at
  BEFORE UPDATE ON public.berita
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Least-privilege grants & RLS pada public.berita
REVOKE ALL ON TABLE public.berita FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.berita TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.berita TO authenticated;

ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik hanya membaca berita published" ON public.berita;
DROP POLICY IF EXISTS "Admin membaca semua berita" ON public.berita;
DROP POLICY IF EXISTS "Publik membaca berita published" ON public.berita;
DROP POLICY IF EXISTS "Pengguna login membaca berita published atau admin semua" ON public.berita;
DROP POLICY IF EXISTS "Admin membuat berita" ON public.berita;
DROP POLICY IF EXISTS "Admin mengubah berita" ON public.berita;
DROP POLICY IF EXISTS "Admin menghapus berita" ON public.berita;

CREATE POLICY "Publik membaca berita published"
  ON public.berita
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Pengguna login membaca berita published atau admin semua"
  ON public.berita
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR (SELECT private.has_role(ARRAY['admin']))
  );

CREATE POLICY "Admin membuat berita"
  ON public.berita
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.has_role(ARRAY['admin'])));

CREATE POLICY "Admin mengubah berita"
  ON public.berita
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])))
  WITH CHECK ((SELECT private.has_role(ARRAY['admin'])));

CREATE POLICY "Admin menghapus berita"
  ON public.berita
  FOR DELETE
  TO authenticated
  USING ((SELECT private.has_role(ARRAY['admin'])));

COMMIT;
