-- =============================================================================
-- Seed 003: Data Dummy Operasional HotMap (Development / Pengujian)
-- =============================================================================
-- Catatan:
--   1. Idempoten (aman dijalankan ulang: ON CONFLICT DO NOTHING).
--   2. Menggunakan data master wilayah (12 wilayah Indonesia) dan akun eksisting
--      pada `public.profiles` (role: admin, petugas, pelapor).
--   3. Seluruh koordinat berada pada wilayah Indonesia (lat -11.5..6.5, lng 94.5..142.0).
--   4. HANYA untuk pengujian/pengembangan — jangan digunakan sebagai data produksi.
--
-- Pembersihan cepat data dummy (opsional sebelum produksi):
--   DELETE FROM public.laporan_karhutla WHERE id::text LIKE '11111111-1111-4111-8111-%';
--   DELETE FROM public.berita WHERE slug LIKE 'dummy-%';
-- =============================================================================

-- 1. Seed Master Wilayah Indonesia (12 wilayah)
INSERT INTO public.wilayah (nama_wilayah, kabupaten_kota, center_lat, center_lng)
VALUES
  ('Riau', 'Kabupaten Pelalawan', 0.2082, 102.1654),
  ('Riau', 'Kota Dumai', 1.6671, 101.4432),
  ('Jambi', 'Kabupaten Muaro Jambi', -1.5523, 103.8216),
  ('Sumatera Selatan', 'Kabupaten Ogan Komering Ilir', -3.3667, 105.0500),
  ('Kalimantan Barat', 'Kabupaten Kubu Raya', -0.2564, 109.4063),
  ('Kalimantan Tengah', 'Kota Palangka Raya', -2.2136, 113.9108),
  ('Kalimantan Tengah', 'Kabupaten Pulang Pisau', -2.7591, 114.2520),
  ('Kalimantan Selatan', 'Kota Banjarbaru', -3.4423, 114.8326),
  ('Kalimantan Timur', 'Kabupaten Kutai Kartanegara', -0.4402, 116.9814),
  ('Sulawesi Selatan', 'Kabupaten Gowa', -5.3167, 119.7500),
  ('Nusa Tenggara Timur', 'Kabupaten Sumba Timur', -9.8833, 120.2667),
  ('Papua Selatan', 'Kabupaten Merauke', -8.4932, 140.4018)
ON CONFLICT (nama_wilayah, kabupaten_kota) DO NOTHING;

-- 2. Seed Laporan Karhutla, Penugasan, Penanganan Log, Riwayat Status, dan Berita
DO $$
DECLARE
  v_admin_id uuid;
  v_petugas_id uuid;
  v_pelapor_id uuid;

  w_pelalawan uuid;
  w_dumai uuid;
  w_muaro_jambi uuid;
  w_oki uuid;
  w_kubu_raya uuid;
  w_palangka uuid;
  w_pulang_pisau uuid;
  w_banjarbaru uuid;
  w_kukar uuid;
  w_gowa uuid;
  w_sumba_timur uuid;
  w_merauke uuid;

  l01 uuid := '11111111-1111-4111-8111-000000000001';
  l02 uuid := '11111111-1111-4111-8111-000000000002';
  l03 uuid := '11111111-1111-4111-8111-000000000003';
  l04 uuid := '11111111-1111-4111-8111-000000000004';
  l05 uuid := '11111111-1111-4111-8111-000000000005';
  l06 uuid := '11111111-1111-4111-8111-000000000006';
  l07 uuid := '11111111-1111-4111-8111-000000000007';
  l08 uuid := '11111111-1111-4111-8111-000000000008';
  l09 uuid := '11111111-1111-4111-8111-000000000009';
  l10 uuid := '11111111-1111-4111-8111-000000000010';
  l11 uuid := '11111111-1111-4111-8111-000000000011';
  l12 uuid := '11111111-1111-4111-8111-000000000012';
BEGIN
  SELECT id INTO v_admin_id   FROM public.profiles WHERE role = 'admin'   ORDER BY created_at LIMIT 1;
  SELECT id INTO v_petugas_id FROM public.profiles WHERE role = 'petugas' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_pelapor_id FROM public.profiles WHERE role = 'pelapor' ORDER BY created_at LIMIT 1;

  IF v_admin_id IS NULL OR v_petugas_id IS NULL OR v_pelapor_id IS NULL THEN
    RAISE EXCEPTION 'Profil role admin, petugas, dan pelapor wajib tersedia di public.profiles sebelum menjalankan seed dummy.';
  END IF;

  SELECT id INTO w_pelalawan    FROM public.wilayah WHERE nama_wilayah = 'Riau'                AND kabupaten_kota = 'Kabupaten Pelalawan';
  SELECT id INTO w_dumai        FROM public.wilayah WHERE nama_wilayah = 'Riau'                AND kabupaten_kota = 'Kota Dumai';
  SELECT id INTO w_muaro_jambi  FROM public.wilayah WHERE nama_wilayah = 'Jambi'               AND kabupaten_kota = 'Kabupaten Muaro Jambi';
  SELECT id INTO w_oki          FROM public.wilayah WHERE nama_wilayah = 'Sumatera Selatan'    AND kabupaten_kota = 'Kabupaten Ogan Komering Ilir';
  SELECT id INTO w_kubu_raya    FROM public.wilayah WHERE nama_wilayah = 'Kalimantan Barat'    AND kabupaten_kota = 'Kabupaten Kubu Raya';
  SELECT id INTO w_palangka     FROM public.wilayah WHERE nama_wilayah = 'Kalimantan Tengah'   AND kabupaten_kota = 'Kota Palangka Raya';
  SELECT id INTO w_pulang_pisau FROM public.wilayah WHERE nama_wilayah = 'Kalimantan Tengah'   AND kabupaten_kota = 'Kabupaten Pulang Pisau';
  SELECT id INTO w_banjarbaru   FROM public.wilayah WHERE nama_wilayah = 'Kalimantan Selatan'  AND kabupaten_kota = 'Kota Banjarbaru';
  SELECT id INTO w_kukar        FROM public.wilayah WHERE nama_wilayah = 'Kalimantan Timur'    AND kabupaten_kota = 'Kabupaten Kutai Kartanegara';
  SELECT id INTO w_gowa         FROM public.wilayah WHERE nama_wilayah = 'Sulawesi Selatan'    AND kabupaten_kota = 'Kabupaten Gowa';
  SELECT id INTO w_sumba_timur  FROM public.wilayah WHERE nama_wilayah = 'Nusa Tenggara Timur' AND kabupaten_kota = 'Kabupaten Sumba Timur';
  SELECT id INTO w_merauke      FROM public.wilayah WHERE nama_wilayah = 'Papua Selatan'       AND kabupaten_kota = 'Kabupaten Merauke';

  -- Laporan Karhutla (12 laporan, mencakup seluruh 5 status, 5 jenis kejadian, & 4 keparahan)
  INSERT INTO public.laporan_karhutla (
    id, pelapor_id, wilayah_id, judul, deskripsi, jenis_kejadian, alamat_lokasi,
    latitude, longitude, estimasi_luas, tingkat_keparahan, status,
    catatan_verifikasi, verified_by, verified_at, petugas_id, waktu_kejadian, created_at
  )
  VALUES
    -- 1. Ditangani (Kritis) - Riau Pelalawan
    (
      l01, v_pelapor_id, w_pelalawan,
      'Kebakaran Lahan Gambut Dekat Jalan Lintas Timur',
      'Api menjalar cepat di area semak dan gambut kering sepanjang sisi utara Jalan Lintas Timur. Asap tebal mulai mengganggu jarak pandang pengendara.',
      'kebakaran_gambut', 'Kec. Pangkalan Kerinci, Kab. Pelalawan, Riau',
      0.3865, 101.8592, 12.50, 'kritis', 'ditangani',
      'Terverifikasi melalui koordinasi posko kecamatan. Prioritas pemadaman gambut.',
      v_admin_id, now() - interval '1 day 18 hours', v_petugas_id,
      now() - interval '2 days', now() - interval '2 days'
    ),
    -- 2. Ditangani (Tinggi) - Kalteng Palangka Raya
    (
      l02, v_pelapor_id, w_palangka,
      'Titik Api Aktif di Sekitar Jalan Mahir Mahar',
      'Terpantau nyala api pada lahan semak belukar dan kanal gambut dangkal sekitar 400 meter dari permukiman warga.',
      'kebakaran_gambut', 'Kel. Kalampangan, Kec. Sabangau, Kota Palangka Raya',
      -2.2754, 113.9985, 6.20, 'tinggi', 'ditangani',
      'Diverifikasi oleh admin posko. Tim regu darat dikerahkan ke lokasi.',
      v_admin_id, now() - interval '20 hours', v_petugas_id,
      now() - interval '1 day 2 hours', now() - interval '1 day 2 hours'
    ),
    -- 3. Ditangani (Sedang) - Sumsel OKI
    (
      l03, v_pelapor_id, w_oki,
      'Asap Pekat dan Bara Gambut di Area Kanal Sekunder',
      'Kepulan asap putih tebal terlihat sejak pagi hari disertai bara api bawah permukaan di lahan rawa yang mengering.',
      'asap_pekat', 'Kec. Tulung Selapan, Kab. Ogan Komering Ilir',
      -3.2145, 105.3012, 4.00, 'sedang', 'ditangani',
      'Laporan valid berdasarkan pantauan lapangan. Sedang dilakukan pembasahan kanal.',
      v_admin_id, now() - interval '2 days 16 hours', v_petugas_id,
      now() - interval '3 days', now() - interval '3 days'
    ),
    -- 4. Terverifikasi (Tinggi, sudah ditugaskan) - Riau Dumai
    (
      l04, v_pelapor_id, w_dumai,
      'Kebakaran Semak Belukar Perbatasan Medang Kampai',
      'Api membakar lahan terbuka yang ditumbuhi pakis dan alang-alang kering. Angin bertiup cukup kencang ke arah timur.',
      'kebakaran_lahan', 'Kec. Medang Kampai, Kota Dumai, Riau',
      1.6412, 101.5618, 3.80, 'tinggi', 'terverifikasi',
      'Terverifikasi. Petugas lapangan telah ditugaskan menuju lokasi.',
      v_admin_id, now() - interval '5 hours', v_petugas_id,
      now() - interval '8 hours', now() - interval '8 hours'
    ),
    -- 5. Terverifikasi (Sedang, belum ditugaskan) - Kalbar Kubu Raya
    (
      l05, v_pelapor_id, w_kubu_raya,
      'Kepulan Asap dari Lahan Pertanian Kering Rasau Jaya',
      'Warga melaporkan asap pekat dan percikan api dari area bekas pembukaan lahan di pinggir parit primer.',
      'asap_pekat', 'Kec. Rasau Jaya, Kab. Kubu Raya, Kalbar',
      -0.2318, 109.3812, 2.40, 'sedang', 'terverifikasi',
      'Dikonfirmasi oleh perangkat desa setempat. Menunggu alokasi regu terdekat.',
      v_admin_id, now() - interval '10 hours', NULL,
      now() - interval '14 hours', now() - interval '14 hours'
    ),
    -- 6. Menunggu Verifikasi - Kalteng Pulang Pisau
    (
      l06, v_pelapor_id, w_pulang_pisau,
      'Dugaan Titik Api Baru di Pinggir Hutan Sekunder Jabiren',
      'Terlihat kobaran api kecil dan asap keabu-abuan di tepi hutan sekunder sekitar 1 km dari jalan desa.',
      'kebakaran_hutan', 'Kec. Jabiren Raya, Kab. Pulang Pisau',
      -2.5482, 114.1765, 1.50, NULL, 'menunggu_verifikasi',
      NULL, NULL, NULL, NULL,
      now() - interval '3 hours', now() - interval '3 hours'
    ),
    -- 7. Menunggu Verifikasi - Jambi Muaro Jambi
    (
      l07, v_pelapor_id, w_muaro_jambi,
      'Asap Tebal Terlihat di Kawasan Kebun Campuran Kumpeh',
      'Bau asap sangat menyengat sejak siang hari di area perbatasan kebun masyarakat dan rawa gambut.',
      'kebakaran_lahan', 'Kec. Kumpeh Ulu, Kab. Muaro Jambi',
      -1.5841, 103.8542, 2.00, NULL, 'menunggu_verifikasi',
      NULL, NULL, NULL, NULL,
      now() - interval '6 hours', now() - interval '6 hours'
    ),
    -- 8. Menunggu Verifikasi - Riau Pelalawan (dekat l01 untuk uji clustering)
    (
      l08, v_pelapor_id, w_pelalawan,
      'Lahan Ilalang Terbakar di Dekat Permukiman Langgam',
      'Api mulai membakar ilalang kering di lahan kosong belakang area kebun sawit warga.',
      'kebakaran_lahan', 'Kec. Langgam, Kab. Pelalawan, Riau',
      0.3410, 101.8125, 0.90, NULL, 'menunggu_verifikasi',
      NULL, NULL, NULL, NULL,
      now() - interval '1 hour', now() - interval '1 hour'
    ),
    -- 9. Selesai (Tinggi) - Kalsel Banjarbaru
    (
      l09, v_pelapor_id, w_banjarbaru,
      'Kebakaran Lahan Rawa Dekat Kawasan Bandara Syamsudin Noor',
      'Api membakar semak dan rumput rawa di sisi selatan kawasan penyangga bandara sehingga berpotensi mengganggu jarak pandang.',
      'kebakaran_lahan', 'Kec. Landasan Ulin, Kota Banjarbaru, Kalsel',
      -3.4486, 114.7654, 5.10, 'tinggi', 'selesai',
      'Terverifikasi prioritas karena dekat jalur penerbangan.',
      v_admin_id, now() - interval '5 days 20 hours', v_petugas_id,
      now() - interval '6 days', now() - interval '6 days'
    ),
    -- 10. Selesai (Sedang) - Kaltim Kutai Kartanegara
    (
      l10, v_pelapor_id, w_kukar,
      'Kebakaran Hutan Sekunder Bukit Soeharto Bagian Utara',
      'Terjadi kebakaran serasah dan pepohonan kering di lereng perbukitan akibat musim kemarau panjang.',
      'kebakaran_hutan', 'Kec. Samboja, Kab. Kutai Kartanegara, Kaltim',
      -0.8645, 117.0412, 3.25, 'sedang', 'selesai',
      'Terverifikasi bersama petugas kehutanan setempat.',
      v_admin_id, now() - interval '8 days 18 hours', v_petugas_id,
      now() - interval '9 days', now() - interval '9 days'
    ),
    -- 11. Selesai (Rendah) - NTT Sumba Timur
    (
      l11, v_pelapor_id, w_sumba_timur,
      'Kebakaran Padang Sabana Perbukitan Kambera',
      'Api menjalar di padang rumput sabana kering saat angin kencang sore hari, namun jauh dari permukiman.',
      'kebakaran_lahan', 'Kec. Kambera, Kab. Sumba Timur, NTT',
      -9.6612, 120.2894, 4.75, 'rendah', 'selesai',
      'Diverifikasi oleh posko daerah. Dilakukan sekat bakar manual.',
      v_admin_id, now() - interval '10 days 22 hours', v_petugas_id,
      now() - interval '11 days', now() - interval '11 days'
    ),
    -- 12. Ditolak - Sulsel Gowa
    (
      l12, v_pelapor_id, w_gowa,
      'Asap di Pinggir Jalan Poros Malino (Bukan Karhutla)',
      'Terlihat kepulan asap cukup tebal dari kejauhan di dekat lereng bukit jalur menuju Malino.',
      'lainnya', 'Kec. Tinggimoncong, Kab. Gowa, Sulsel',
      -5.2495, 119.8612, 0.05, NULL, 'ditolak',
      'Setelah pengecekan lapangan, sumber asap berasal dari pembakaran sampah rumah tangga terkendali dan sudah dipadamkan warga.',
      v_admin_id, now() - interval '4 days 12 hours', NULL,
      now() - interval '4 days 18 hours', now() - interval '4 days 18 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Penugasan Laporan (6 penugasan aktif & selesai; trigger otomatis menyinkronkan petugas_id)
  INSERT INTO public.penugasan_laporan (
    id, laporan_id, petugas_id, assigned_by, status_penugasan, catatan, assigned_at, completed_at
  )
  VALUES
    (
      '22222222-2222-4222-8222-000000000001', l01, v_petugas_id, v_admin_id,
      'dalam_penanganan', 'Bawa pompa apung dan selang tekanan tinggi untuk pendinginan gambut.',
      now() - interval '1 day 17 hours', NULL
    ),
    (
      '22222222-2222-4222-8222-000000000002', l02, v_petugas_id, v_admin_id,
      'dalam_penanganan', 'Amankan perimeter sisi timur yang dekat permukiman warga.',
      now() - interval '19 hours', NULL
    ),
    (
      '22222222-2222-4222-8222-000000000003', l03, v_petugas_id, v_admin_id,
      'dalam_penanganan', 'Lakukan penyekatan kanal dan pembasahan bara bawah permukaan.',
      now() - interval '2 days 15 hours', NULL
    ),
    (
      '22222222-2222-4222-8222-000000000004', l04, v_petugas_id, v_admin_id,
      'ditugaskan', 'Segera cek akses masuk kendaraan tangki di Medang Kampai.',
      now() - interval '4 hours', NULL
    ),
    (
      '22222222-2222-4222-8222-000000000005', l09, v_petugas_id, v_admin_id,
      'selesai', 'Prioritas penuh area penyangga bandara.',
      now() - interval '5 days 19 hours', now() - interval '5 days 6 hours'
    ),
    (
      '22222222-2222-4222-8222-000000000006', l10, v_petugas_id, v_admin_id,
      'selesai', 'Koordinasi dengan regu kehutanan setempat untuk mopping up.',
      now() - interval '8 days 17 hours', now() - interval '8 days 2 hours'
    ),
    (
      '22222222-2222-4222-8222-000000000007', l11, v_petugas_id, v_admin_id,
      'selesai', 'Buat sekat bakar manual agar api tidak merambat ke ladang warga.',
      now() - interval '10 days 21 hours', now() - interval '10 days 10 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Penanganan Log (7 log aktivitas lapangan petugas)
  INSERT INTO public.penanganan_log (
    id, laporan_id, petugas_id, status_update, catatan_penanganan, created_at
  )
  VALUES
    (
      '33333333-3333-4333-8333-000000000001', l01, v_petugas_id, 'ditangani',
      'Regu tiba di lokasi. Titik api utama sepanjang 200 meter mulai dilokalisir menggunakan 2 unit pompa apung dari parit terdekat.',
      now() - interval '1 day 14 hours'
    ),
    (
      '33333333-3333-4333-8333-000000000002', l01, v_petugas_id, 'ditangani',
      'Api permukaan berhasil ditekan sekitar 65%, namun bara gambut kedalaman 30 cm masih berasap dan terus dilakukan pembasahan.',
      now() - interval '10 hours'
    ),
    (
      '33333333-3333-4333-8333-000000000003', l02, v_petugas_id, 'ditangani',
      'Pembuatan sekat basah di sisi permukiman selesai. Pemadaman fokus ke titik api tengah lahan.',
      now() - interval '12 hours'
    ),
    (
      '33333333-3333-4333-8333-000000000004', l03, v_petugas_id, 'ditangani',
      'Pembasahan area kanal sekunder sedang berlangsung bersama relawan MPA desa setempat.',
      now() - interval '1 day 20 hours'
    ),
    (
      '33333333-3333-4333-8333-000000000005', l09, v_petugas_id, 'selesai',
      'Seluruh titik api dan asap di kawasan Landasan Ulin telah padam total. Pendinginan (mopping up) dinyatakan aman.',
      now() - interval '5 days 6 hours'
    ),
    (
      '33333333-3333-4333-8333-000000000006', l10, v_petugas_id, 'selesai',
      'Kebakaran serasah berhasil dipadamkan seluruhnya dan patroli pengecekan ulang tidak menemukan bara aktif.',
      now() - interval '8 days 2 hours'
    ),
    (
      '33333333-3333-4333-8333-000000000007', l11, v_petugas_id, 'selesai',
      'Sekat bakar efektif menahan laju api di padang sabana. Lokasi dinyatakan padam dan aman.',
      now() - interval '10 days 10 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Riwayat Status Laporan (jejak audit kronologis)
  INSERT INTO public.laporan_riwayat_status (
    id, laporan_id, status_sebelumnya, status_baru, changed_by, catatan, created_at
  )
  VALUES
    -- l01
    ('44444444-4444-4444-8444-000000000001', l01, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '2 days'),
    ('44444444-4444-4444-8444-000000000002', l01, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Terverifikasi sebagai kejadian prioritas kritis.', now() - interval '1 day 18 hours'),
    ('44444444-4444-4444-8444-000000000003', l01, 'terverifikasi', 'ditangani', v_petugas_id, 'Regu darat memulai pemadaman dan pembasahan gambut.', now() - interval '1 day 14 hours'),
    -- l02
    ('44444444-4444-4444-8444-000000000004', l02, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '1 day 2 hours'),
    ('44444444-4444-4444-8444-000000000005', l02, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Laporan diverifikasi admin posko.', now() - interval '20 hours'),
    ('44444444-4444-4444-8444-000000000006', l02, 'terverifikasi', 'ditangani', v_petugas_id, 'Penanganan lapangan dan pengamanan perimeter dimulai.', now() - interval '12 hours'),
    -- l03
    ('44444444-4444-4444-8444-000000000007', l03, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '3 days'),
    ('44444444-4444-4444-8444-000000000008', l03, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Validasi laporan selesai.', now() - interval '2 days 16 hours'),
    ('44444444-4444-4444-8444-000000000009', l03, 'terverifikasi', 'ditangani', v_petugas_id, 'Pembasahan bara gambut dimulai bersama MPA.', now() - interval '1 day 20 hours'),
    -- l04
    ('44444444-4444-4444-8444-000000000010', l04, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '8 hours'),
    ('44444444-4444-4444-8444-000000000011', l04, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Terverifikasi dan petugas ditugaskan menuju lokasi.', now() - interval '5 hours'),
    -- l05
    ('44444444-4444-4444-8444-000000000012', l05, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '14 hours'),
    ('44444444-4444-4444-8444-000000000013', l05, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Terverifikasi oleh admin, menunggu penugasan regu.', now() - interval '10 hours'),
    -- l06, l07, l08
    ('44444444-4444-4444-8444-000000000014', l06, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '3 hours'),
    ('44444444-4444-4444-8444-000000000015', l07, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '6 hours'),
    ('44444444-4444-4444-8444-000000000016', l08, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '1 hour'),
    -- l09
    ('44444444-4444-4444-8444-000000000017', l09, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '6 days'),
    ('44444444-4444-4444-8444-000000000018', l09, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Terverifikasi prioritas kawasan bandara.', now() - interval '5 days 20 hours'),
    ('44444444-4444-4444-8444-000000000019', l09, 'terverifikasi', 'ditangani', v_petugas_id, 'Tim mulai pemadaman intensif.', now() - interval '5 days 16 hours'),
    ('44444444-4444-4444-8444-000000000020', l09, 'ditangani', 'selesai', v_petugas_id, 'Api padam total dan area aman.', now() - interval '5 days 6 hours'),
    -- l10
    ('44444444-4444-4444-8444-000000000021', l10, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '9 days'),
    ('44444444-4444-4444-8444-000000000022', l10, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Diverifikasi bersama tim kehutanan.', now() - interval '8 days 18 hours'),
    ('44444444-4444-4444-8444-000000000023', l10, 'terverifikasi', 'ditangani', v_petugas_id, 'Pemadaman serasah dimulai.', now() - interval '8 days 12 hours'),
    ('44444444-4444-4444-8444-000000000024', l10, 'ditangani', 'selesai', v_petugas_id, 'Selesai dipadamkan tanpa bara aktif.', now() - interval '8 days 2 hours'),
    -- l11
    ('44444444-4444-4444-8444-000000000025', l11, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '11 days'),
    ('44444444-4444-4444-8444-000000000026', l11, 'menunggu_verifikasi', 'terverifikasi', v_admin_id, 'Terverifikasi oleh posko daerah.', now() - interval '10 days 22 hours'),
    ('44444444-4444-4444-8444-000000000027', l11, 'terverifikasi', 'ditangani', v_petugas_id, 'Pembuatan sekat bakar manual.', now() - interval '10 days 18 hours'),
    ('44444444-4444-4444-8444-000000000028', l11, 'ditangani', 'selesai', v_petugas_id, 'Api padam sepenuhnya.', now() - interval '10 days 10 hours'),
    -- l12
    ('44444444-4444-4444-8444-000000000029', l12, NULL, 'menunggu_verifikasi', v_pelapor_id, 'Laporan kejadian dikirim oleh pelapor.', now() - interval '4 days 18 hours'),
    ('44444444-4444-4444-8444-000000000030', l12, 'menunggu_verifikasi', 'ditolak', v_admin_id, 'Bukan kejadian karhutla (pembakaran sampah terkendali).', now() - interval '4 days 12 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Berita & Informasi (6 artikel: 5 published + 1 draft, mencakup 4 kategori)
  INSERT INTO public.berita (
    judul, slug, ringkasan, isi, kategori, status, author_id, published_at, created_at
  )
  VALUES
    (
      'Peringatan Dini Potensi Kekeringan Lahan Gambut di Riau dan Kalimantan Tengah',
      'dummy-peringatan-dini-gambut-riau-kalteng',
      'Masyarakat diimbau meningkatkan kewaspadaan terhadap potensi karhutla seiring menurunnya curah hujan di sejumlah kabupaten rawan gambut.',
      'Posko pemantauan karhutla mengingatkan seluruh masyarakat dan pengelola lahan di wilayah Riau serta Kalimantan Tengah untuk tidak melakukan pembakaran terbuka. Kondisi muka air tanah pada beberapa blok gambut mulai menurun sehingga percikan api kecil dapat menjalar cepat di bawah permukaan tanah. Segera laporkan indikasi asap atau titik api melalui kanal pelaporan HotMap lengkap dengan titik koordinat lokasi.',
      'peringatan', 'published', v_admin_id, now() - interval '1 day', now() - interval '1 day'
    ),
    (
      'Tim Gabungan Lakukan Pembasahan Intensif Lahan Gambut di Pelalawan',
      'dummy-pembasahan-intensif-pelalawan',
      'Regu pemadam darat mengerahkan pompa apung dan memanfaatkan sekat kanal untuk menahan penjalaran bara gambut.',
      'Petugas lapangan bersama Masyarakat Peduli Api (MPA) terus melakukan operasi pemadaman dan pendinginan (mopping up) pada area gambut yang terbakar di Kabupaten Pelalawan. Strategi utama difokuskan pada pemutusan kepala api di permukaan serta penyuntikan air ke lapisan gambut bawah guna mencegah api kembali menyala saat angin kencang pada siang hari.',
      'penanganan', 'published', v_admin_id, now() - interval '2 days', now() - interval '2 days'
    ),
    (
      'Panduan Warga: Cara Melaporkan Kejadian Karhutla Secara Akurat di HotMap',
      'dummy-panduan-melaporkan-karhutla-hotmap',
      'Langkah praktis menandai titik koordinat, mengunggah foto bukti, dan memantau status penanganan laporan karhutla.',
      'Pelaporan yang cepat dan akurat membantu petugas menjangkau lokasi kebakaran sebelum api meluas. Saat membuat laporan di HotMap, pastikan lokasi dipilih langsung pada peta interaktif atau menggunakan fitur GPS perangkat, pilih jenis kejadian yang sesuai, serta sertakan foto kondisi lapangan yang jelas. Setelah dikirim, pelapor dapat memantau tahapan verifikasi, penugasan petugas, hingga status selesai secara transparan.',
      'edukasi', 'published', v_admin_id, now() - interval '4 days', now() - interval '4 days'
    ),
    (
      'Operasi Pemadaman Kawasan Penyangga Bandara Banjarbaru Dinyatakan Selesai',
      'dummy-pemadaman-banjarbaru-selesai',
      'Sinergi regu darat berhasil memadamkan kebakaran lahan rawa di Kecamatan Landasan Ulin tanpa mengganggu operasional penerbangan.',
      'Setelah melalui proses pemadaman dan pendinginan menyeluruh, titik kebakaran lahan rawa di wilayah Landasan Ulin, Kota Banjarbaru resmi dinyatakan padam total. Patroli lanjutan tetap disiagakan selama beberapa hari ke depan guna memastikan tidak ada bara tersisa yang berpotensi memicu kabut asap di sekitar kawasan bandara.',
      'penanganan', 'published', v_admin_id, now() - interval '5 days', now() - interval '5 days'
    ),
    (
      'Pemutakhiran Data Wilayah Pemantauan Operasional Karhutla Nasional',
      'dummy-pemutakhiran-data-wilayah-hotmap',
      'Sebanyak 12 wilayah prioritas dari Sumatera hingga Papua Selatan telah terintegrasi ke dalam peta pemantauan HotMap.',
      'Sebagai bagian dari penguatan sistem informasi geografis operasional, HotMap telah menambahkan data master 12 kabupaten/kota prioritas pemantauan kebakaran hutan dan lahan di seluruh Indonesia. Integrasi koordinat pusat wilayah ini mempermudah proses pemetaan laporan warga, distribusi tugas petugas lapangan, serta penyusunan analitik tren kejadian per wilayah.',
      'informasi', 'published', v_admin_id, now() - interval '7 days', now() - interval '7 days'
    ),
    (
      'Draf Evaluasi Kesiapsiagaan Regu Pemadam Menghadapi Puncak Kemarau',
      'dummy-draf-evaluasi-kesiapsiagaan-kemarau',
      'Catatan internal draf evaluasi kesiapan pompa air, akses embung, dan koordinasi posko daerah.',
      'Artikel ini merupakan draf internal untuk merangkum hasil pemeriksaan kesiapan sarana prasarana pemadaman, ketersediaan sumber air permukaan, serta pemetaan jalur akses kendaraan operasional di wilayah rawan karhutla sebelum diterbitkan secara resmi.',
      'informasi', 'draft', v_admin_id, NULL, now() - interval '12 hours'
    )
  ON CONFLICT (slug) DO NOTHING;
END $$;
