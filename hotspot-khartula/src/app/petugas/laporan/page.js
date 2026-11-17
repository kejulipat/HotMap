import Link from "next/link";
import {
  ErrorBanner,
  LaporanTable,
  SummaryCardsGrid,
} from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  computeStatusCounts,
  fetchNormalizedDataset,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Laporan Petugas | HotMap",
  description: "Daftar laporan karhutla untuk penanganan petugas.",
};

export default async function PetugasLaporanListPage({ searchParams }) {
  const { supabase } = await requireRole(["petugas", "admin"]);
  const resolvedParams = await searchParams;
  const activeStatus =
    typeof resolvedParams?.status === "string" ? resolvedParams.status : "semua";

  const dataset = await fetchNormalizedDataset(supabase, { limit: 150 });
  const counts = computeStatusCounts(dataset.laporanList);
  const filteredLaporan =
    activeStatus === "semua"
      ? dataset.laporanList
      : dataset.laporanList.filter((item) => item.statusKey === activeStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Daftar Laporan Operasional
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Daftar kejadian karhutla beserta status dan koordinat lokasi untuk tindak lanjut petugas.
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

      <LaporanTable
        laporan={filteredLaporan}
        detailHrefPrefix="/petugas/laporan"
        emptyTitle="Belum ada laporan pada filter ini"
        emptyDescription="Belum ada laporan kejadian karhutla yang sesuai dengan status terpilih."
        actionLabel={activeStatus !== "semua" ? "Tampilkan Semua" : null}
        actionHref={activeStatus !== "semua" ? "/petugas/laporan" : null}
      />
    </div>
  );
}
