"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateMyProfileAction } from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/workflow";
import { formatDate, normalizeDate } from "@/lib/normalizers";

export default function ProfileSummaryView({
  user,
  profile,
  role,
  wilayahName = "-",
  wilayahList = [],
  actionLinks = [],
}) {
  const [state, dispatch, isPending] = useActionState(
    updateMyProfileAction,
    null
  );

  const fullName =
    profile?.full_name || user?.user_metadata?.full_name || "Belum diisi";
  const createdDate = normalizeDate(profile?.created_at ?? user?.created_at);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C3325]">
          Profil {ROLE_LABELS[role] ?? "Pengguna"}
        </h1>
        <p className="mt-1 text-sm text-[#6B7263]">
          Informasi akun yang terhubung dengan Supabase Auth dan tabel{" "}
          <code className="text-xs font-mono bg-[#EEF2E4] px-1.5 py-0.5 rounded">
            profiles
          </code>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-[#DCE0D5] bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-4 pb-5 border-b border-[#DCE0D5]">
            <div className="h-12 w-12 rounded-xl bg-[#557029] text-white flex items-center justify-center font-bold text-lg">
              {String(fullName).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2C3325]">{fullName}</h2>
              <p className="text-xs text-[#6B7263]">{user?.email}</p>
            </div>
          </div>

          <dl className="divide-y divide-[#DCE0D5] text-sm">
            <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#6B7263]">User ID</dt>
              <dd className="font-mono text-xs text-[#2C3325]">{user?.id}</dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#6B7263]">Role Akun</dt>
              <dd className="font-semibold text-[#557029]">
                {ROLE_LABELS[role] ?? role}
              </dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#6B7263]">Wilayah Tugas / Domisili</dt>
              <dd className="font-semibold text-[#2C3325]">{wilayahName}</dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#6B7263]">Terdaftar Sejak</dt>
              <dd className="font-semibold text-[#2C3325]">
                {createdDate ? formatDate(createdDate, "long") : "-"}
              </dd>
            </div>
          </dl>

          {actionLinks.length > 0 && (
            <div className="pt-4 border-t border-[#DCE0D5] flex flex-wrap gap-3">
              {actionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-4 py-2 text-xs font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#EEF2E4] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Form Ubah Profil Diri Sendiri (Hanya Nama & Wilayah — Role dikunci di server & RLS) */}
        <div className="rounded-2xl border border-[#DCE0D5] bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#2C3325]">
              Perbarui Profil Saya
            </h2>
            <p className="text-xs text-[#6B7263]">
              Ubah nama tampilan dan wilayah domisili/tugas Anda. Perubahan role
              hanya dapat dilakukan oleh Admin.
            </p>
          </div>

          {state?.error && (
            <div
              role="alert"
              className="rounded-lg border border-[#E5B8A7] bg-[#FDF2EA] px-3.5 py-2.5 text-xs text-[#9B4017]"
            >
              {state.error}
            </div>
          )}
          {state?.success && (
            <div
              role="status"
              className="rounded-lg border border-[#C4E2CE] bg-[#EAF5EE] px-3.5 py-2.5 text-xs text-[#1F6B41]"
            >
              {state.success}
            </div>
          )}

          <form action={dispatch} className="space-y-4">
            <div>
              <label
                htmlFor="profile-full-name"
                className="block text-xs font-semibold text-[#4A5243] mb-1.5"
              >
                Nama Lengkap <span className="text-[#C85A28]">*</span>
              </label>
              <input
                id="profile-full-name"
                name="full_name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
                defaultValue={profile?.full_name ?? ""}
                className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="profile-wilayah"
                className="block text-xs font-semibold text-[#4A5243] mb-1.5"
              >
                Wilayah Tugas / Domisili
              </label>
              <select
                id="profile-wilayah"
                name="wilayah_id"
                disabled={isPending}
                defaultValue={profile?.wilayah_id ?? ""}
                className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
              >
                <option value="">— Belum ditetapkan —</option>
                {wilayahList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama_wilayah}
                    {w.kabupaten_kota ? ` — ${w.kabupaten_kota}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[#557029] hover:bg-[#465D21] px-5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
