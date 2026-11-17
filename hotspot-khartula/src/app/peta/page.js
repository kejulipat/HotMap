import PublicShell from "@/components/layout/PublicShell";
import {
  Breadcrumb,
  ErrorBanner,
  LaporanTable,
  MapOverviewBox,
  SummaryCardsGrid,
} from "@/components/ui/SharedUI";
import { getCurrentUserWithRole } from "@/lib/auth";
import {
  computeStatusCounts,
  fetchNormalizedDataset,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Peta Karhutla | HotMap",
  description:
    "Peta pemantauan sebaran laporan kejadian kebakaran hutan dan lahan dari masyarakat.",
};

export default async function PublicPetaPage() {
  const { supabase, user, profile, role } = await getCurrentUserWithRole();
  const dataset = await fetchNormalizedDataset(supabase, { limit: 200 });
  const counts = computeStatusCounts(dataset.laporanList);

  const currentUser = user
    ? {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? "",
        role,
      }
    : null;

  return (
    <PublicShell currentUser={currentUser}>
      <div className="space-y-2">
        <Breadcrumb
          items={[{ label: "Beranda", href: "/" }, { label: "Peta Karhutla" }]}
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-[#12241B]">
          Peta Sebaran Kejadian Karhutla
        </h1>
        <p className="text-sm text-[#606F67]">
          Menampilkan lokasi laporan masyarakat yang memiliki koordinat valid, dibedakan berdasarkan status penanganan.
        </p>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Sebagian data laporan gagal dimuat dari database. Coba muat ulang beberapa saat lagi." />
      )}

      <SummaryCardsGrid counts={counts} />

      <MapOverviewBox
        laporan={dataset.laporanList}
        title="Peta Pemantauan Laporan Warga"
        subtitle="Fondasi peta terhubung ke data Supabase. Peta geografis interaktif Leaflet akan diaktifkan pada Fase 2."
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#12241B]">
            Daftar Titik Laporan
          </h2>
          <span className="text-xs font-medium text-[#606F67]">
            {dataset.laporanList.length} laporan
          </span>
        </div>
        <LaporanTable
          laporan={dataset.laporanList}
          emptyTitle="Belum ada titik laporan"
          emptyDescription="Belum ada laporan karhutla yang tercatat di database."
          actionLabel="Kirim Laporan Pertama"
          actionHref="/pelapor/laporan/buat"
        />
      </section>
    </PublicShell>
  );
}
