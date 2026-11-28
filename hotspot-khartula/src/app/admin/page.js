import Link from "next/link";
import {
  ErrorBanner,
  LaporanTable,
  SummaryCardsGrid,
} from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  fetchAdminAnalytics,
  fetchNormalizedDataset,
  formatDate,
  normalizeDate,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Admin | HotMap",
  description:
    "Pusat kontrol operasional, analitik laporan, penugasan, pengguna, dan wilayah HotMap.",
};

function buildWilayahDistribution(laporanList = []) {
  const map = new Map();
  for (const item of laporanList) {
    const key = item.wilayah || "Lainnya";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([nama, total]) => ({ nama, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

function buildRecent14DayTrend(laporanList = []) {
  const countsByDay = new Map();
  for (const item of laporanList) {
    const day = item.tanggal;
    if (day) countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = normalizeDate(d.toISOString());
    days.push({
      date: iso,
      label: iso.slice(5),
      count: countsByDay.get(iso) ?? 0,
    });
  }
  return days;
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(["admin"]);

  const [dataset, analytics] = await Promise.all([
    fetchNormalizedDataset(supabase, { limit: 200 }),
    fetchAdminAnalytics(supabase),
  ]);

  const counts = analytics.exactCounts;
  const belumDitangani =
    (counts.menunggu_verifikasi ?? 0) + (counts.terverifikasi ?? 0);
  const wilayahDist = buildWilayahDistribution(dataset.laporanList);
  const maxWilayahCount = Math.max(1, ...wilayahDist.map((w) => w.total));

  const trend14Days = buildRecent14DayTrend(dataset.laporanList);
  const maxTrendCount = Math.max(1, ...trend14Days.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3325]">
            Dashboard Administrasi HotMap
          </h1>
          <p className="mt-1 text-sm text-[#6B7263]">
            Ringkasan operasional laporan karhutla, penugasan petugas, distribusi
            wilayah, dan publikasi berita dari data aktual Supabase.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/peta"
            className="rounded-lg border border-[#8A947D] bg-white px-4 py-2 text-xs font-semibold text-[#557029] hover:bg-[#EEF2E4] transition-colors"
          >
            Monitoring Peta
          </Link>
          <Link
            href="/admin/laporan"
            className="rounded-lg bg-[#557029] px-4 py-2 text-xs font-semibold text-white hover:bg-[#465D21] transition-colors"
          >
            Kelola Laporan
          </Link>
        </div>
      </div>

      {(dataset.hasQueryError || analytics.hasError) && (
        <ErrorBanner message="Sebagian statistik gagal dimuat dari database Supabase." />
      )}

      <SummaryCardsGrid counts={counts} hrefBase="/admin/laporan" />

      {/* Ringkasan Operasional & Modul */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#F3C8B8] bg-white p-4">
          <span className="text-xs font-semibold text-[#B83E1B]">
            Belum Ditangani
          </span>
          <p className="mt-1 text-2xl font-bold text-[#2C3325]">
            {belumDitangani}
          </p>
          <span className="mt-1 block text-[11px] text-[#6B7263]">
            {counts.menunggu_verifikasi} menunggu verifikasi &bull;{" "}
            {counts.terverifikasi} terverifikasi
          </span>
          <Link
            href="/admin/laporan?status=menunggu_verifikasi"
            className="mt-2 inline-block text-xs font-semibold text-[#B83E1B] hover:underline"
          >
            Tinjau antrean &rarr;
          </Link>
        </div>

        <Link
          href="/admin/pengguna"
          className="rounded-xl border border-[#DCE0D5] bg-white p-4 hover:border-[#557029] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7263]">
            Pengguna &amp; Petugas
          </span>
          <p className="mt-1 text-2xl font-bold text-[#2C3325]">
            {analytics.totalPengguna}
          </p>
          <span className="mt-1 block text-[11px] text-[#6B7263]">
            Admin: {analytics.roleCounts.admin} &bull; Petugas:{" "}
            {analytics.roleCounts.petugas} &bull; Pelapor:{" "}
            {analytics.roleCounts.pelapor}
          </span>
          <span className="mt-2 inline-block text-xs font-semibold text-[#557029]">
            Manajemen Pengguna &rarr;
          </span>
        </Link>

        <Link
          href="/admin/wilayah"
          className="rounded-xl border border-[#DCE0D5] bg-white p-4 hover:border-[#557029] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7263]">
            Cakupan Wilayah &amp; Penugasan
          </span>
          <p className="mt-1 text-2xl font-bold text-[#2C3325]">
            {dataset.wilayahList.length} wilayah
          </p>
          <span className="mt-1 block text-[11px] text-[#6B7263]">
            Penugasan aktif: {analytics.penugasanStats.aktif} &bull; Selesai:{" "}
            {analytics.penugasanStats.selesai}
          </span>
          <span className="mt-2 inline-block text-xs font-semibold text-[#557029]">
            Manajemen Wilayah &rarr;
          </span>
        </Link>

        <Link
          href="/admin/berita"
          className="rounded-xl border border-[#DCE0D5] bg-white p-4 hover:border-[#557029] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7263]">
            Ringkasan Berita
          </span>
          <p className="mt-1 text-2xl font-bold text-[#2C3325]">
            {analytics.beritaStats.tableReady
              ? analytics.beritaStats.total
              : "Belum siap"}
          </p>
          <span className="mt-1 block text-[11px] text-[#6B7263]">
            Published: {analytics.beritaStats.published} &bull; Draft:{" "}
            {analytics.beritaStats.draft} &bull; Arsip:{" "}
            {analytics.beritaStats.archived}
          </span>
          <span className="mt-2 inline-block text-xs font-semibold text-[#557029]">
            Manajemen Berita &rarr;
          </span>
        </Link>
      </section>

      {/* Analitik Distribusi Wilayah & Tren 14 Hari */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#DCE0D5] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2C3325]">
              Distribusi Laporan per Wilayah
            </h2>
            <span className="text-xs text-[#6B7263]">Top 6 wilayah</span>
          </div>

          {wilayahDist.length === 0 ? (
            <p className="text-xs text-[#6B7263] py-6 text-center">
              Belum ada laporan untuk menampilkan distribusi wilayah.
            </p>
          ) : (
            <div className="space-y-3">
              {wilayahDist.map((row) => (
                <div key={row.nama} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#2C3325]">
                      {row.nama}
                    </span>
                    <span className="font-mono font-bold text-[#557029]">
                      {row.total} laporan
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#EEF2E4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#557029]"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((row.total / maxWilayahCount) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#DCE0D5] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2C3325]">
              Tren Laporan (14 Hari Terakhir)
            </h2>
            <span className="text-xs text-[#6B7263]">Harian (WIB)</span>
          </div>

          <div className="flex items-end gap-1.5 h-36 pt-4">
            {trend14Days.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} laporan`}
                className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
              >
                <span className="text-[10px] font-semibold text-[#6B7263]">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    d.count > 0 ? "bg-[#C85A28]" : "bg-[#EEF2E4]"
                  }`}
                  style={{
                    height:
                      d.count > 0
                        ? `${Math.max(
                            14,
                            Math.round((d.count / maxTrendCount) * 84)
                          )}%`
                        : "6px",
                  }}
                />
                <span className="text-[9px] text-[#6B7263] hidden sm:block">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aktivitas Petugas Terbaru */}
      <section className="rounded-2xl border border-[#DCE0D5] bg-white p-5 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-[#2C3325]">
          Aktivitas Penanganan Petugas Terbaru
        </h2>
        {analytics.recentActivities.length === 0 ? (
          <p className="text-xs text-[#6B7263]">
            Belum ada log penanganan lapangan yang tercatat dari petugas.
          </p>
        ) : (
          <ul className="divide-y divide-[#DCE0D5] text-xs">
            {analytics.recentActivities.map((act) => (
              <li
                key={act.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#2C3325]">
                    {act.petugasNama}{" "}
                    <span className="font-normal text-[#6B7263]">
                      memperbarui status ke
                    </span>{" "}
                    <span className="capitalize text-[#557029]">
                      {String(act.statusUpdate ?? "").replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="text-[#4A5243] line-clamp-1">{act.catatan}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[#6B7263]">
                    {formatDate(normalizeDate(act.createdAt), "short")}
                  </span>
                  <Link
                    href={`/admin/laporan/${act.laporanId}`}
                    className="font-semibold text-[#557029] hover:underline"
                  >
                    Lihat &rarr;
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 8 Laporan Masuk Terbaru */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2C3325]">
            Laporan Masuk Terbaru
          </h2>
          <Link
            href="/admin/laporan"
            className="text-xs font-semibold text-[#557029] hover:underline"
          >
            Semua laporan &rarr;
          </Link>
        </div>

        <LaporanTable
          laporan={dataset.laporanList.slice(0, 8)}
          detailHrefPrefix="/admin/laporan"
          emptyTitle="Belum ada laporan masuk"
          emptyDescription="Belum ada laporan karhutla yang tercatat di database."
        />
      </section>
    </div>
  );
}
