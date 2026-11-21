"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  createWilayahAction,
  deleteWilayahAction,
  updateWilayahAction,
} from "@/lib/actions/wilayah";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  formatCoordinates,
  isValidCoordinatePair,
  isWithinIndonesiaBounds,
} from "@/lib/gis";
import { formatDate, normalizeDate, parseCoord } from "@/lib/normalizers";

export default function AdminWilayahManager({ wilayahList = [] }) {
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [createState, createDispatch, isCreating] = useActionState(
    createWilayahAction,
    null
  );
  const [updateState, updateDispatch, isUpdating] = useActionState(
    updateWilayahAction,
    null
  );

  const isBusy = isCreating || isUpdating || isDeleting;
  const activeFeedback = editingItem ? updateState : createState;

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return wilayahList;
    return wilayahList.filter((w) => {
      const text = `${w.nama_wilayah ?? ""} ${w.kabupaten_kota ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [wilayahList, search]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startDeleteTransition(async () => {
      const res = await deleteWilayahAction(fd);
      setDeleteTarget(null);
      if (res?.error) {
        setActionMessage({ type: "error", text: res.error });
      } else if (res?.success) {
        setActionMessage({ type: "success", text: res.success });
        if (editingItem?.id === deleteTarget.id) setEditingItem(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {(activeFeedback?.error || actionMessage?.type === "error") && (
        <div
          role="alert"
          className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
        >
          {activeFeedback?.error || actionMessage?.text}
        </div>
      )}

      {(activeFeedback?.success || actionMessage?.type === "success") && (
        <div
          role="status"
          className="rounded-xl border border-[#C4E2CE] bg-[#EAF5EE] px-4 py-3 text-sm text-[#1F6B41]"
        >
          {activeFeedback?.success || actionMessage?.text}
        </div>
      )}

      {/* Form Tambah / Edit Wilayah */}
      <section className="rounded-2xl border border-[#E3E8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#12241B]">
              {editingItem
                ? `Edit Wilayah: ${editingItem.nama_wilayah}`
                : "Tambah Wilayah Pemantauan"}
            </h2>
            <p className="text-xs text-[#6B7A71]">
              Koordinat pusat (Lat -11.5..6.5, Lng 94.5..142.0) digunakan peta
              GIS untuk fokus wilayah secara otomatis.
            </p>
          </div>
          {editingItem && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setActionMessage(null);
              }}
              className="rounded-lg border border-[#DCE2DA] px-3 py-1.5 text-xs font-semibold text-[#4E5E55] hover:bg-[#F6F7F3] cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form
          key={editingItem?.id ?? "create-wilayah"}
          action={editingItem ? updateDispatch : createDispatch}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
          {editingItem && (
            <input type="hidden" name="id" value={editingItem.id} />
          )}

          <div>
            <label
              htmlFor="wilayah-nama"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Nama Wilayah / Provinsi <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="wilayah-nama"
              name="nama_wilayah"
              type="text"
              required
              minLength={2}
              maxLength={120}
              disabled={isBusy}
              defaultValue={editingItem?.nama_wilayah ?? ""}
              placeholder="Contoh: Riau"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="wilayah-kab"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Kabupaten / Kota <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="wilayah-kab"
              name="kabupaten_kota"
              type="text"
              required
              minLength={2}
              maxLength={120}
              disabled={isBusy}
              defaultValue={editingItem?.kabupaten_kota ?? ""}
              placeholder="Contoh: Kabupaten Pelalawan"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="wilayah-lat"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Center Latitude <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="wilayah-lat"
              name="center_lat"
              type="number"
              step="any"
              required
              disabled={isBusy}
              defaultValue={editingItem?.center_lat ?? ""}
              placeholder="0.2082"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 font-mono text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="wilayah-lng"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Center Longitude <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="wilayah-lng"
              name="center_lng"
              type="number"
              step="any"
              required
              disabled={isBusy}
              defaultValue={editingItem?.center_lng ?? ""}
              placeholder="102.1654"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 font-mono text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-lg bg-[#155E42] hover:bg-[#114B35] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isBusy
                ? "Menyimpan..."
                : editingItem
                ? "Simpan Perubahan Wilayah"
                : "+ Tambah Wilayah"}
            </button>
          </div>
        </form>
      </section>

      {/* Tabel Daftar Wilayah */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-[#12241B]">
            Daftar Wilayah ({filteredList.length})
          </h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari provinsi atau kabupaten/kota..."
            className="w-full sm:w-72 rounded-lg border border-[#DCE2DA] bg-white px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
          />
        </div>

        {filteredList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CBD6CE] bg-white px-6 py-10 text-center text-sm text-[#606F67]">
            Belum ada data wilayah yang cocok. Tambahkan wilayah melalui form di
            atas.
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                    <th className="py-3.5 px-4 sm:px-6">Nama Wilayah</th>
                    <th className="py-3.5 px-4">Kabupaten / Kota</th>
                    <th className="py-3.5 px-4">Koordinat Pusat</th>
                    <th className="py-3.5 px-4">Dibuat</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFE9] text-sm">
                  {filteredList.map((w) => {
                    const lat = parseCoord(w.center_lat);
                    const lng = parseCoord(w.center_lng);
                    const valid = isValidCoordinatePair(lat, lng);
                    const inRi = valid && isWithinIndonesiaBounds(lat, lng);
                    return (
                      <tr key={w.id} className="hover:bg-[#F9FAF8]">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#14231B]">
                          {w.nama_wilayah}
                        </td>
                        <td className="py-3.5 px-4 text-xs sm:text-sm text-[#4E5E55]">
                          {w.kabupaten_kota || "-"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#6B7A71]">
                          {valid ? formatCoordinates(lat, lng, 4) : "-"}
                          {valid && !inRi && (
                            <span className="ml-1.5 text-[10px] font-sans font-semibold text-[#B83E1B]">
                              (Luar RI)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                          {w.created_at
                            ? formatDate(normalizeDate(w.created_at), "short")
                            : "-"}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingItem(w);
                              setActionMessage(null);
                            }}
                            className="rounded-md border border-[#C5DCF8] bg-[#EBF4FF] px-2.5 py-1 text-xs font-semibold text-[#1E62B5] hover:bg-[#DCEBFE] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(w)}
                            className="rounded-md border border-[#F3C8B8] bg-[#FDF2EA] px-2.5 py-1 text-xs font-semibold text-[#B83E1B] hover:bg-[#FDE3D5] cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Wilayah?"
        message={`Wilayah "${deleteTarget?.nama_wilayah ?? ""} — ${
          deleteTarget?.kabupaten_kota ?? ""
        }" akan dihapus permanen. Penghapusan otomatis ditolak jika wilayah masih digunakan laporan.`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isPending={isDeleting}
      />
    </div>
  );
}
