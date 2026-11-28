import PublicShell from "@/components/layout/PublicShell";
import PetaLaporanExplorer from "@/components/map/PetaLaporanExplorer";
import { Breadcrumb, ErrorBanner } from "@/components/ui/SharedUI";
import { getCurrentUserWithRole } from "@/lib/auth";
import { fetchNormalizedDataset } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Peta Karhutla | HotMap",
  description:
    "Peta GIS interaktif pemantauan sebaran laporan kejadian kebakaran hutan dan lahan dari masyarakat.",
};

export default async function PublicPetaPage() {
  const { supabase, user, profile, role } = await getCurrentUserWithRole();
  const dataset = await fetchNormalizedDataset(supabase, { limit: 200 });

  const currentUser = user
    ? {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? "",
        role,
      }
    : null;

  return (
    <PublicShell currentUser={currentUser}>
      <div className="space-y-2">
        <Breadcrumb
          items={[{ label: "Beranda", href: "/" }, { label: "Peta Karhutla" }]}
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3325]">
          Peta Sebaran Kejadian Karhutla
        </h1>
        <p className="text-sm text-[#6B7263]">
          Peta GIS interaktif berbasis Leaflet yang menampilkan lokasi laporan
          masyarakat yang memiliki koordinat valid, dibedakan berdasarkan status
          penanganan.
        </p>
      </div>

      {dataset.hasQueryError && (
        <ErrorBanner message="Sebagian data laporan gagal dimuat dari database. Coba muat ulang beberapa saat lagi." />
      )}

      <PetaLaporanExplorer
        laporanList={dataset.laporanList}
        wilayahList={dataset.wilayahList}
        title="Peta Pemantauan Laporan Warga"
        subtitle="Gunakan filter wilayah, tanggal, status, atau pencarian lokasi. Klik marker atau baris daftar untuk fokus lokasi."
      />
    </PublicShell>
  );
}
