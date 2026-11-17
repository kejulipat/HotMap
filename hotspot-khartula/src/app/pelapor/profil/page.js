import ProfileSummaryView from "@/components/ui/ProfileSummaryView";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil Pelapor | HotMap",
  description: "Informasi akun pelapor HotMap.",
};

export default async function PelaporProfilPage() {
  const { supabase, user, profile, role } = await requireRole([
    "pelapor",
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
        { href: "/pelapor", label: "Dashboard Pelapor" },
        { href: "/pelapor/laporan", label: "Laporan Saya" },
        { href: "/pelapor/laporan/buat", label: "Buat Laporan" },
      ]}
    />
  );
}
