import LaporanDetailView from "@/components/laporan/LaporanDetailView";
import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchLaporanById } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail Laporan Pelapor | HotMap",
  description: "Status dan informasi detail laporan karhutla milik pelapor.",
};

export default async function PelaporDetailLaporanPage({ params }) {
  const { id } = await params;
  const { supabase, user, role } = await requireRole(["pelapor", "admin"]);
  const {
    laporan,
    fotoList,
    penugasanList,
    riwayatList,
    penangananLogList,
    relationsReady,
    error,
  } = await fetchLaporanById(supabase, id);

  const isAuthorized =
    laporan && (role === "admin" || laporan.pelaporId === user.id);

  if (error) {
    return (
      <ErrorBanner message="Terjadi kesalahan saat memuat detail laporan." />
    );
  }

  if (!isAuthorized) {
    return (
      <EmptyState
        title="Laporan tidak ditemukan"
        description="Laporan tidak tersedia atau Anda tidak memiliki hak akses untuk melihat laporan ini."
        actionLabel="Kembali ke Laporan Saya"
        actionHref="/pelapor/laporan"
      />
    );
  }

  return (
    <LaporanDetailView
      laporan={laporan}
      fotoList={fotoList}
      penugasanList={penugasanList}
      riwayatList={riwayatList}
      penangananLogList={penangananLogList}
      relationsReady={relationsReady}
      backHref="/pelapor/laporan"
      backLabel="Kembali ke Laporan Saya"
    />
  );
}
