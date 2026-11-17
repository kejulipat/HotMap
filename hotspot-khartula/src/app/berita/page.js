import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import {
  Breadcrumb,
  EmptyState,
  ErrorBanner,
} from "@/components/ui/SharedUI";
import { getCurrentUserWithRole } from "@/lib/auth";
import { fetchBeritaList, formatDate } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Berita | HotMap",
  description: "Daftar berita dan informasi terkini terkait kebakaran hutan dan lahan.",
};

export default async function BeritaPage() {
  const { supabase, user, profile, role } = await getCurrentUserWithRole();
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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#12241B]">
          Berita &amp; Informasi Karhutla
        </h1>
        <p className="text-sm text-[#606F67]">
          Informasi resmi, peringatan dini, dan laporan penanganan kebakaran hutan dan lahan.
        </p>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar berita dari database." />
      )}

      {!tableReady ? (
        <EmptyState
          title="Modul Berita Menunggu Inisialisasi Tabel"
          description="Tabel publik `berita` belum tersedia di database Supabase. Konten berita akan muncul otomatis setelah tabel dibuat dan diisi oleh admin pada fase pengelolaan konten."
          actionLabel="Kembali ke Beranda"
          actionHref="/"
        />
      ) : beritaList.length === 0 ? (
        <EmptyState
          title="Belum ada berita dipublikasikan"
          description="Admin belum menerbitkan berita atau imbauan baru. Silakan periksa kembali nanti."
          actionLabel="Lihat Peta Karhutla"
          actionHref="/peta"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {beritaList.map((berita) => (
            <Link
              key={berita.id}
              href={`/berita/${berita.id}`}
              className="group rounded-xl bg-white border border-[#E3E8E1] p-4 shadow-2xs hover:border-[#C5D1C8] hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className="h-40 w-full rounded-lg overflow-hidden mb-3.5 bg-linear-to-b from-[#2E3834] via-[#7A5438] to-[#D47A42]"
                  style={
                    berita.gambarUrl
                      ? {
                          backgroundImage: `url("${encodeURI(berita.gambarUrl)}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <h2 className="text-base font-bold text-[#14231B] group-hover:text-[#155E42] transition-colors leading-snug">
                  {berita.judul}
                </h2>
                {berita.ringkasan && (
                  <p className="mt-2 text-xs text-[#606F67] line-clamp-2">
                    {berita.ringkasan}
                  </p>
                )}
              </div>
              <p className="mt-4 pt-3 border-t border-[#ECEFE9] text-xs text-[#6B7A71]">
                {formatDate(berita.tanggal, "long")} &bull; {berita.penulis}
              </p>
            </Link>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
