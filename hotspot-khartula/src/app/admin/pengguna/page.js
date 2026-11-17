import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { ROLE_LABELS, normalizeRole, requireRole } from "@/lib/auth";
import { formatDate, normalizeDate } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Pengguna | Admin HotMap",
  description: "Daftar akun pengguna dan peran akses sistem HotMap.",
};

export default async function AdminPenggunaPage() {
  const { supabase } = await requireRole(["admin"]);

  const [profilesRes, wilayahRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, wilayah_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("wilayah").select("id, nama_wilayah"),
  ]);

  const wilayahMap = new Map(
    (wilayahRes.data ?? []).map((w) => [w.id, w.nama_wilayah])
  );
  const profiles = profilesRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Manajemen Pengguna
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Daftar akun pengguna yang tercatat pada tabel{" "}
          <code className="text-xs font-mono bg-[#EEF2EC] px-1.5 py-0.5 rounded">
            profiles
          </code>{" "}
          beserta role otorisasinya. Pengelolaan ubah role akan dilengkapi pada Fase 4.
        </p>
      </div>

      {profilesRes.error && (
        <ErrorBanner message="Gagal memuat daftar pengguna dari tabel profiles." />
      )}

      {profiles.length === 0 ? (
        <EmptyState
          title="Belum ada data pengguna terlihat"
          description="Tabel profiles kosong atau kebijakan RLS membatasi pembacaan baris profil lain."
        />
      ) : (
        <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                  <th className="py-3.5 px-4 sm:px-6">Nama Lengkap</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Wilayah</th>
                  <th className="py-3.5 px-4 sm:px-6">Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9] text-sm">
                {profiles.map((p) => {
                  const roleKey = normalizeRole(p.role);
                  return (
                    <tr key={p.id} className="hover:bg-[#F9FAF8]">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#14231B]">
                        {p.full_name || p.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-md bg-[#EAF1EC] px-2.5 py-1 text-xs font-semibold text-[#155E42]">
                          {ROLE_LABELS[roleKey] ?? roleKey}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs sm:text-sm text-[#5F6F66]">
                        {p.wilayah_id ? wilayahMap.get(p.wilayah_id) ?? "-" : "-"}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-[#5F6F66]">
                        {p.created_at
                          ? formatDate(normalizeDate(p.created_at), "short")
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
