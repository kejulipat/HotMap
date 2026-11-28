-- Izinkan pengunjung publik (anon) dan pengguna login membaca foto bukti
-- HANYA untuk laporan yang sudah dipublikasikan (terverifikasi, ditangani, selesai).
-- Foto laporan berstatus `menunggu_verifikasi` atau `ditolak` tetap privat
-- (hanya dapat diakses oleh admin dan pelapor pemilik laporan).

GRANT SELECT ON TABLE public.laporan_foto TO anon;

CREATE POLICY "Publik lihat foto laporan terverifikasi"
ON public.laporan_foto
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.laporan_karhutla l
    WHERE l.id = laporan_foto.laporan_id
      AND l.status IN ('terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status)
  )
);

ALTER POLICY "Akses baca foto laporan terbatas"
ON public.laporan_foto
USING (
  (SELECT private.has_role(ARRAY['admin'::text]))
  OR uploaded_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.laporan_karhutla l
    WHERE l.id = laporan_foto.laporan_id
      AND (
        l.status IN ('terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status)
        OR l.pelapor_id = (SELECT auth.uid())
        OR (
          (SELECT private.has_role(ARRAY['petugas'::text]))
          AND (
            l.petugas_id = (SELECT auth.uid())
            OR EXISTS (
              SELECT 1
              FROM public.penugasan_laporan pg
              WHERE pg.laporan_id = l.id
                AND pg.petugas_id = (SELECT auth.uid())
                AND pg.status_penugasan <> 'dibatalkan'::text
            )
          )
        )
      )
  )
);

CREATE POLICY "Publik baca bukti laporan terverifikasi"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'laporan-bukti'::text
  AND EXISTS (
    SELECT 1
    FROM public.laporan_foto lf
    JOIN public.laporan_karhutla l ON l.id = lf.laporan_id
    WHERE lf.storage_path = objects.name
      AND l.status IN ('terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status)
  )
);

ALTER POLICY "Akses baca bukti laporan sesuai pemilik, petugas ditugaskan, at"
ON storage.objects
USING (
  bucket_id = 'laporan-bukti'::text
  AND (
    (SELECT private.has_role(ARRAY['admin'::text]))
    OR (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
    OR EXISTS (
      SELECT 1
      FROM public.laporan_foto lf
      JOIN public.laporan_karhutla l ON l.id = lf.laporan_id
      WHERE lf.storage_path = objects.name
        AND (
          l.status IN ('terverifikasi'::public.report_status, 'ditangani'::public.report_status, 'selesai'::public.report_status)
          OR l.pelapor_id = (SELECT auth.uid())
          OR l.petugas_id = (SELECT auth.uid())
        )
    )
  )
);
