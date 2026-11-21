import AdminUsersManager from "@/components/admin/AdminUsersManager";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Pengguna | Admin HotMap",
  description: "Kelola akun pengguna, role otorisasi, dan wilayah tugas HotMap.",
};

export default async function AdminPenggunaPage() {
  const { supabase, user } = await requireRole(["admin"]);

  const [profilesRes, wilayahRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, wilayah_id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("wilayah")
      .select("id, nama_wilayah, kabupaten_kota")
      .order("nama_wilayah", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Manajemen Pengguna
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Kelola nama, role otorisasi (Admin, Petugas, Pelapor), dan wilayah
          tugas pengguna pada tabel{" "}
          <code className="text-xs font-mono bg-[#EEF2EC] px-1.5 py-0.5 rounded">
            profiles
          </code>
          .
        </p>
      </div>

      {profilesRes.error && (
        <ErrorBanner message="Gagal memuat daftar pengguna dari tabel profiles." />
      )}

      <AdminUsersManager
        profiles={profilesRes.data ?? []}
        wilayahList={wilayahRes.data ?? []}
        currentAdminId={user.id}
      />
    </div>
  );
}
