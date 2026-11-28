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
  title: "Laporan Saya | HotMap",
  description: "Daftar laporan karhutla milik pengguna pelapor.",
};

export default async function PelaporLaporanListPage({ searchParams }) {
  const { supabase, user } = await requireRole(["pelapor", "admin"]);
  const resolvedParams = await searchParams;
  const activeStatus =
    typeof resolvedParams?.status === "string" ? resolvedParams.status : "semua";

  const [dataset, counts] = await Promise.all([
    fetchNormalizedDataset(supabase, {
      pelaporId: user.id,
      limit: 200,
    }),
    fetchExactStatusCounts(supabase, { pelaporId: user.id }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3325]">Laporan Saya</h1>
          <p className="mt-1 text-sm text-[#6B7263]">
            Seluruh riwayat laporan kejadian karhutla yang dikirim menggunakan
            akun Anda.
          </p>
        </div>

        <Link
          href="/pelapor/laporan/buat"
          className="self-start sm:self-auto inline-flex items-center justify-center rounded-lg bg-[#C85A28] hover:bg-[#B04B1D] px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors"
        >
          + Buat Laporan
        </Link>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat daftar laporan dari database." />
      )}

      <SummaryCardsGrid
        counts={counts}
        activeStatus={activeStatus}
        hrefBase="/pelapor/laporan"
      />

      <LaporanFilterTable
        laporanList={dataset.laporanList}
        wilayahList={dataset.wilayahList}
        detailHrefPrefix="/pelapor/laporan"
        initialStatus={activeStatus}
        emptyActionLabel="Buat Laporan Baru"
        emptyActionHref="/pelapor/laporan/buat"
      />
    </div>
  );
}
