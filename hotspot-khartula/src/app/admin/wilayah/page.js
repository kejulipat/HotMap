import AdminWilayahManager from "@/components/admin/AdminWilayahManager";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Wilayah | Admin HotMap",
  description: "Kelola master wilayah pemantauan karhutla dan koordinat pusatnya.",
};

export default async function AdminWilayahPage() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("wilayah")
    .select("id, nama_wilayah, kabupaten_kota, center_lat, center_lng, created_at")
    .order("nama_wilayah", { ascending: true })
    .order("kabupaten_kota", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C3325]">Manajemen Wilayah</h1>
        <p className="mt-1 text-sm text-[#6B7263]">
          Kelola daftar wilayah pemantauan karhutla pada tabel{" "}
          <code className="text-xs font-mono bg-[#EEF2E4] px-1.5 py-0.5 rounded">
            wilayah
          </code>{" "}
          beserta koordinat pusat untuk fokus peta GIS dan formulir pelaporan.
        </p>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar wilayah dari database." />
      )}

      <AdminWilayahManager wilayahList={data ?? []} />
    </div>
  );
}
