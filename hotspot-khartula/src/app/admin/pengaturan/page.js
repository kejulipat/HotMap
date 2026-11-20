import Link from "next/link";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Aplikasi | Admin HotMap",
  description: "Status konfigurasi autentikasi, environment, dan diagnostik admin.",
};

export default async function AdminPengaturanPage() {
  const { user, profile } = await requireRole(["admin"]);

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(belum diset)";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Pengaturan Aplikasi
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Informasi konfigurasi sistem dan utilitas diagnostik admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-[#14231B]">
            Koneksi &amp; Sesi Admin
          </h2>
          <dl className="divide-y divide-[#ECEFE9] text-xs">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Supabase URL</dt>
              <dd className="font-mono text-[#14231B] truncate max-w-[210px]">
                {supabaseHost}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Admin Aktif</dt>
              <dd className="font-semibold text-[#14231B]">
                {profile?.full_name || user.email}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Mode Environment</dt>
              <dd className="font-mono text-[#14231B]">{process.env.NODE_ENV}</dd>
            </div>
          </dl>

          <div className="pt-2">
            <Link
              href="/test-db"
              className="inline-flex items-center justify-center rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-4 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
            >
              Buka Diagnostik Database (/test-db) &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
