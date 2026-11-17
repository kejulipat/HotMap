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

function isMissingTableError(error) {
  return error?.code === "PGRST205";
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
    petugas: petugasNama,
    catatanVerifikasi: row.catatan_verifikasi ?? "",
  };
}

export async function fetchNormalizedDataset(
  supabase,
  { pelaporId = null, limit = 100, beritaLimit = 3 } = {}
) {
  let laporanQuery = supabase
    .from("laporan_karhutla")
    .select(
      "id, judul, deskripsi, wilayah_id, created_at, updated_at, status, latitude, longitude, pelapor_id, catatan_verifikasi"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pelaporId) {
    laporanQuery = laporanQuery.eq("pelapor_id", pelaporId);
  }

  const [wilayahRes, laporanRes, beritaRes] = await Promise.all([
    supabase
      .from("wilayah")
      .select("id, nama_wilayah, created_at")
      .order("nama_wilayah", { ascending: true }),
    laporanQuery,
    supabase
      .from("berita")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(beritaLimit),
  ]);

  const rawWilayah = wilayahRes.data ?? [];
  const rawLaporan = laporanRes.data ?? [];
  const beritaTableReady = !isMissingTableError(beritaRes.error);
  const rawBerita = beritaTableReady ? beritaRes.data ?? [] : [];

  const profileIds = Array.from(
    new Set(
      [
        ...rawLaporan.map((row) => row.pelapor_id),
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
    createdAt: w.created_at ?? null,
  }));

  const laporanList = rawLaporan.map((row, idx) =>
    normalizeLaporanRow(row, idx, wilayahById, profileById)
  );

  const beritaList = rawBerita.map((b, idx) => ({
    id: String(b.id ?? b.slug ?? `berita-${idx + 1}`),
    slug: b.slug ?? String(b.id ?? `berita-${idx + 1}`),
    judul: b.judul ?? `Berita #${idx + 1}`,
    ringkasan: b.ringkasan ?? b.isi ?? "",
    isi: b.isi ?? "",
    tanggal: normalizeDate(b.published_at ?? b.created_at),
    penulis: b.penulis ?? profileById.get(b.author_id) ?? "Admin",
    gambarUrl: b.gambar_url ?? null,
  }));

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
  if (!id) return { laporan: null, error: null };

  const { data: row, error } = await supabase
    .from("laporan_karhutla")
    .select(
      "id, judul, deskripsi, wilayah_id, created_at, updated_at, status, latitude, longitude, pelapor_id, catatan_verifikasi"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return { laporan: null, error };
  }

  const [wilayahRes, profileRes] = await Promise.all([
    row.wilayah_id
      ? supabase
          .from("wilayah")
          .select("id, nama_wilayah")
          .eq("id", row.wilayah_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    row.pelapor_id
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", row.pelapor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const wilayahById = new Map();
  if (wilayahRes.data?.id && wilayahRes.data?.nama_wilayah) {
    wilayahById.set(wilayahRes.data.id, wilayahRes.data.nama_wilayah);
  }

  const profileById = new Map();
  if (profileRes.data?.id && profileRes.data?.full_name) {
    profileById.set(profileRes.data.id, profileRes.data.full_name);
  }

  return {
    laporan: normalizeLaporanRow(row, 0, wilayahById, profileById),
    error: null,
  };
}

export async function fetchBeritaList(supabase, limit = 50) {
  const { data, error } = await supabase
    .from("berita")
    .select("*")
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
  return {
    beritaList: rows.map((b, idx) => ({
      id: String(b.id ?? b.slug ?? `berita-${idx + 1}`),
      slug: b.slug ?? String(b.id ?? `berita-${idx + 1}`),
      judul: b.judul ?? `Berita #${idx + 1}`,
      ringkasan: b.ringkasan ?? b.isi ?? "",
      isi: b.isi ?? "",
      tanggal: normalizeDate(b.published_at ?? b.created_at),
      penulis: b.penulis ?? "Admin",
      gambarUrl: b.gambar_url ?? null,
    })),
    tableReady: true,
    error: null,
  };
}

export async function fetchBeritaById(supabase, idOrSlug) {
  if (!idOrSlug) {
    return { berita: null, tableReady: true, error: null };
  }

  const isUuidOrInt =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    ) || /^\d+$/.test(idOrSlug);

  let res = isUuidOrInt
    ? await supabase.from("berita").select("*").eq("id", idOrSlug).maybeSingle()
    : await supabase
        .from("berita")
        .select("*")
        .eq("slug", idOrSlug)
        .maybeSingle();

  if (res.error && isMissingTableError(res.error)) {
    return { berita: null, tableReady: false, error: null };
  }

  // Fallback jika ID yang dikirim bukan UUID/angka (misal string id non-standar)
  if (!res.data && !res.error && !isUuidOrInt) {
    const byId = await supabase
      .from("berita")
      .select("*")
      .eq("id", idOrSlug)
      .maybeSingle();
    if (!byId.error && byId.data) {
      res = byId;
    }
  }

  if (res.error || !res.data) {
    return { berita: null, tableReady: true, error: res.error ?? null };
  }

  const b = res.data;
  return {
    berita: {
      id: String(b.id ?? b.slug ?? idOrSlug),
      slug: b.slug ?? String(b.id ?? idOrSlug),
      judul: b.judul ?? "Detail Berita",
      isi: b.isi ?? b.konten ?? b.deskripsi ?? "",
      tanggal: normalizeDate(b.published_at ?? b.created_at),
      penulis: b.penulis ?? "Admin",
      gambarUrl: b.gambar_url ?? null,
    },
    tableReady: true,
    error: null,
  };
}
