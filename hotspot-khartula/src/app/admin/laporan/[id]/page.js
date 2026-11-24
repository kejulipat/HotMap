import AdminLaporanActionPanel from "@/components/laporan/AdminLaporanActionPanel";
import LaporanDetailView from "@/components/laporan/LaporanDetailView";
import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchLaporanById } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail & Verifikasi Laporan | Admin HotMap",
  description:
    "Panel detail, verifikasi status, penentuan prioritas, dan penugasan petugas oleh admin.",
};

export default async function AdminDetailLaporanPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireRole(["admin"]);

  const [detailRes, petugasRes, wilayahRes] = await Promise.all([
    fetchLaporanById(supabase, id),
    supabase
      .from("profiles")
      .select("id, full_name, role, wilayah_id")
      .eq("role", "petugas")
      .order("full_name", { ascending: true }),
    supabase.from("wilayah").select("id, nama_wilayah"),
  ]);

  const {
    laporan,
    fotoList,
    penugasanList,
    riwayatList,
    penangananLogList,
    relationsReady,
    error,
  } = detailRes;

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

  const wilayahMap = new Map(
    (wilayahRes.data ?? []).map((w) => [w.id, w.nama_wilayah])
  );
  const petugasList = (petugasRes.data ?? []).map((p) => ({
    ...p,
    wilayahNama: p.wilayah_id ? wilayahMap.get(p.wilayah_id) ?? null : null,
  }));

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
      <AdminLaporanActionPanel laporan={laporan} petugasList={petugasList} />
    </LaporanDetailView>
  );
}
