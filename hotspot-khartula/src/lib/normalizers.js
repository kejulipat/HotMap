import {
  getBeritaImagePublicUrl,
  getLaporanEvidenceSignedUrl,
} from "@/lib/storage";

export const STATUS_META = {
  menunggu_verifikasi: {
    label: "Menunggu verifikasi",
    dotColor: "bg-[#D9822B]",
    badgeBg: "bg-[#FEF5E7]",
    badgeText: "text-[#B5651D]",
    pinRing: "ring-[#D9822B]/30",
    pinBg: "bg-[#D9822B]",
  },
  terverifikasi: {
    label: "Terverifikasi",
    dotColor: "bg-[#2B7FD9]",
    badgeBg: "bg-[#EBF4FF]",
    badgeText: "text-[#1E62B5]",
    pinRing: "ring-[#2B7FD9]/30",
    pinBg: "bg-[#2B7FD9]",
  },
  ditangani: {
    label: "Ditangani",
    dotColor: "bg-[#D9532B]",
    badgeBg: "bg-[#FDEEE9]",
    badgeText: "text-[#B83E1B]",
    pinRing: "ring-[#D9532B]/30",
    pinBg: "bg-[#D9532B]",
  },
  selesai: {
    label: "Selesai",
    dotColor: "bg-[#2E8555]",
    badgeBg: "bg-[#EAF5EE]",
    badgeText: "text-[#1F6B41]",
    pinRing: "ring-[#2E8555]/30",
    pinBg: "bg-[#2E8555]",
  },
  ditolak: {
    label: "Ditolak",
    dotColor: "bg-[#7A8680]",
    badgeBg: "bg-[#F0F2F0]",
    badgeText: "text-[#525E58]",
    pinRing: "ring-[#7A8680]/30",
    pinBg: "bg-[#7A8680]",
  },
};

export const SUMMARY_CARDS = [
  { key: "semua", label: "Total laporan", dotColor: "bg-[#52D19C]" },
  {
    key: "menunggu_verifikasi",
    label: "Menunggu verifikasi",
    dotColor: "bg-[#D9822B]",
  },
  { key: "terverifikasi", label: "Terverifikasi", dotColor: "bg-[#2B7FD9]" },
  { key: "ditangani", label: "Ditangani", dotColor: "bg-[#D9532B]" },
  { key: "selesai", label: "Selesai", dotColor: "bg-[#2E8555]" },
  { key: "ditolak", label: "Ditolak", dotColor: "bg-[#7A8680]" },
];

const JAKARTA_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function normalizeStatusKey(rawStatus) {
  if (!rawStatus) return "menunggu_verifikasi";
  const s = String(rawStatus).toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (
    s.includes("belum") ||
    s.includes("tidak_terverifikasi") ||
    s === "unverified" ||
    s.includes("menunggu") ||
    s === "pending" ||
    s === "baru"
  ) {
    return "menunggu_verifikasi";
  }
  if (s.includes("terverifikasi") || s === "verified" || s === "valid") {
    return "terverifikasi";
  }
  if (s.includes("ditangani") || s.includes("proses") || s === "in_progress") {
    return "ditangani";
  }
  if (s.includes("selesai") || s === "done" || s === "resolved") {
    return "selesai";
  }
  if (s.includes("ditolak") || s === "rejected") {
    return "ditolak";
  }
  return "menunggu_verifikasi";
}

export function normalizeDate(rawDate) {
  if (!rawDate) return "";
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  return Number.isNaN(d.getTime())
    ? str.slice(0, 10)
    : JAKARTA_DATE_FORMAT.format(d);
}

export function parseCoord(val) {
  if (val === null || val === undefined || typeof val === "boolean") {
    return null;
  }
  if (typeof val === "string" && val.trim() === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

export function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(val) {
  return typeof val === "string" && UUID_REGEX.test(val.trim());
}

export function normalizeLuas(row) {
  const val = row?.estimasi_luas ?? row?.luas ?? null;
  if (val === null || val === undefined || val === "") return "-";
  const str = String(val).trim();
  return str.toLowerCase().includes("ha") ? str : `${str} ha`;
}

export function formatDate(dateStr, month = "long") {
  if (!dateStr) return "-";
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = new Date(isDateOnly ? `${dateStr}T00:00:00+07:00` : dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/**
 * Konversi koordinat (lat, lng) wilayah Indonesia ke posisi persen (x%, y%) pada kanvas peta.
 */
export function projectToIndonesiaMap(lat, lng) {
  const minLng = 94.5;
  const maxLng = 141.5;
  const minLat = -11.5;
  const maxLat = 6.5;

  const x = ((lng - minLng) / (maxLng - minLng)) * 78 + 7;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 68 + 16;

  return {
    x: Math.max(6, Math.min(88, x)),
    y: Math.max(12, Math.min(86, y)),
  };
}

export function computeStatusCounts(laporanList = []) {
  const counts = {
    semua: laporanList.length,
    menunggu_verifikasi: 0,
    terverifikasi: 0,
    ditangani: 0,
    selesai: 0,
    ditolak: 0,
  };
  for (const item of laporanList) {
    if (counts[item.statusKey] !== undefined) {
      counts[item.statusKey] += 1;
    }
  }
  return counts;
}

const BASE_LAPORAN_COLS =
  "id, judul, deskripsi, wilayah_id, created_at, updated_at, status, latitude, longitude, pelapor_id, catatan_verifikasi";

const EXTENDED_LAPORAN_COLS = `${BASE_LAPORAN_COLS}, jenis_kejadian, alamat_lokasi, estimasi_luas, tingkat_keparahan, petugas_id, verified_by, verified_at`;

function isMissingTableError(error) {
  return error?.code === "PGRST205";
}

function isMissingColumnError(error) {
  return error?.code === "42703";
}

function normalizeBeritaRow(b, idx, supabase, profileById = new Map()) {
  const resolvedGambarUrl =
    b.gambar_url ||
    (b.gambar_path ? getBeritaImagePublicUrl(supabase, b.gambar_path) : null);

  return {
    id: String(b.id ?? b.slug ?? `berita-${idx + 1}`),
    slug: b.slug ?? String(b.id ?? `berita-${idx + 1}`),
    judul: b.judul ?? `Berita #${idx + 1}`,
    ringkasan: b.ringkasan ?? b.isi ?? "",
    isi: b.isi ?? b.konten ?? b.deskripsi ?? "",
    kategori: b.kategori ?? "informasi",
    status: b.status ?? "published",
    tanggal: normalizeDate(b.published_at ?? b.created_at),
    publishedAt: b.published_at ?? null,
    createdAt: b.created_at ?? null,
    updatedAt: b.updated_at ?? null,
    authorId: b.author_id ?? null,
    penulis: b.penulis ?? profileById.get(b.author_id) ?? "Admin",
    gambarPath: b.gambar_path ?? null,
    gambarUrl: resolvedGambarUrl ?? null,
  };
}

function normalizeLaporanRow(row, idx, wilayahById, profileById) {
  const wilayahNama = wilayahById.get(row.wilayah_id) ?? "Indonesia";
  const pelaporNama = row.pelapor_id
    ? profileById.get(row.pelapor_id) ?? "Warga Pelapor"
    : "Warga Pelapor";
  const petugasNama = row.petugas_id
    ? profileById.get(row.petugas_id) ?? "Petugas Lapangan"
    : "Belum ditugaskan";

  return {
    id: row.id ?? `lap-${idx + 1}`,
    judul: row.judul ?? `Laporan Karhutla #${idx + 1}`,
    deskripsi: row.deskripsi ?? "",
    jenisKejadian: row.jenis_kejadian ?? null,
    alamatLokasi: row.alamat_lokasi ?? null,
    tingkatKeparahan: row.tingkat_keparahan ?? null,
    lokasiSingkat: wilayahNama,
    wilayahId: row.wilayah_id ?? null,
    wilayah: wilayahNama,
    tanggal: normalizeDate(row.created_at),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    statusRaw: row.status ?? "menunggu_verifikasi",
    statusKey: normalizeStatusKey(row.status),
    estimasiLuas: normalizeLuas(row),
    latitude: parseCoord(row.latitude),
    longitude: parseCoord(row.longitude),
    pelaporId: row.pelapor_id ?? null,
    pelapor: pelaporNama,
    petugasId: row.petugas_id ?? null,
    petugas: petugasNama,
    verifiedBy: row.verified_by ?? null,
    verifiedAt: row.verified_at ?? null,
    catatanVerifikasi: row.catatan_verifikasi ?? "",
  };
}

export async function fetchNormalizedDataset(
  supabase,
  { pelaporId = null, limit = 100, beritaLimit = 3 } = {}
) {
  let laporanQuery = supabase
    .from("laporan_karhutla")
    .select(EXTENDED_LAPORAN_COLS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pelaporId) {
    laporanQuery = laporanQuery.eq("pelapor_id", pelaporId);
  }

  let [wilayahRes, laporanRes, beritaRes] = await Promise.all([
    supabase
      .from("wilayah")
      .select("id, nama_wilayah, kabupaten_kota, center_lat, center_lng, created_at")
      .order("nama_wilayah", { ascending: true }),
    laporanQuery,
    supabase
      .from("berita")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(beritaLimit),
  ]);

  if (isMissingColumnError(laporanRes.error)) {
    let fallbackQuery = supabase
      .from("laporan_karhutla")
      .select(BASE_LAPORAN_COLS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (pelaporId) {
      fallbackQuery = fallbackQuery.eq("pelapor_id", pelaporId);
    }
    laporanRes = await fallbackQuery;
  }

  if (isMissingColumnError(wilayahRes.error)) {
    wilayahRes = await supabase
      .from("wilayah")
      .select("id, nama_wilayah, created_at")
      .order("nama_wilayah", { ascending: true });
  }

  const rawWilayah = wilayahRes.data ?? [];
  const rawLaporan = laporanRes.data ?? [];
  const beritaTableReady = !isMissingTableError(beritaRes.error);
  const rawBerita = beritaTableReady && !beritaRes.error ? beritaRes.data ?? [] : [];

  const profileIds = Array.from(
    new Set(
      [
        ...rawLaporan.map((row) => row.pelapor_id),
        ...rawLaporan.map((row) => row.petugas_id),
        ...rawBerita.map((b) => b.author_id),
      ].filter(Boolean)
    )
  );

  const rawProfiles =
    profileIds.length > 0
      ? (
          await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("id", profileIds)
        ).data ?? []
      : [];

  const wilayahById = new Map();
  for (const w of rawWilayah) {
    if (w.id && w.nama_wilayah) {
      wilayahById.set(w.id, w.nama_wilayah);
    }
  }

  const profileById = new Map();
  for (const p of rawProfiles) {
    if (p.id && p.full_name) {
      profileById.set(p.id, p.full_name);
    }
  }

  const wilayahList = rawWilayah.map((w, idx) => ({
    id: w.id ?? `w-${idx}`,
    nama: w.nama_wilayah ?? `Wilayah ${idx + 1}`,
    kabupatenKota: w.kabupaten_kota ?? null,
    centerLat: parseCoord(w.center_lat),
    centerLng: parseCoord(w.center_lng),
    createdAt: w.created_at ?? null,
  }));

  const laporanList = rawLaporan.map((row, idx) =>
    normalizeLaporanRow(row, idx, wilayahById, profileById)
  );

  const beritaList = rawBerita.map((b, idx) =>
    normalizeBeritaRow(b, idx, supabase, profileById)
  );

  const beritaRealError =
    beritaRes.error && !isMissingTableError(beritaRes.error)
      ? beritaRes.error
      : null;

  return {
    wilayahList,
    laporanList,
    beritaList,
    beritaTableReady,
    hasQueryError: Boolean(
      wilayahRes.error || laporanRes.error || beritaRealError
    ),
  };
}

export async function fetchLaporanById(supabase, id) {
  if (!id || !isUuid(id)) {
    return {
      laporan: null,
      fotoList: [],
      penugasanList: [],
      riwayatList: [],
      penangananLogList: [],
      relationsReady: true,
      error: null,
    };
  }

  let { data: row, error } = await supabase
    .from("laporan_karhutla")
    .select(EXTENDED_LAPORAN_COLS)
    .eq("id", id)
    .maybeSingle();

  // Kompatibel sebelum migration 002 diterapkan ke database live
  if (isMissingColumnError(error)) {
    const fallback = await supabase
      .from("laporan_karhutla")
      .select(BASE_LAPORAN_COLS)
      .eq("id", id)
      .maybeSingle();
    row = fallback.data;
    error = fallback.error;
  }

  if (error || !row) {
    return {
      laporan: null,
      fotoList: [],
      penugasanList: [],
      riwayatList: [],
      penangananLogList: [],
      relationsReady: false,
      error,
    };
  }

  const [wilayahRes, fotoRes, penugasanRes, riwayatRes, logRes] =
    await Promise.all([
      row.wilayah_id
        ? supabase
            .from("wilayah")
            .select("id, nama_wilayah")
            .eq("id", row.wilayah_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("laporan_foto")
        .select(
          "id, storage_path, uploaded_by, jenis_foto, mime_type, file_size, created_at"
        )
        .eq("laporan_id", row.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("penugasan_laporan")
        .select(
          "id, petugas_id, assigned_by, status_penugasan, catatan, assigned_at, completed_at"
        )
        .eq("laporan_id", row.id)
        .order("assigned_at", { ascending: false }),
      supabase
        .from("laporan_riwayat_status")
        .select("id, status_sebelumnya, status_baru, changed_by, catatan, created_at")
        .eq("laporan_id", row.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("penanganan_log")
        .select("id, petugas_id, status_update, catatan_penanganan, foto_bukti_url, created_at")
        .eq("laporan_id", row.id)
        .order("created_at", { ascending: false }),
    ]);

  const relationsReady =
    !isMissingTableError(fotoRes.error) &&
    !isMissingTableError(penugasanRes.error) &&
    !isMissingTableError(riwayatRes.error);

  const rawFoto = !fotoRes.error ? fotoRes.data ?? [] : [];
  const rawPenugasan = !penugasanRes.error ? penugasanRes.data ?? [] : [];
  const rawRiwayat = !riwayatRes.error ? riwayatRes.data ?? [] : [];
  const rawLogs = !logRes.error ? logRes.data ?? [] : [];

  const profileIds = Array.from(
    new Set(
      [
        row.pelapor_id,
        row.petugas_id,
        row.verified_by,
        ...rawPenugasan.map((p) => p.petugas_id),
        ...rawPenugasan.map((p) => p.assigned_by),
        ...rawRiwayat.map((r) => r.changed_by),
        ...rawLogs.map((l) => l.petugas_id),
      ].filter(Boolean)
    )
  );

  const rawProfiles =
    profileIds.length > 0
      ? (
          await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", profileIds)
        ).data ?? []
      : [];

  const wilayahById = new Map();
  if (wilayahRes.data?.id && wilayahRes.data?.nama_wilayah) {
    wilayahById.set(wilayahRes.data.id, wilayahRes.data.nama_wilayah);
  }

  const profileById = new Map();
  for (const p of rawProfiles) {
    if (p.id && p.full_name) {
      profileById.set(p.id, p.full_name);
    }
  }

  const fotoList = await Promise.all(
    rawFoto.map(async (f) => {
      const { signedUrl } = await getLaporanEvidenceSignedUrl(
        supabase,
        f.storage_path,
        3600
      );
      return {
        id: f.id,
        storagePath: f.storage_path,
        jenisFoto: f.jenis_foto,
        mimeType: f.mime_type,
        fileSize: f.file_size,
        createdAt: f.created_at,
        signedUrl,
      };
    })
  );

  const penugasanList = rawPenugasan.map((p) => ({
    id: p.id,
    petugasId: p.petugas_id,
    petugasNama: profileById.get(p.petugas_id) ?? "Petugas",
    assignedByNama: profileById.get(p.assigned_by) ?? "Admin",
    statusPenugasan: p.status_penugasan,
    catatan: p.catatan ?? "",
    assignedAt: p.assigned_at,
    completedAt: p.completed_at,
  }));

  const riwayatList = rawRiwayat.map((r) => ({
    id: r.id,
    statusSebelumnya: r.status_sebelumnya,
    statusBaru: r.status_baru,
    changedByNama: r.changed_by ? profileById.get(r.changed_by) ?? "Sistem" : "Sistem",
    catatan: r.catatan ?? "",
    createdAt: r.created_at,
  }));

  const penangananLogList = rawLogs.map((l) => ({
    id: l.id,
    statusUpdate: l.status_update,
    petugasNama: l.petugas_id
      ? profileById.get(l.petugas_id) ?? "Petugas Lapangan"
      : "Petugas Lapangan",
    catatanPenanganan: l.catatan_penanganan ?? "",
    fotoBuktiUrl: l.foto_bukti_url ?? null,
    createdAt: l.created_at,
  }));

  return {
    laporan: normalizeLaporanRow(row, 0, wilayahById, profileById),
    fotoList,
    penugasanList,
    riwayatList,
    penangananLogList,
    relationsReady,
    error: null,
  };
}

export async function fetchBeritaList(
  supabase,
  limit = 50,
  { includeAllStatuses = false } = {}
) {
  let query = supabase.from("berita").select("*");
  if (!includeAllStatuses) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      beritaList: [],
      tableReady: !isMissingTableError(error),
      error: isMissingTableError(error) ? null : error,
    };
  }

  const rows = data ?? [];
  const authorIds = Array.from(
    new Set(rows.map((b) => b.author_id).filter(Boolean))
  );
  const rawProfiles =
    authorIds.length > 0
      ? (
          await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", authorIds)
        ).data ?? []
      : [];
  const profileById = new Map(
    rawProfiles.map((p) => [p.id, p.full_name]).filter(([, n]) => Boolean(n))
  );

  return {
    beritaList: rows.map((b, idx) =>
      normalizeBeritaRow(b, idx, supabase, profileById)
    ),
    tableReady: true,
    error: null,
  };
}

export async function fetchBeritaById(supabase, idOrSlug) {
  if (!idOrSlug) {
    return { berita: null, tableReady: true, error: null };
  }

  const byUuid = isUuid(idOrSlug);
  const res = byUuid
    ? await supabase.from("berita").select("*").eq("id", idOrSlug).maybeSingle()
    : await supabase
        .from("berita")
        .select("*")
        .eq("slug", idOrSlug)
        .maybeSingle();

  if (res.error && isMissingTableError(res.error)) {
    return { berita: null, tableReady: false, error: null };
  }

  if (res.error || !res.data) {
    return { berita: null, tableReady: true, error: res.error ?? null };
  }

  const b = res.data;
  const profileById = new Map();
  if (b.author_id) {
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", b.author_id)
      .maybeSingle();
    if (authorProfile?.full_name) {
      profileById.set(authorProfile.id, authorProfile.full_name);
    }
  }

  return {
    berita: normalizeBeritaRow(b, 0, supabase, profileById),
    tableReady: true,
    error: null,
  };
}
