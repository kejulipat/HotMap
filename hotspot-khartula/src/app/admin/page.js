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
  title: "Dashboard Admin | HotMap",
  description: "Pusat kontrol operasional, laporan, pengguna, dan wilayah HotMap.",
};

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(["admin"]);

  const [dataset, profilesCountRes, beritaCountRes] = await Promise.all([
    fetchNormalizedDataset(supabase, { limit: 100 }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("berita").select("id", { count: "exact", head: true }),
  ]);

  const counts = computeStatusCounts(dataset.laporanList);
  const totalPengguna = profilesCountRes.count ?? 0;
  const beritaReady =
    beritaCountRes.error?.code !== "PGRST205" && dataset.beritaTableReady;
  const totalBerita = beritaCountRes.count ?? dataset.beritaList.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Dashboard Administrasi HotMap
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Ringkasan operasional laporan karhutla, pengguna terdaftar, dan cakupan wilayah.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/peta"
            className="rounded-lg border border-[#DCE2DA] bg-white px-4 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
          >
            Monitoring Peta
          </Link>
          <Link
            href="/admin/laporan"
            className="rounded-lg bg-[#155E42] px-4 py-2 text-xs font-semibold text-white hover:bg-[#114B35] transition-colors"
          >
            Kelola Laporan
          </Link>
        </div>
      </div>

      {(dataset.hasQueryError || profilesCountRes.error) && (
        <ErrorBanner message="Sebagian statistik gagal dimuat dari database Supabase." />
      )}

      <SummaryCardsGrid counts={counts} hrefBase="/admin/laporan" />

      {/* Pintasan Modul Manajemen */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/pengguna"
          className="rounded-xl border border-[#E3E8E1] bg-white p-4 hover:border-[#155E42] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7A71]">
            Pengguna Terdaftar
          </span>
          <p className="mt-1 text-2xl font-bold text-[#14231B]">
            {totalPengguna}
          </p>
          <span className="mt-2 inline-block text-xs font-semibold text-[#155E42]">
            Manajemen Pengguna &rarr;
          </span>
        </Link>

        <Link
          href="/admin/wilayah"
          className="rounded-xl border border-[#E3E8E1] bg-white p-4 hover:border-[#155E42] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7A71]">
            Cakupan Wilayah
          </span>
          <p className="mt-1 text-2xl font-bold text-[#14231B]">
            {dataset.wilayahList.length}
          </p>
          <span className="mt-2 inline-block text-xs font-semibold text-[#155E42]">
            Manajemen Wilayah &rarr;
          </span>
        </Link>

        <Link
          href="/admin/berita"
          className="rounded-xl border border-[#E3E8E1] bg-white p-4 hover:border-[#155E42] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7A71]">
            Artikel Berita
          </span>
          <p className="mt-1 text-2xl font-bold text-[#14231B]">
            {beritaReady ? totalBerita : "Belum siap"}
          </p>
          <span className="mt-2 inline-block text-xs font-semibold text-[#155E42]">
            Manajemen Berita &rarr;
          </span>
        </Link>

        <Link
          href="/admin/pengaturan"
          className="rounded-xl border border-[#E3E8E1] bg-white p-4 hover:border-[#155E42] transition-colors"
        >
          <span className="text-xs font-semibold text-[#6B7A71]">
            Konfigurasi Sistem
          </span>
          <p className="mt-1 text-lg font-bold text-[#14231B]">
            Auth &amp; Diagnostik
          </p>
          <span className="mt-2 inline-block text-xs font-semibold text-[#155E42]">
            Buka Pengaturan &rarr;
          </span>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#12241B]">
            Laporan Masuk Terbaru
          </h2>
          <Link
            href="/admin/laporan"
            className="text-xs font-semibold text-[#155E42] hover:underline"
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
