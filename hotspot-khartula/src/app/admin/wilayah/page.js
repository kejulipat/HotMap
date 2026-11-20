import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import {
  formatDate,
  isValidLatLng,
  normalizeDate,
  parseCoord,
} from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Wilayah | Admin HotMap",
  description: "Daftar wilayah pemantauan karhutla pada tabel wilayah.",
};

export default async function AdminWilayahPage() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("wilayah")
    .select("id, nama_wilayah, kabupaten_kota, center_lat, center_lng, created_at")
    .order("nama_wilayah", { ascending: true });

  const wilayahList = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">Manajemen Wilayah</h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Daftar wilayah pemantauan dari tabel{" "}
          <code className="text-xs font-mono bg-[#EEF2EC] px-1.5 py-0.5 rounded">
            wilayah
          </code>
          . Operasi tambah/ubah wilayah akan diaktifkan pada Fase 4.
        </p>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar wilayah dari database." />
      )}

      {wilayahList.length === 0 ? (
        <EmptyState
          title="Belum ada data wilayah"
          description="Tabel wilayah belum memiliki data atau belum dapat dibaca."
        />
      ) : (
        <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                  <th className="py-3.5 px-4 sm:px-6">Nama Wilayah</th>
                  <th className="py-3.5 px-4">Kabupaten / Kota</th>
                  <th className="py-3.5 px-4">Koordinat Pusat</th>
                  <th className="py-3.5 px-4 sm:px-6">Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9] text-sm">
                {wilayahList.map((w) => {
                  const lat = parseCoord(w.center_lat);
                  const lng = parseCoord(w.center_lng);
                  return (
                    <tr key={w.id} className="hover:bg-[#F9FAF8]">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#14231B]">
                        {w.nama_wilayah}
                      </td>
                      <td className="py-3.5 px-4 text-xs sm:text-sm text-[#4E5E55]">
                        {w.kabupaten_kota || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#6B7A71]">
                        {isValidLatLng(lat, lng)
                          ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                          : "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-[#5F6F66]">
                        {w.created_at
                          ? formatDate(normalizeDate(w.created_at), "short")
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
