import Link from "next/link";
import {
  ErrorBanner,
  LaporanTable,
  StatusBadge,
  SummaryCardsGrid,
} from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  fetchExactStatusCounts,
  fetchNormalizedDataset,
  formatDate,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Pelapor | HotMap",
  description: "Ringkasan laporan kejadian karhutla yang dikirim oleh pelapor.",
};

export default async function PelaporDashboardPage() {
  const { supabase, user, profile } = await requireRole(["pelapor", "admin"]);
  const [dataset, counts] = await Promise.all([
    fetchNormalizedDataset(supabase, {
      pelaporId: user.id,
      limit: 50,
    }),
    fetchExactStatusCounts(supabase, { pelaporId: user.id }),
  ]);

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;
  const activeReports = dataset.laporanList.filter((item) =>
    ["menunggu_verifikasi", "terverifikasi", "ditangani"].includes(item.statusKey)
  );
  const latestWithFollowUp = dataset.laporanList.find(
    (item) => item.catatanVerifikasi || item.petugasId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Halo, {displayName}
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Pantau status laporan kebakaran hutan dan lahan serta perkembangan
            tindak lanjut petugas.
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

      {/* Ringkasan Tindak Lanjut */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#E3E8E1] bg-white p-5 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5B6B61]">
            Status Pemantauan Anda
          </span>
          <p className="text-sm text-[#4E5E55]">
            Anda memiliki{" "}
            <strong className="text-[#14231B]">{activeReports.length}</strong>{" "}
            laporan yang masih dalam proses verifikasi atau penanganan, dan{" "}
            <strong className="text-[#1F6B41]">{counts.selesai ?? 0}</strong>{" "}
            laporan telah selesai ditangani.
          </p>
        </div>

        <div className="rounded-xl border border-[#E3E8E1] bg-white p-5 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5B6B61]">
            Tindak Lanjut Terakhir
          </span>
          {latestWithFollowUp ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/pelapor/laporan/${latestWithFollowUp.id}`}
                  className="font-bold text-[#14231B] hover:text-[#155E42] truncate"
                >
                  {latestWithFollowUp.judul}
                </Link>
                <StatusBadge statusKey={latestWithFollowUp.statusKey} />
              </div>
              <p className="text-[#5F6F66]">
                Petugas: <strong>{latestWithFollowUp.petugas}</strong> &bull;{" "}
                {formatDate(latestWithFollowUp.tanggal, "short")}
              </p>
              {latestWithFollowUp.catatanVerifikasi && (
                <p className="text-[#2B3B32] line-clamp-2">
                  &ldquo;{latestWithFollowUp.catatanVerifikasi}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#6B7A71]">
              Belum ada pembaruan verifikasi atau penugasan petugas pada laporan
              Anda.
            </p>
          )}
        </div>
      </section>

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
