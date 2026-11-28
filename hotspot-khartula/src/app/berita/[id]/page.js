import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import {
  Breadcrumb,
  EmptyState,
  ErrorBanner,
} from "@/components/ui/SharedUI";
import { getCurrentUserWithRole } from "@/lib/auth";
import { fetchBeritaById, formatDate } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Detail Berita (${id}) | HotMap`,
    description: "Informasi lengkap berita kebakaran hutan dan lahan.",
  };
}

export default async function DetailBeritaPage({ params }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const { supabase, user, profile, role } = await getCurrentUserWithRole();
  const { berita, tableReady, error } = await fetchBeritaById(
    supabase,
    decodedId
  );

  const visibleBerita =
    berita && (berita.status === "published" || role === "admin")
      ? berita
      : null;

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
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/" },
          { label: "Berita", href: "/berita" },
          { label: visibleBerita ? visibleBerita.judul : "Detail Berita" },
        ]}
      />

      {error && (
        <ErrorBanner message="Terjadi kesalahan saat membaca detail berita." />
      )}

      {!tableReady ? (
        <EmptyState
          title="Tabel Berita Belum Tersedia"
          description="Artikel belum dapat dimuat karena tabel `berita` belum tersedia di database Supabase."
          actionLabel="Kembali ke Daftar Berita"
          actionHref="/berita"
        />
      ) : !visibleBerita ? (
        <EmptyState
          title="Berita tidak ditemukan"
          description={`Artikel dengan pengenal "${decodedId}" tidak tersedia, belum dipublikasikan, atau sudah dihapus.`}
          actionLabel="Lihat Semua Berita"
          actionHref="/berita"
        />
      ) : (
        <article className="mx-auto max-w-3xl rounded-2xl border border-[#DCE0D5] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
          <header className="space-y-3 border-b border-[#DCE0D5] pb-5">
            <span className="inline-block rounded-md bg-[#EEF2E4] px-2.5 py-1 text-xs font-semibold capitalize text-[#557029]">
              {visibleBerita.kategori || "Informasi Karhutla"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3325] leading-snug">
              {visibleBerita.judul}
            </h1>
            {visibleBerita.ringkasan && (
              <p className="text-sm text-[#6B7263]">{visibleBerita.ringkasan}</p>
            )}
            <p className="text-xs text-[#6B7263]">
              Dipublikasikan {formatDate(visibleBerita.tanggal, "long")} &bull; Oleh{" "}
              <span className="font-semibold text-[#2C3325]">
                {visibleBerita.penulis}
              </span>
            </p>
          </header>

          {visibleBerita.gambarUrl && (
            <div
              className="h-64 w-full rounded-xl bg-cover bg-center border border-[#DCE0D5]"
              style={{
                backgroundImage: `url("${encodeURI(visibleBerita.gambarUrl)}")`,
              }}
            />
          )}

          <div className="prose prose-sm max-w-none text-[#2B3B32] leading-relaxed whitespace-pre-line">
            {visibleBerita.isi || "Konten artikel belum tersedia."}
          </div>

          <div className="pt-4 border-t border-[#DCE0D5]">
            <Link
              href="/berita"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#557029] hover:underline"
            >
              &larr; Kembali ke daftar berita
            </Link>
          </div>
        </article>
      )}
    </PublicShell>
  );
}
