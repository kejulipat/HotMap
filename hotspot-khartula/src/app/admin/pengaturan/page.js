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
        <h1 className="text-2xl font-bold text-[#2C3325]">
          Pengaturan Aplikasi
        </h1>
        <p className="mt-1 text-sm text-[#6B7263]">
          Informasi konfigurasi sistem, status Fast Login akun demo, dan utilitas diagnostik admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-[#DCE0D5] bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-[#2C3325]">
            Koneksi &amp; Sesi Admin
          </h2>
          <dl className="divide-y divide-[#DCE0D5] text-xs">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7263]">Supabase URL</dt>
              <dd className="font-mono text-[#2C3325] truncate max-w-52.5">
                {supabaseHost}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7263]">Admin Aktif</dt>
              <dd className="font-semibold text-[#2C3325]">
                {profile?.full_name || user.email}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7263]">Mode Environment</dt>
              <dd className="font-mono text-[#2C3325]">{process.env.NODE_ENV}</dd>
            </div>
          </dl>

          <div className="pt-2">
            <Link
              href="/test-db"
              className="inline-flex items-center justify-center rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-4 py-2 text-xs font-semibold text-[#557029] hover:bg-[#EEF2E4] transition-colors"
            >
              Buka Diagnostik Database (/test-db) &rarr;
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DCE0D5] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2C3325]">
              Status Fast Login Demo
            </h2>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                fastLogin.enabled
                  ? "bg-[#EEF2E4] text-[#3F561E]"
                  : "bg-[#F7F8F2] text-[#6B7263]"
              }`}
            >
              {fastLogin.enabled ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          <p className="text-xs text-[#6B7263]">
            Kredensial akun demo dikelola melalui variabel environment server-only (tanpa prefix{" "}
            <code className="font-mono bg-[#F7F8F2] px-1 rounded">NEXT_PUBLIC_</code>
            ).
          </p>

          <dl className="divide-y divide-[#DCE0D5] text-xs">
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
                    <dt className="font-semibold text-[#2C3325]">{row.label}</dt>
                    <dd className="text-[11px] font-mono text-[#6B7263]">
                      {row.env}
                    </dd>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      ready
                        ? "bg-[#EEF2E4] text-[#3F561E]"
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
