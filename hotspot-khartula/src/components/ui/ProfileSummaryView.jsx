import Link from "next/link";
import { ROLE_LABELS } from "@/lib/auth";
import { formatDate, normalizeDate } from "@/lib/normalizers";

export default function ProfileSummaryView({
  user,
  profile,
  role,
  wilayahName = "-",
  actionLinks = [],
}) {
  const fullName =
    profile?.full_name || user?.user_metadata?.full_name || "Belum diisi";
  const createdDate = normalizeDate(profile?.created_at ?? user?.created_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Profil {ROLE_LABELS[role] ?? "Pengguna"}
        </h1>
        <p className="mt-1 text-sm text-[#606F67]">
          Informasi akun yang terhubung dengan Supabase Auth dan tabel{" "}
          <code className="text-xs font-mono bg-[#EEF2EC] px-1.5 py-0.5 rounded">
            profiles
          </code>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-5 max-w-2xl">
        <div className="flex items-center gap-4 pb-5 border-b border-[#ECEFE9]">
          <div className="h-12 w-12 rounded-xl bg-[#155E42] text-white flex items-center justify-center font-bold text-lg">
            {String(fullName).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#14231B]">{fullName}</h2>
            <p className="text-xs text-[#6B7A71]">{user?.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-[#ECEFE9] text-sm">
          <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#6B7A71]">User ID</dt>
            <dd className="font-mono text-xs text-[#14231B]">{user?.id}</dd>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#6B7A71]">Role Akun</dt>
            <dd className="font-semibold text-[#155E42]">
              {ROLE_LABELS[role] ?? role}
            </dd>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#6B7A71]">Wilayah Tugas / Domisili</dt>
            <dd className="font-semibold text-[#14231B]">{wilayahName}</dd>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#6B7A71]">Terdaftar Sejak</dt>
            <dd className="font-semibold text-[#14231B]">
              {createdDate ? formatDate(createdDate, "long") : "-"}
            </dd>
          </div>
        </dl>

        {actionLinks.length > 0 && (
          <div className="pt-4 border-t border-[#ECEFE9] flex flex-wrap gap-3">
            {actionLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-4 py-2 text-xs font-semibold text-[#14231B] hover:border-[#155E42] hover:bg-[#EAF1EC] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
