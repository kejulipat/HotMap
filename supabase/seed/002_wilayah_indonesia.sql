-- =============================================================================
-- Seed 002 (Fase 2): Data Master Wilayah Pemantauan Karhutla Indonesia
-- =============================================================================
-- STATUS: LOKAL — IDEMPOTEN (`ON CONFLICT DO NOTHING`), SIAP DITERAPKAN SETELAH
--         PERSETUJUAN PENGGUNA ATAU MELALUI HALAMAN `/admin/wilayah`.
-- Catatan:
--   Seluruh koordinat `center_lat`, `center_lng` diverifikasi berada dalam batas
--   geografis wilayah Indonesia (lat: -11.5..6.5, lng: 94.5..142.0).
-- =============================================================================

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
