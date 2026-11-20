import LaporanDetailView from "@/components/laporan/LaporanDetailView";
import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchLaporanById } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail & Verifikasi Laporan | Admin HotMap",
  description: "Panel detail dan kesiapan verifikasi laporan oleh admin.",
};

export default async function AdminDetailLaporanPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireRole(["admin"]);
  const {
    laporan,
    fotoList,
    penugasanList,
    riwayatList,
    penangananLogList,
    relationsReady,
    error,
  } = await fetchLaporanById(supabase, id);

  if (error) {
    return (
      <ErrorBanner message="Terjadi kesalahan saat memuat detail laporan." />
    );
  }

  if (!laporan) {
    return (
      <EmptyState
        title="Laporan tidak ditemukan"
        description="Laporan yang dimaksud tidak tersedia di database."
        actionLabel="Kembali ke Manajemen Laporan"
        actionHref="/admin/laporan"
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
      backHref="/admin/laporan"
      backLabel="Kembali ke Manajemen Laporan"
    >
      <div className="rounded-xl border border-[#F3C8B8] bg-[#FDF2EA] p-4 text-xs sm:text-sm text-[#9B4017]">
        <strong>Panel Verifikasi &amp; Penugasan Petugas (Fase 3):</strong> Aksi persetujuan/penolakan laporan, pencatatan log verifikasi, dan penugasan petugas lapangan akan diaktifkan pada Fase 3.
      </div>
    </LaporanDetailView>
  );
}
