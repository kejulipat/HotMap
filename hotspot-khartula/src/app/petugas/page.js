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
  title: "Dashboard Petugas | HotMap",
  description: "Dashboard operasional petugas penanganan karhutla.",
};

export default async function PetugasDashboardPage() {
  const { supabase, user, profile } = await requireRole(["petugas", "admin"]);
  const dataset = await fetchNormalizedDataset(supabase, { limit: 100 });
  const counts = computeStatusCounts(dataset.laporanList);
  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Portal Operasional Petugas
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Selamat bertugas, {displayName}. Pantau laporan aktif dan siapkan tindak lanjut lapangan.
          </p>
        </div>

        <Link
          href="/petugas/peta"
          className="self-start sm:self-auto inline-flex items-center justify-center rounded-lg bg-[#155E42] hover:bg-[#114B35] px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors"
        >
          Buka Peta Operasional
        </Link>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat data laporan operasional dari database." />
      )}

      <SummaryCardsGrid counts={counts} hrefBase="/petugas/laporan" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#12241B]">
            Laporan Operasional Terbaru
          </h2>
          <Link
            href="/petugas/laporan"
            className="text-xs font-semibold text-[#155E42] hover:underline"
          >
            Lihat semua &rarr;
          </Link>
        </div>

        <LaporanTable
          laporan={dataset.laporanList.slice(0, 8)}
          detailHrefPrefix="/petugas/laporan"
          emptyTitle="Belum ada laporan masuk"
          emptyDescription="Belum ada laporan kejadian karhutla yang tersedia untuk ditangani."
        />
      </section>
    </div>
  );
}
