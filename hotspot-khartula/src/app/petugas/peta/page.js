import {
  ErrorBanner,
  LaporanTable,
  MapOverviewBox,
} from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchNormalizedDataset } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Peta Operasional Petugas | HotMap",
  description: "Peta pemantauan lokasi kejadian untuk petugas lapangan.",
};

export default async function PetugasPetaPage() {
  const { supabase } = await requireRole(["petugas", "admin"]);
  const dataset = await fetchNormalizedDataset(supabase, { limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Peta Operasional Petugas
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Pantau sebaran titik laporan kejadian beserta koordinat untuk orientasi tim lapangan.
        </p>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat data koordinat laporan dari database." />
      )}

      <MapOverviewBox
        laporan={dataset.laporanList}
        detailHrefPrefix="/petugas/laporan"
        title="Sebaran Titik Operasional"
        subtitle="Klik titik pada peta untuk membuka detail tindak lanjut laporan."
      />

      <LaporanTable
        laporan={dataset.laporanList}
        detailHrefPrefix="/petugas/laporan"
        emptyTitle="Belum ada koordinat laporan"
        emptyDescription="Belum ada laporan yang tersimpan di database."
      />
    </div>
  );
}
