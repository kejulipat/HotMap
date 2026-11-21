import Link from "next/link";
import LaporanFilterTable from "@/components/laporan/LaporanFilterTable";
import { ErrorBanner, SummaryCardsGrid } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  fetchExactStatusCounts,
  fetchNormalizedDataset,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Laporan Petugas | HotMap",
  description: "Daftar laporan karhutla dan tugas aktif untuk petugas.",
};

export default async function PetugasLaporanListPage({ searchParams }) {
  const { supabase, user } = await requireRole(["petugas", "admin"]);
  const resolvedParams = await searchParams;
  const activeStatus =
    typeof resolvedParams?.status === "string" ? resolvedParams.status : "semua";

  const [dataset, counts] = await Promise.all([
    fetchNormalizedDataset(supabase, { limit: 200 }),
    fetchExactStatusCounts(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Daftar Laporan Operasional
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Saring tugas yang ditugaskan kepada Anda atau pantau laporan lintas
            wilayah.
          </p>
        </div>

        <Link
          href="/petugas/peta"
          className="self-start sm:self-auto rounded-lg border border-[#DCE2DA] bg-white px-4 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
        >
          Lihat di Peta &rarr;
        </Link>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat daftar laporan dari database." />
      )}

      <SummaryCardsGrid
        counts={counts}
        activeStatus={activeStatus}
        hrefBase="/petugas/laporan"
      />

      <LaporanFilterTable
        laporanList={dataset.laporanList}
        wilayahList={dataset.wilayahList}
        detailHrefPrefix="/petugas/laporan"
        initialStatus={activeStatus}
        currentUserId={user.id}
        enablePetugasScope={true}
        initialScope={activeStatus === "semua" ? "tugas_saya" : "semua"}
      />
    </div>
  );
}
