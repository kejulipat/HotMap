import Link from "next/link";
import { requireRole } from "@/lib/auth";

// Selalu ambil data terbaru (tanpa cache) saat halaman dibuka.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tes Database (Admin) | HotMap",
  description: "Halaman diagnostik koneksi Supabase khusus administrator.",
};

function DataTable({ title, result }) {
  const { data, error } = result;
  const rows = data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section className="mb-10 rounded-xl border border-[#E3E8E1] bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[#14231B]">{title}</h2>
        {error ? (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            Gagal
          </span>
        ) : (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            {rows.length} baris
          </span>
        )}
      </div>

      {error && (
        <pre className="overflow-x-auto rounded border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {!error && rows.length === 0 && (
        <p className="text-sm text-[#606F67]">
          Tabel kosong, atau data tidak terlihat karena kebijakan RLS.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-[#E3E8E1]">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#EEF2EC] text-[#4E5E55]">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i} className="border-t border-[#ECEFE9]">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 align-top text-[#14231B]">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatCell(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function TestDbPage() {
  const { supabase } = await requireRole(["admin"]);

  const [
    profiles,
    wilayah,
    laporan,
    penangananLog,
    berita,
    laporanFoto,
    penugasanLaporan,
    riwayatStatus,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, wilayah_id, created_at")
      .limit(50),
    supabase
      .from("wilayah")
      .select("id, nama_wilayah, kabupaten_kota, center_lat, center_lng, created_at")
      .limit(50),
    supabase
      .from("laporan_karhutla")
      .select(
        "id, judul, status, wilayah_id, latitude, longitude, pelapor_id, petugas_id, created_at"
      )
      .limit(50),
    supabase
      .from("penanganan_log")
      .select("id, laporan_id, petugas_id, status_update, created_at")
      .limit(50),
    supabase
      .from("berita")
      .select("id, judul, slug, kategori, status, published_at, created_at")
      .limit(50),
    supabase
      .from("laporan_foto")
      .select("id, laporan_id, jenis_foto, mime_type, file_size, created_at")
      .limit(50),
    supabase
      .from("penugasan_laporan")
      .select("id, laporan_id, petugas_id, status_penugasan, assigned_at")
      .limit(50),
    supabase
      .from("laporan_riwayat_status")
      .select("id, laporan_id, status_sebelumnya, status_baru, created_at")
      .limit(50),
  ]);

  return (
    <main className="min-h-screen bg-[#F6F7F3] text-[#14231B] px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="inline-block rounded bg-[#FDF2EA] px-2.5 py-0.5 text-[11px] font-bold text-[#9B4017]">
              Khusus Admin
            </span>
            <h1 className="mt-1 text-2xl font-bold text-[#12241B]">
              Diagnostik Koneksi Database
            </h1>
            <p className="text-xs text-[#606F67]">
              Supabase URL:{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(belum diset)"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/pengaturan"
              className="rounded-lg border border-[#DCE2DA] bg-white px-4 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC]"
            >
              &larr; Pengaturan Admin
            </Link>
            <Link
              href="/admin"
              className="rounded-lg bg-[#155E42] px-4 py-2 text-xs font-semibold text-white hover:bg-[#114B35]"
            >
              Dashboard Admin
            </Link>
          </div>
        </div>

        <DataTable title="profiles" result={profiles} />
        <DataTable title="wilayah" result={wilayah} />
        <DataTable title="laporan_karhutla" result={laporan} />
        <DataTable title="penanganan_log" result={penangananLog} />
        <DataTable title="berita" result={berita} />
        <DataTable title="laporan_foto" result={laporanFoto} />
        <DataTable title="penugasan_laporan" result={penugasanLaporan} />
        <DataTable title="laporan_riwayat_status" result={riwayatStatus} />
      </div>
    </main>
  );
}
