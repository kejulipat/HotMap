import PetaLaporanExplorer from "@/components/map/PetaLaporanExplorer";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  fetchLaporanFotosByIds,
  fetchNormalizedDataset,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring Peta | Admin HotMap",
  description:
    "Peta GIS interaktif monitoring seluruh kejadian karhutla untuk admin.",
};

export default async function AdminPetaPage() {
  const { supabase } = await requireRole(["admin"]);
  const dataset = await fetchNormalizedDataset(supabase, { limit: 200 });
  const fotoByLaporanId = await fetchLaporanFotosByIds(
    supabase,
    dataset.laporanList.map((item) => item.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C3325]">
          Monitoring Peta Karhutla
        </h1>
        <p className="mt-1 text-sm text-[#6B7263]">
          Pemantauan menyeluruh koordinat laporan masyarakat di seluruh wilayah
          beserta akses langsung ke verifikasi dan penugasan petugas.
        </p>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat data koordinat laporan dari database." />
      )}

      <PetaLaporanExplorer
        laporanList={dataset.laporanList}
        wilayahList={dataset.wilayahList}
        fotoByLaporanId={fotoByLaporanId}
        isAuthenticated={true}
        detailHrefPrefix="/admin/laporan"
        title="Sebaran Laporan Seluruh Wilayah"
        subtitle="Klik titik pada peta atau baris pada daftar untuk fokus lokasi dan membuka panel verifikasi/penugasan."
      />
    </div>
  );
}
