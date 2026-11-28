-- =============================================================================
-- Migration 006: Atomic Transactional RPCs (SECURITY INVOKER) untuk Mutasi
--                Multi-Tabel Penugasan & Penanganan Laporan Karhutla (H-03)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.assign_petugas_atomic(
  p_laporan_id uuid,
  p_petugas_id uuid,
  p_catatan text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_status public.report_status;
  v_petugas_name text;
  v_petugas_role public.user_role;
  v_note text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan.' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_status
  FROM public.laporan_karhutla
  WHERE id = p_laporan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_status IN ('ditolak'::public.report_status, 'selesai'::public.report_status) THEN
    RAISE EXCEPTION 'Laporan yang sudah selesai atau ditolak tidak dapat ditugaskan.'
      USING ERRCODE = '22023';
  END IF;

  SELECT full_name, role INTO v_petugas_name, v_petugas_role
  FROM public.profiles
  WHERE id = p_petugas_id;

  IF NOT FOUND OR v_petugas_role <> 'petugas'::public.user_role THEN
    RAISE EXCEPTION 'Pengguna yang dipilih bukan akun dengan role Petugas.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.penugasan_laporan
  SET status_penugasan = 'dibatalkan'
  WHERE laporan_id = p_laporan_id
    AND status_penugasan IN ('ditugaskan', 'diterima', 'dalam_penanganan');

  INSERT INTO public.penugasan_laporan (
    laporan_id,
    petugas_id,
    assigned_by,
    status_penugasan,
    catatan
  )
  VALUES (
    p_laporan_id,
    p_petugas_id,
    v_uid,
    'ditugaskan',
    NULLIF(TRIM(COALESCE(p_catatan, '')), '')
  );

  v_note := CASE
    WHEN NULLIF(TRIM(COALESCE(p_catatan, '')), '') IS NOT NULL
      THEN ' Catatan: ' || TRIM(p_catatan)
    ELSE ''
  END;

  IF v_status = 'menunggu_verifikasi'::public.report_status THEN
    UPDATE public.laporan_karhutla
    SET
      status = 'terverifikasi'::public.report_status,
      verified_by = v_uid,
      verified_at = now()
    WHERE id = p_laporan_id;

    INSERT INTO public.laporan_riwayat_status (
      laporan_id, status_sebelumnya, status_baru, changed_by, catatan
    )
    VALUES (
      p_laporan_id,
      'menunggu_verifikasi',
      'terverifikasi',
      v_uid,
      'Diverifikasi dan ditugaskan ke ' || v_petugas_name || '.' || v_note
    );
  ELSE
    INSERT INTO public.laporan_riwayat_status (
      laporan_id, status_sebelumnya, status_baru, changed_by, catatan
    )
    VALUES (
      p_laporan_id,
      v_status::text,
      v_status::text,
      v_uid,
      'Penugasan petugas kepada ' || v_petugas_name || '.' || v_note
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_penanganan_atomic(
  p_laporan_id uuid,
  p_next_status public.report_status,
  p_catatan text,
  p_foto_bukti_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_role public.user_role;
  v_current_status public.report_status;
  v_assigned_petugas uuid;
  v_next_penugasan text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan.' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;

  SELECT status, petugas_id INTO v_current_status, v_assigned_petugas
  FROM public.laporan_karhutla
  WHERE id = p_laporan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_role <> 'admin'::public.user_role AND v_assigned_petugas IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Anda hanya dapat memperbarui progres laporan yang ditugaskan kepada Anda.'
      USING ERRCODE = '42501';
  END IF;

  IF v_current_status <> p_next_status THEN
    UPDATE public.laporan_karhutla
    SET status = p_next_status
    WHERE id = p_laporan_id;
  END IF;

  v_next_penugasan := CASE
    WHEN p_next_status = 'selesai'::public.report_status THEN 'selesai'
    ELSE 'dalam_penanganan'
  END;

  UPDATE public.penugasan_laporan
  SET
    status_penugasan = v_next_penugasan,
    completed_at = CASE
      WHEN p_next_status = 'selesai'::public.report_status THEN now()
      ELSE completed_at
    END
  WHERE laporan_id = p_laporan_id
    AND status_penugasan IN ('ditugaskan', 'diterima', 'dalam_penanganan')
    AND (v_role = 'admin'::public.user_role OR petugas_id = v_uid);

  INSERT INTO public.penanganan_log (
    laporan_id,
    petugas_id,
    status_update,
    catatan_penanganan,
    foto_bukti_url
  )
  VALUES (
    p_laporan_id,
    v_uid,
    p_next_status,
    TRIM(p_catatan),
    NULLIF(TRIM(COALESCE(p_foto_bukti_url, '')), '')
  );

  INSERT INTO public.laporan_riwayat_status (
    laporan_id,
    status_sebelumnya,
    status_baru,
    changed_by,
    catatan
  )
  VALUES (
    p_laporan_id,
    v_current_status::text,
    p_next_status::text,
    v_uid,
    TRIM(p_catatan)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_petugas_atomic(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_petugas_atomic(uuid, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.update_penanganan_atomic(uuid, public.report_status, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_penanganan_atomic(uuid, public.report_status, text, text) TO authenticated;
