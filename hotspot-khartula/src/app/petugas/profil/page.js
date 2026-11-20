import ProfileSummaryView from "@/components/ui/ProfileSummaryView";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil Petugas | HotMap",
  description: "Informasi profil dan wilayah tugas petugas HotMap.",
};

export default async function PetugasProfilPage() {
  const { supabase, user, profile, role } = await requireRole([
    "petugas",
    "admin",
  ]);

  let wilayahName = "-";
  if (profile?.wilayah_id) {
    const { data: wilayah } = await supabase
      .from("wilayah")
      .select("nama_wilayah")
      .eq("id", profile.wilayah_id)
      .maybeSingle();
    wilayahName = wilayah?.nama_wilayah ?? "-";
  }

  return (
    <ProfileSummaryView
      user={user}
      profile={profile}
      role={role}
      wilayahName={wilayahName}
      actionLinks={[
        { href: "/petugas", label: "Dashboard Petugas" },
        { href: "/petugas/laporan", label: "Daftar Laporan" },
        { href: "/petugas/peta", label: "Peta Operasional" },
      ]}
    />
  );
}
