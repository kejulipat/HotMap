import {
  ErrorBanner,
  LaporanTable,
  MapOverviewBox,
} from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchNormalizedDataset } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring Peta | Admin HotMap",
  description: "Peta monitoring seluruh kejadian karhutla untuk admin.",
};

export default async function AdminPetaPage() {
  const { supabase } = await requireRole(["admin"]);
  const dataset = await fetchNormalizedDataset(supabase, { limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Monitoring Peta Karhutla
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Pemantauan menyeluruh koordinat laporan masyarakat di seluruh wilayah.
        </p>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat data koordinat laporan dari database." />
      )}

      <MapOverviewBox
        laporan={dataset.laporanList}
        detailHrefPrefix="/admin/laporan"
        title="Sebaran Laporan Seluruh Wilayah"
        subtitle="Pilih titik laporan untuk membuka detail dan verifikasi."
      />

      <LaporanTable
        laporan={dataset.laporanList}
        detailHrefPrefix="/admin/laporan"
        emptyTitle="Belum ada data koordinat"
        emptyDescription="Belum ada laporan karhutla yang masuk ke sistem."
      />
    </div>
  );
}
