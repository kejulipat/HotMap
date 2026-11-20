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
  title: "Dashboard Pelapor | HotMap",
  description: "Ringkasan laporan kejadian karhutla yang dikirim oleh pelapor.",
};

export default async function PelaporDashboardPage() {
  const { supabase, user, profile } = await requireRole(["pelapor", "admin"]);
  const dataset = await fetchNormalizedDataset(supabase, {
    pelaporId: user.id,
    limit: 50,
  });
  const counts = computeStatusCounts(dataset.laporanList);
  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Halo, {displayName}
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Pantau status laporan kebakaran hutan dan lahan yang telah Anda kirimkan.
          </p>
        </div>

        <Link
          href="/pelapor/laporan/buat"
          className="self-start sm:self-auto inline-flex items-center justify-center rounded-lg bg-[#C85A28] hover:bg-[#B04B1D] px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors"
        >
          + Buat Laporan Karhutla
        </Link>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat ringkasan laporan dari database." />
      )}

      <SummaryCardsGrid counts={counts} hrefBase="/pelapor/laporan" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#12241B]">
            Laporan Terbaru Saya
          </h2>
          <Link
            href="/pelapor/laporan"
            className="text-xs font-semibold text-[#155E42] hover:underline"
          >
            Lihat semua &rarr;
          </Link>
        </div>

        <LaporanTable
          laporan={dataset.laporanList.slice(0, 5)}
          detailHrefPrefix="/pelapor/laporan"
          emptyTitle="Anda belum memiliki laporan"
          emptyDescription="Gunakan formulir pelaporan karhutla untuk melaporkan titik kejadian di sekitar Anda."
          actionLabel="Buat Laporan Sekarang"
          actionHref="/pelapor/laporan/buat"
        />
      </section>
    </div>
  );
}
