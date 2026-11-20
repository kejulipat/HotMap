import LandingExplorer from "@/components/landing/LandingExplorer";
import { getCurrentUserWithRole } from "@/lib/auth";
import { fetchNormalizedDataset } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HotMap | Pemantauan Kebakaran Hutan & Lahan",
  description:
    "Pantau titik karhutla di seluruh wilayah, dari laporan warga sampai penanganan selesai.",
};

export default async function LandingPage() {
  const { supabase, user, profile, role } = await getCurrentUserWithRole();
  const dataset = await fetchNormalizedDataset(supabase, {
    limit: 100,
    beritaLimit: 3,
  });

  const currentUser = user
    ? {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
        role,
      }
    : null;

  return (
    <LandingExplorer
      initialLaporan={dataset.laporanList}
      wilayahList={dataset.wilayahList}
      beritaList={dataset.beritaList}
      hasQueryError={dataset.hasQueryError}
      currentUser={currentUser}
    />
  );
}
