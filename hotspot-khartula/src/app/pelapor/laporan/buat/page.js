import Link from "next/link";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buat Laporan Karhutla | HotMap",
  description: "Formulir pelaporan kejadian kebakaran hutan dan lahan.",
};

export default async function BuatLaporanPage() {
  const { supabase } = await requireRole(["pelapor", "admin"]);
  const { data: wilayahData, error } = await supabase
    .from("wilayah")
    .select("id, nama_wilayah")
    .order("nama_wilayah", { ascending: true });

  const wilayahList = wilayahData ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Buat Laporan Karhutla
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Fondasi formulir pelaporan warga terhubung ke daftar wilayah Supabase.
          </p>
        </div>
        <Link
          href="/pelapor/laporan"
          className="text-xs font-semibold text-[#155E42] hover:underline"
        >
          &larr; Kembali ke Laporan Saya
        </Link>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar wilayah dari database." />
      )}

      <div
        role="status"
        className="rounded-xl border border-[#C5DCF8] bg-[#EBF4FF] px-4 py-3 text-xs sm:text-sm text-[#1E62B5]"
      >
        <strong>Kesiapan Fase 2:</strong> Pengiriman formulir laporan, pemilih koordinat peta Leaflet, dan unggah foto bukti ke Supabase Storage akan diaktifkan pada <strong>Fase 2 (Web GIS &amp; Pelaporan)</strong>.
      </div>

      <div className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="judul-laporan"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Judul Kejadian
            </label>
            <input
              id="judul-laporan"
              type="text"
              disabled
              placeholder="Contoh: Kebakaran lahan gambut dekat akses desa"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#F6F7F3] px-3.5 py-2.5 text-sm text-[#606F67]"
            />
          </div>

          <div>
            <label
              htmlFor="wilayah-laporan"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Wilayah ({wilayahList.length} tersedia)
            </label>
            <select
              id="wilayah-laporan"
              disabled
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#F6F7F3] px-3.5 py-2.5 text-sm text-[#606F67]"
            >
              <option value="">
                {wilayahList.length > 0
                  ? "Pilih wilayah (diaktifkan di Fase 2)"
                  : "Data wilayah belum tersedia"}
              </option>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama_wilayah}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lat-laporan"
                className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
              >
                Latitude
              </label>
              <input
                id="lat-laporan"
                type="text"
                disabled
                placeholder="Dari peta Fase 2"
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#F6F7F3] px-3 py-2.5 text-sm text-[#606F67]"
              />
            </div>
            <div>
              <label
                htmlFor="lng-laporan"
                className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
              >
                Longitude
              </label>
              <input
                id="lng-laporan"
                type="text"
                disabled
                placeholder="Dari peta Fase 2"
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#F6F7F3] px-3 py-2.5 text-sm text-[#606F67]"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="deskripsi-laporan"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Deskripsi &amp; Kondisi Lapangan
            </label>
            <textarea
              id="deskripsi-laporan"
              rows={4}
              disabled
              placeholder="Deskripsikan perkiraan kondisi api, akses jalan, dan situasi sekitar..."
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#F6F7F3] px-3.5 py-2.5 text-sm text-[#606F67]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#ECEFE9]">
          <Link
            href="/pelapor/laporan"
            className="rounded-lg border border-[#DCE2DA] px-4 py-2 text-xs font-semibold text-[#4E5E55] hover:bg-[#F6F7F3]"
          >
            Lihat Laporan Saya
          </Link>
          <span className="rounded-lg bg-[#EEF2EC] px-4 py-2 text-xs font-semibold text-[#5B6B61]">
            Submit &amp; Map Picker Aktif di Fase 2
          </span>
        </div>
      </div>
    </div>
  );
}
