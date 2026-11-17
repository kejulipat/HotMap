import { createClient } from "@/lib/supabase/server";
import LandingExplorer from "@/components/landing/LandingExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SIPKARHUTLA | Pemantauan Kebakaran Hutan & Lahan",
  description:
    "Pantau titik karhutla di seluruh wilayah, dari laporan warga sampai penanganan selesai.",
};

const JAKARTA_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function normalizeStatusKey(rawStatus) {
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

function normalizeDate(rawDate) {
  if (!rawDate) return "";
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  return Number.isNaN(d.getTime())
    ? str.slice(0, 10)
    : JAKARTA_DATE_FORMAT.format(d);
}

function parseCoord(val) {
  if (val === null || val === undefined || typeof val === "boolean") {
    return null;
  }
  if (typeof val === "string" && val.trim() === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function normalizeLuas(row) {
  const val = row.estimasi_luas ?? row.luas ?? null;
  if (val === null || val === undefined || val === "") return "-";
  const str = String(val).trim();
  return str.toLowerCase().includes("ha") ? str : `${str} ha`;
}

export default async function LandingPage() {
  const supabase = await createClient();

  const [wilayahRes, laporanRes, beritaRes] = await Promise.all([
    supabase.from("wilayah").select("*"),
    supabase
      .from("laporan_karhutla")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("berita")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const rawWilayah = wilayahRes.data ?? [];
  const rawLaporan = laporanRes.data ?? [];
  const rawBerita = beritaRes.data ?? [];

  const profileIds = Array.from(
    new Set(
      [
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
            .select("*")
            .in("id", profileIds)
        ).data ?? []
      : [];

  const wilayahById = new Map();
  for (const w of rawWilayah) {
    const nama = w.nama_wilayah ?? w.nama ?? "";
    if (w.id && nama) wilayahById.set(w.id, nama);
  }

  const profileById = new Map();
  for (const p of rawProfiles) {
    const nama = p.full_name ?? p.nama;
    if (p.id && nama) profileById.set(p.id, nama);
  }

  const normalizedWilayah = rawWilayah.map((w, idx) => ({
    id: w.id ?? `w-${idx}`,
    nama: w.nama_wilayah ?? w.nama ?? `Wilayah ${idx + 1}`,
  }));

  const normalizedLaporan = rawLaporan.map((row, idx) => {
    const wilayahNama =
      row.nama_wilayah ?? wilayahById.get(row.wilayah_id) ?? "Indonesia";
    const petugasNama =
      row.nama_petugas ??
      profileById.get(row.petugas_id) ??
      "Belum ditugaskan";

    return {
      id: row.id ?? `lap-${idx + 1}`,
      judul: row.judul ?? row.lokasi ?? `Laporan Karhutla #${idx + 1}`,
      lokasiSingkat: row.lokasi ?? wilayahNama,
      wilayah: wilayahNama,
      tanggal: normalizeDate(row.tanggal ?? row.created_at),
      statusKey: normalizeStatusKey(row.status),
      estimasiLuas: normalizeLuas(row),
      latitude: parseCoord(row.latitude),
      longitude: parseCoord(row.longitude),
      petugas: petugasNama,
    };
  });

  const normalizedBerita = rawBerita.map((b, idx) => ({
    id: b.id ?? `ber-${idx + 1}`,
    slug: b.slug ?? b.id ?? `berita-${idx + 1}`,
    judul: b.judul ?? `Berita #${idx + 1}`,
    tanggal: normalizeDate(b.published_at ?? b.created_at),
    penulis: b.penulis ?? profileById.get(b.author_id) ?? "Admin",
    gambarUrl: b.gambar_url ?? null,
  }));

  return (
    <LandingExplorer
      initialLaporan={normalizedLaporan}
      wilayahList={normalizedWilayah}
      beritaList={normalizedBerita}
      hasQueryError={Boolean(
        wilayahRes.error || laporanRes.error || beritaRes.error
      )}
    />
  );
}
