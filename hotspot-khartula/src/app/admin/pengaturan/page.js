import Link from "next/link";
import { getFastLoginAvailability, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Aplikasi | Admin HotMap",
  description: "Status konfigurasi autentikasi, environment, dan diagnostik admin.",
};

export default async function AdminPengaturanPage() {
  const { user, profile } = await requireRole(["admin"]);
  const fastLogin = getFastLoginAvailability();

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(belum diset)";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Pengaturan Aplikasi
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Informasi konfigurasi sistem, status Fast Login akun demo, dan utilitas diagnostik admin.
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

        <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#14231B]">
              Status Fast Login Demo
            </h2>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                fastLogin.enabled
                  ? "bg-[#EAF5EE] text-[#1F6B41]"
                  : "bg-[#F0F2F0] text-[#525E58]"
              }`}
            >
              {fastLogin.enabled ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          <p className="text-xs text-[#606F67]">
            Kredensial akun demo dikelola melalui variabel environment server-only (tanpa prefix{" "}
            <code className="font-mono bg-[#EEF2EC] px-1 rounded">NEXT_PUBLIC_</code>
            ).
          </p>

          <dl className="divide-y divide-[#ECEFE9] text-xs">
            {[
              { key: "admin", label: "Akun Demo Admin", env: "DEMO_ADMIN_*" },
              { key: "petugas", label: "Akun Demo Petugas", env: "DEMO_PETUGAS_*" },
              { key: "pelapor", label: "Akun Demo Pelapor", env: "DEMO_PELAPOR_*" },
            ].map((row) => {
              const ready = Boolean(fastLogin.roles?.[row.key]);
              return (
                <div
                  key={row.key}
                  className="py-2.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <dt className="font-semibold text-[#14231B]">{row.label}</dt>
                    <dd className="text-[11px] font-mono text-[#6B7A71]">
                      {row.env}
                    </dd>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      ready
                        ? "bg-[#EAF5EE] text-[#1F6B41]"
                        : "bg-[#FDF2EA] text-[#9B4017]"
                    }`}
                  >
                    {ready ? "Terkonfigurasi" : "Belum diset"}
                  </span>
                </div>
              );
            })}
          </dl>
        </section>
      </div>
    </div>
  );
}
