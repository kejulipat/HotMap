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

  const { data: wilayahList } = await supabase
    .from("wilayah")
    .select("id, nama_wilayah, kabupaten_kota")
    .order("nama_wilayah", { ascending: true });

  const matched = (wilayahList ?? []).find((w) => w.id === profile?.wilayah_id);
  const wilayahName = matched
    ? `${matched.nama_wilayah}${
        matched.kabupaten_kota ? ` — ${matched.kabupaten_kota}` : ""
      }`
    : "-";

  return (
    <ProfileSummaryView
      user={user}
      profile={profile}
      role={role}
      wilayahName={wilayahName}
      wilayahList={wilayahList ?? []}
      actionLinks={[
        { href: "/petugas", label: "Dashboard Petugas" },
        { href: "/petugas/laporan", label: "Daftar Laporan" },
        { href: "/petugas/peta", label: "Peta Operasional" },
      ]}
    />
  );
}
