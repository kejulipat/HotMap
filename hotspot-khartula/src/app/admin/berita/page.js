import Link from "next/link";
import { EmptyState, ErrorBanner } from "@/components/ui/SharedUI";
import { requireRole } from "@/lib/auth";
import { fetchBeritaList, formatDate } from "@/lib/normalizers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Berita | Admin HotMap",
  description: "Pengelolaan artikel berita dan informasi publik karhutla.",
};

export default async function AdminBeritaPage() {
  const { supabase } = await requireRole(["admin"]);
  const { beritaList, tableReady, error } = await fetchBeritaList(supabase, 50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Manajemen Berita
          </h1>
          <p className="mt-1 text-sm text-[#606F67]">
            Kelola informasi dan imbauan karhutla untuk halaman publik. Operasi tulis berita disiapkan pada Fase 4.
          </p>
        </div>
        <Link
          href="/berita"
          className="self-start sm:self-auto rounded-lg border border-[#DCE2DA] bg-white px-4 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
        >
          Lihat Halaman Berita Publik &rarr;
        </Link>
      </div>

      {error && (
        <ErrorBanner message="Gagal memuat daftar berita dari database." />
      )}

      {!tableReady ? (
        <EmptyState
          title="Tabel `public.berita` Belum Tersedia"
          description="Saat pemeriksaan database, tabel `public.berita` belum ditemukan di Supabase schema cache. Siapkan tabel `berita` melalui migrasi sebelum mengaktifkan CRUD berita di Fase 4."
        />
      ) : beritaList.length === 0 ? (
        <EmptyState
          title="Belum ada artikel berita"
          description="Tabel berita sudah siap, namun belum ada artikel yang diterbitkan."
        />
      ) : (
        <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                  <th className="py-3.5 px-4 sm:px-6">Judul</th>
                  <th className="py-3.5 px-4">Penulis</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Pratinjau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9] text-sm">
                {beritaList.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F9FAF8]">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#14231B]">
                      {b.judul}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                      {b.penulis}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                      {formatDate(b.tanggal, "short")}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        href={`/berita/${b.id}`}
                        className="text-xs font-semibold text-[#155E42] hover:underline"
                      >
                        Buka &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
