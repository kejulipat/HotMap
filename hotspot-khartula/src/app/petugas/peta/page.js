import PetaLaporanExplorer from "@/components/map/PetaLaporanExplorer";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchNormalizedDataset } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Peta Operasional Petugas | HotMap",
  description:
    "Peta GIS interaktif lokasi kejadian dan penugasan untuk petugas lapangan.",
};

export default async function PetugasPetaPage() {
  const { supabase, user } = await requireRole(["petugas", "admin"]);
  const dataset = await fetchNormalizedDataset(supabase, { limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Peta Operasional Petugas
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Pantau titik kejadian di seluruh wilayah atau saring khusus laporan
          yang ditugaskan kepada Anda beserta tautan arah navigasi.
        </p>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat data koordinat laporan dari database." />
      )}

      <PetaLaporanExplorer
        laporanList={dataset.laporanList}
        wilayahList={dataset.wilayahList}
        detailHrefPrefix="/petugas/laporan"
        currentUserId={user.id}
        enablePetugasScope={true}
        title="Sebaran Titik Operasional Lapangan"
        subtitle="Gunakan tombol 'Ditugaskan ke Saya' untuk memfokuskan peta pada tugas aktif Anda."
      />
    </div>
  );
}
