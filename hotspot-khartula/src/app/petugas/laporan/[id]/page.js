import LaporanDetailView from "@/components/laporan/LaporanDetailView";
import PetugasPenangananPanel from "@/components/laporan/PetugasPenangananPanel";
import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchLaporanById } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tindak Lanjut Laporan Petugas | HotMap",
  description: "Detail dan pembaruan progres penanganan laporan oleh petugas.",
};

export default async function PetugasDetailLaporanPage({ params }) {
  const { id } = await params;
  const { supabase, user, role } = await requireRole(["petugas", "admin"]);
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

  const isAssignedToMe = Boolean(laporan.petugasId && laporan.petugasId === user.id);

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
      <PetugasPenangananPanel
        laporan={laporan}
        isAssignedToMe={isAssignedToMe}
        isAdmin={role === "admin"}
      />
    </LaporanDetailView>
  );
}
