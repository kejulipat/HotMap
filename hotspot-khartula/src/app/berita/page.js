import PublicBeritaExplorer from "@/components/berita/PublicBeritaExplorer";
import PublicShell from "@/components/layout/PublicShell";
import {
  Breadcrumb,
  EmptyState,
  ErrorBanner,
} from "@/components/ui/SharedUI";
import { getCurrentUserWithRole } from "@/lib/auth";
import { fetchBeritaList } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Berita | HotMap",
  description: "Daftar berita dan informasi terkini terkait kebakaran hutan dan lahan.",
};

export default async function BeritaPage({ searchParams }) {
  const [{ supabase, user, profile, role }, resolvedParams] = await Promise.all([
    getCurrentUserWithRole(),
    searchParams,
  ]);
  const initialQuery =
    typeof resolvedParams?.q === "string" ? resolvedParams.q.trim() : "";

  const { beritaList, tableReady, error } = await fetchBeritaList(supabase, 50);

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
          items={[{ label: "Beranda", href: "/" }, { label: "Berita" }]}
        />
        <h1 className="font-serif text-[30px] sm:text-[36px] font-bold text-[#2C3325] leading-tight">
          Berita &amp; Informasi Karhutla
        </h1>
        <p className="text-[14px] text-[#6B7263]">
          Informasi resmi, peringatan dini, dan laporan penanganan kebakaran
          hutan dan lahan.
        </p>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar berita dari database." />
      )}

      {!tableReady ? (
        <EmptyState
          title="Modul Berita Menunggu Inisialisasi Tabel"
          description="Tabel publik `berita` belum tersedia di database Supabase."
          actionLabel="Kembali ke Beranda"
          actionHref="/"
        />
      ) : (
        <PublicBeritaExplorer
          beritaList={beritaList}
          initialSearch={initialQuery}
        />
      )}
    </PublicShell>
  );
}
