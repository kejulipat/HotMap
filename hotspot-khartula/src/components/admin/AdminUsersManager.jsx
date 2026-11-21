"use client";

import { useActionState, useMemo, useState } from "react";
import { adminUpdateUserAction } from "@/lib/actions/users";
import { ROLE_LABELS, normalizeRole } from "@/lib/workflow";
import { formatDate, normalizeDate } from "@/lib/normalizers";

export default function AdminUsersManager({
  profiles = [],
  wilayahList = [],
  currentAdminId = null,
}) {
  const [editingUser, setEditingUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("semua");
  const [search, setSearch] = useState("");

  const [state, dispatch, isPending] = useActionState(
    adminUpdateUserAction,
    null
  );

  const wilayahMap = useMemo(
    () =>
      new Map(
        wilayahList.map((w) => [
          w.id,
          `${w.nama_wilayah}${w.kabupaten_kota ? ` — ${w.kabupaten_kota}` : ""}`,
        ])
      ),
    [wilayahList]
  );

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      const r = normalizeRole(p.role);
      if (roleFilter !== "semua" && r !== roleFilter) return false;
      if (q) {
        const wName = p.wilayah_id ? wilayahMap.get(p.wilayah_id) ?? "" : "";
        const hay = `${p.full_name ?? ""} ${p.id ?? ""} ${r} ${wName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [profiles, roleFilter, search, wilayahMap]);

  return (
    <div className="space-y-6">
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
        >
          {state.error}
        </div>
      )}
      {state?.success && (
        <div
          role="status"
          className="rounded-xl border border-[#C4E2CE] bg-[#EAF5EE] px-4 py-3 text-sm text-[#1F6B41]"
        >
          {state.success}
        </div>
      )}

      {/* Panel Edit Pengguna */}
      {editingUser && (
        <section className="rounded-2xl border border-[#C5DCF8] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#12241B]">
                Kelola Akun: {editingUser.full_name || editingUser.id.slice(0, 8)}
              </h2>
              <p className="text-xs font-mono text-[#6B7A71]">{editingUser.id}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="rounded-lg border border-[#DCE2DA] px-3 py-1.5 text-xs font-semibold text-[#4E5E55] hover:bg-[#F6F7F3] cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <form
            key={editingUser.id}
            action={dispatch}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <input type="hidden" name="id" value={editingUser.id} />

            <div>
              <label
                htmlFor="edit-user-name"
                className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
              >
                Nama Lengkap
              </label>
              <input
                id="edit-user-name"
                name="full_name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
                defaultValue={editingUser.full_name ?? ""}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="edit-user-role"
                className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
              >
                Role Otorisasi
              </label>
              <select
                id="edit-user-role"
                name="role"
                disabled={isPending || editingUser.id === currentAdminId}
                defaultValue={normalizeRole(editingUser.role)}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
              >
                <option value="pelapor">Pelapor</option>
                <option value="petugas">Petugas</option>
                <option value="admin">Admin</option>
              </select>
              {editingUser.id === currentAdminId && (
                <input type="hidden" name="role" value="admin" />
              )}
            </div>

            <div>
              <label
                htmlFor="edit-user-wilayah"
                className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
              >
                Wilayah Tugas / Domisili
              </label>
              <select
                id="edit-user-wilayah"
                name="wilayah_id"
                disabled={isPending}
                defaultValue={editingUser.wilayah_id ?? ""}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
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

            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[#155E42] hover:bg-[#114B35] px-5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan Akun"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["semua", "admin", "petugas", "pelapor"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                roleFilter === r
                  ? "bg-[#155E42] text-white border-[#155E42]"
                  : "bg-white text-[#4E5E55] border-[#DCE2DA] hover:bg-[#EAF1EC]"
              }`}
            >
              {r === "semua" ? "Semua Role" : ROLE_LABELS[r] ?? r}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau wilayah..."
          className="w-full sm:w-64 rounded-lg border border-[#DCE2DA] bg-white px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
        />
      </div>

      {/* Tabel Pengguna */}
      <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                <th className="py-3.5 px-4 sm:px-6">Nama Lengkap</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Wilayah</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEFE9] text-sm">
              {filteredProfiles.map((p) => {
                const roleKey = normalizeRole(p.role);
                return (
                  <tr key={p.id} className="hover:bg-[#F9FAF8]">
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-semibold text-[#14231B]">
                        {p.full_name || p.id.slice(0, 8)}
                        {p.id === currentAdminId && (
                          <span className="ml-2 rounded bg-[#EAF1EC] px-1.5 py-0.5 text-[10px] font-semibold text-[#155E42]">
                            Anda
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-[#6B7A71]">
                        {p.id}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-md bg-[#EAF1EC] px-2.5 py-1 text-xs font-semibold text-[#155E42]">
                        {ROLE_LABELS[roleKey] ?? roleKey}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-[#5F6F66]">
                      {p.wilayah_id ? wilayahMap.get(p.wilayah_id) ?? "-" : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                      {p.created_at
                        ? formatDate(normalizeDate(p.created_at), "short")
                        : "-"}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingUser(p)}
                        className="rounded-md border border-[#C5DCF8] bg-[#EBF4FF] px-3 py-1 text-xs font-semibold text-[#1E62B5] hover:bg-[#DCEBFE] cursor-pointer"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
