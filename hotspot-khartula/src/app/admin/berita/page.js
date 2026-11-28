import Link from "next/link";
import AdminBeritaManager from "@/components/admin/AdminBeritaManager";
import { ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchBeritaList } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Berita | Admin HotMap",
  description: "Pengelolaan artikel berita dan informasi publik karhutla.",
};

export default async function AdminBeritaPage() {
  const { supabase } = await requireRole(["admin"]);
  const { beritaList, tableReady, error } = await fetchBeritaList(
    supabase,
    100,
    { includeAllStatuses: true }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3325]">
            Manajemen Berita
          </h1>
          <p className="mt-1 text-sm text-[#6B7263]">
            Buat, sunting, publikasikan, dan hapus berita karhutla beserta gambar sampulnya.
          </p>
        </div>
        <Link
          href="/berita"
          className="self-start sm:self-auto rounded-lg border border-[#8A947D] bg-white px-4 py-2 text-xs font-semibold text-[#557029] hover:bg-[#EEF2E4] transition-colors"
        >
          Lihat Halaman Berita Publik &rarr;
        </Link>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar berita dari database." />
      )}

      <AdminBeritaManager beritaList={beritaList} tableReady={tableReady} />
    </div>
  );
}
