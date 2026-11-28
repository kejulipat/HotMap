import Link from "next/link";
import CreateLaporanForm from "@/components/laporan/CreateLaporanForm";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { parseCoord } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buat Laporan Karhutla | HotMap",
  description:
    "Formulir pelaporan kejadian kebakaran hutan dan lahan dengan peta koordinat dan bukti foto.",
};

export default async function BuatLaporanPage() {
  const { supabase } = await requireRole(["pelapor", "admin"]);
  const { data: wilayahData, error } = await supabase
    .from("wilayah")
    .select("id, nama_wilayah, kabupaten_kota, center_lat, center_lng")
    .order("nama_wilayah", { ascending: true });

  const wilayahList = (wilayahData ?? []).map((w) => ({
    id: w.id,
    nama: w.nama_wilayah,
    kabupatenKota: w.kabupaten_kota ?? null,
    centerLat: parseCoord(w.center_lat),
    centerLng: parseCoord(w.center_lng),
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3325]">
            Buat Laporan Karhutla
          </h1>
          <p className="mt-1 text-sm text-[#6B7263]">
            Laporkan titik kebakaran hutan dan lahan beserta koordinat peta dan
            foto bukti lapangan.
          </p>
        </div>
        <Link
          href="/pelapor/laporan"
          className="text-xs font-semibold text-[#557029] hover:underline"
        >
          &larr; Kembali ke Laporan Saya
        </Link>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar wilayah dari database." />
      )}

      <CreateLaporanForm wilayahList={wilayahList} />
    </div>
  );
}
