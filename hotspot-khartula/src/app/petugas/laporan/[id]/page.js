import LaporanDetailView from "@/components/laporan/LaporanDetailView";
import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchLaporanById } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tindak Lanjut Laporan Petugas | HotMap",
  description: "Detail dan kesiapan tindak lanjut laporan untuk petugas.",
};

export default async function PetugasDetailLaporanPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireRole(["petugas", "admin"]);
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
        actionLabel="Kembali ke Daftar Laporan"
        actionHref="/petugas/laporan"
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
      backHref="/petugas/laporan"
      backLabel="Kembali ke Daftar Laporan"
    >
      <div className="rounded-xl border border-[#C5DCF8] bg-[#EBF4FF] p-4 text-xs sm:text-sm text-[#1E62B5]">
        <strong>Modul Tindak Lanjut Lapangan (Fase 3):</strong> Struktur database penugasan dan log penanganan sudah siap; aksi pembaruan status (<em>Ditangani</em> &rarr; <em>Selesai</em>) dan unggah dokumentasi lapangan akan diaktifkan pada Fase 3.
      </div>
    </LaporanDetailView>
  );
}
