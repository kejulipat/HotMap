/**
 * State machine alur status laporan karhutla & metadata operasional HotMap.
 * Digunakan bersama oleh Server Actions (validasi ketat) dan UI (label & opsi).
 */

export const ROLE_LABELS = {
  admin: "Admin",
  petugas: "Petugas",
  pelapor: "Pelapor",
};

export function normalizeRole(rawRole) {
  const val = rawRole ? String(rawRole).toLowerCase().trim() : "pelapor";
  return ROLE_LABELS[val] ? val : "pelapor";
}

export const REPORT_STATUSES = [
  "menunggu_verifikasi",
  "terverifikasi",
  "ditangani",
  "selesai",
  "ditolak",
];

export const JENIS_KEJADIAN_OPTIONS = [
  { value: "kebakaran_lahan", label: "Kebakaran Lahan" },
  { value: "kebakaran_hutan", label: "Kebakaran Hutan" },
  { value: "kebakaran_gambut", label: "Kebakaran Lahan Gambut" },
  { value: "asap_pekat", label: "Asap Pekat / Titik Api Awal" },
  { value: "lainnya", label: "Lainnya" },
];

export const ALLOWED_JENIS_KEJADIAN = JENIS_KEJADIAN_OPTIONS.map((o) => o.value);

export const TINGKAT_KEPARAHAN_OPTIONS = [
  {
    value: "rendah",
    label: "Rendah",
    badgeBg: "bg-[#EAF5EE]",
    badgeText: "text-[#1F6B41]",
  },
  {
    value: "sedang",
    label: "Sedang",
    badgeBg: "bg-[#FEF5E7]",
    badgeText: "text-[#B5651D]",
  },
  {
    value: "tinggi",
    label: "Tinggi",
    badgeBg: "bg-[#FDEEE9]",
    badgeText: "text-[#B83E1B]",
  },
  {
    value: "kritis",
    label: "Kritis (Prioritas Utama)",
    badgeBg: "bg-[#FBE2E2]",
    badgeText: "text-[#991B1B]",
  },
];

export const ALLOWED_KEPARAHAN = TINGKAT_KEPARAHAN_OPTIONS.map((o) => o.value);

export const KEPARAHAN_META = Object.fromEntries(
  TINGKAT_KEPARAHAN_OPTIONS.map((opt) => [opt.value, opt])
);

export const JENIS_KEJADIAN_LABELS = Object.fromEntries(
  JENIS_KEJADIAN_OPTIONS.map((opt) => [opt.value, opt.label])
);

/**
 * Matriks transisi status yang diizinkan untuk Admin.
 */
export const ADMIN_ALLOWED_TRANSITIONS = {
  menunggu_verifikasi: ["terverifikasi", "ditolak"],
  terverifikasi: ["ditangani", "ditolak", "menunggu_verifikasi"],
  ditangani: ["selesai", "terverifikasi"],
  selesai: ["ditangani"],
  ditolak: ["menunggu_verifikasi", "terverifikasi"],
};

/**
 * Matriks transisi status yang diizinkan untuk Petugas (hanya pada tugas miliknya).
 * Petugas juga dapat mengirim log progres tetap pada status `ditangani`.
 */
export const PETUGAS_ALLOWED_TRANSITIONS = {
  terverifikasi: ["ditangani"],
  ditangani: ["ditangani", "selesai"],
};

export function isValidStatusTransition(role, currentStatus, nextStatus) {
  if (!REPORT_STATUSES.includes(currentStatus) || !REPORT_STATUSES.includes(nextStatus)) {
    return false;
  }

  if (role === "admin") {
    if (currentStatus === nextStatus) return true;
    const allowed = ADMIN_ALLOWED_TRANSITIONS[currentStatus] ?? [];
    return allowed.includes(nextStatus);
  }

  if (role === "petugas") {
    const allowed = PETUGAS_ALLOWED_TRANSITIONS[currentStatus] ?? [];
    return allowed.includes(nextStatus);
  }

  return false;
}

export function getJenisKejadianLabel(value) {
  return JENIS_KEJADIAN_LABELS[value] ?? (value ? String(value).replace(/_/g, " ") : "-");
}

export function getKeparahanMeta(value) {
  return KEPARAHAN_META[value] ?? null;
}
