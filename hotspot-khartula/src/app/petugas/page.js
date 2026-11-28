import Link from "next/link";
import {
  ErrorBanner,
  LaporanTable,
  SummaryCardsGrid,
} from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  fetchExactStatusCounts,
  fetchNormalizedDataset,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Petugas | HotMap",
  description: "Dashboard operasional petugas penanganan karhutla.",
};

export default async function PetugasDashboardPage() {
  const { supabase, user, profile } = await requireRole(["petugas", "admin"]);

  const [dataset, myCounts, globalCounts] = await Promise.all([
    fetchNormalizedDataset(supabase, { limit: 150 }),
    fetchExactStatusCounts(supabase, { petugasId: user.id }),
    fetchExactStatusCounts(supabase),
  ]);

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  const myTasks = dataset.laporanList.filter(
    (item) => item.petugasId === user.id
  );
  const myActiveCount =
    (myCounts.terverifikasi ?? 0) + (myCounts.ditangani ?? 0);
  const myCompletedCount = myCounts.selesai ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3325]">
            Portal Operasional Petugas
          </h1>
          <p className="mt-1 text-sm text-[#6B7263]">
            Selamat bertugas, {displayName}. Pantau tugas yang ditugaskan kepada
            Anda dan perbarui progres penanganan lapangan.
          </p>
        </div>

        <Link
          href="/petugas/peta"
          className="self-start sm:self-auto inline-flex items-center justify-center rounded-lg bg-[#557029] hover:bg-[#465D21] px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors"
        >
          Buka Peta Operasional
        </Link>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Gagal memuat data laporan operasional dari database." />
      )}

      {/* Ringkasan Tugas Milik Petugas */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#557029] bg-[#557029] p-5 text-white shadow-2xs">
          <span className="text-xs font-semibold text-white/80">
            Total Tugas Saya
          </span>
          <p className="mt-1 text-3xl font-bold">{myCounts.semua ?? 0}</p>
          <span className="mt-1 inline-block text-xs text-white/80">
            Seluruh laporan yang ditugaskan ke akun Anda
          </span>
        </div>

        <div className="rounded-xl border border-[#F3C8B8] bg-white p-5">
          <span className="text-xs font-semibold text-[#B83E1B]">
            Tugas Aktif (Perlu Ditangani)
          </span>
          <p className="mt-1 text-3xl font-bold text-[#2C3325]">
            {myActiveCount}
          </p>
          <span className="mt-1 inline-block text-xs text-[#6B7263]">
            Status terverifikasi &amp; sedang ditangani
          </span>
        </div>

        <div className="rounded-xl border border-[#C4E2CE] bg-white p-5">
          <span className="text-xs font-semibold text-[#1F6B41]">
            Tugas Selesai
          </span>
          <p className="mt-1 text-3xl font-bold text-[#2C3325]">
            {myCompletedCount}
          </p>
          <span className="mt-1 inline-block text-xs text-[#6B7263]">
            Penanganan lapangan telah ditutup selesai
          </span>
        </div>
      </section>

      {/* Daftar Tugas Terbaru Saya */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2C3325]">
              Tugas Penanganan Terbaru Saya
            </h2>
            <p className="text-xs text-[#6B7263]">
              Klik detail untuk melihat koordinat lokasi dan memperbarui progres
              penanganan.
            </p>
          </div>
          <Link
            href="/petugas/laporan"
            className="text-xs font-semibold text-[#557029] hover:underline"
          >
            Semua tugas &rarr;
          </Link>
        </div>

        <LaporanTable
          laporan={myTasks.slice(0, 6)}
          detailHrefPrefix="/petugas/laporan"
          emptyTitle="Belum ada tugas ditugaskan ke akun Anda"
          emptyDescription="Laporan yang ditugaskan oleh Admin kepada Anda akan muncul di sini beserta koordinat lokasinya."
          actionLabel="Lihat Peta Operasional"
          actionHref="/petugas/peta"
        />
      </section>

      {/* Ringkasan Situasi Global */}
      <section className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-[#2C3325]">
          Ringkasan Situasi Seluruh Wilayah
        </h2>
        <SummaryCardsGrid counts={globalCounts} hrefBase="/petugas/laporan" />
      </section>
    </div>
  );
}
