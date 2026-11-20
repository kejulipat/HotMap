"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  createBeritaAction,
  deleteBeritaAction,
  updateBeritaAction,
} from "@/lib/actions/berita";
import { formatDate } from "@/lib/normalizers";
import { validateUploadFile } from "@/lib/storage";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STATUS_BADGES = {
  published: "bg-[#EAF5EE] text-[#1F6B41]",
  draft: "bg-[#FEF5E7] text-[#B5651D]",
  archived: "bg-[#F0F2F0] text-[#525E58]",
};

export default function AdminBeritaManager({
  beritaList = [],
  tableReady = false,
}) {
  const [editingItem, setEditingItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("semua");
  const [fileError, setFileError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [createState, createDispatch, isCreatePending] = useActionState(
    createBeritaAction,
    null
  );
  const [updateState, updateDispatch, isUpdatePending] = useActionState(
    updateBeritaAction,
    null
  );

  const isBusy = isCreatePending || isUpdatePending || isDeleting;
  const activeFeedback = editingItem ? updateState : createState;

  const visibleBerita =
    statusFilter === "semua"
      ? beritaList
      : beritaList.filter((b) => b.status === statusFilter);

  function handleFileChange(e) {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateUploadFile(file);
    if (!check.valid) {
      setFileError(check.error);
      e.target.value = "";
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);

    startDeleteTransition(async () => {
      const res = await deleteBeritaAction(fd);
      setDeleteTarget(null);
      if (res?.error) {
        setActionMessage({ type: "error", text: res.error });
      } else if (res?.success) {
        setActionMessage({ type: "success", text: res.success });
        if (editingItem?.id === deleteTarget.id) {
          setEditingItem(null);
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {!tableReady && (
        <div
          role="status"
          className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-xs sm:text-sm text-[#9B4017]"
        >
          <strong>Menunggu Penerapan Migration:</strong> Tabel{" "}
          <code className="font-mono bg-white/80 px-1 rounded">public.berita</code>{" "}
          belum aktif di database Supabase live. Terapkan{" "}
          <code className="font-mono bg-white/80 px-1 rounded">
            supabase/migrations/20261118000100_fase1_5_berita.sql
          </code>{" "}
          dan{" "}
          <code className="font-mono bg-white/80 px-1 rounded">
            20261118000300_fase1_5_storage_buckets_rls.sql
          </code>{" "}
          untuk mengaktifkan penyimpanan berita.
        </div>
      )}

      {(activeFeedback?.error || fileError || actionMessage?.type === "error") && (
        <div
          role="alert"
          className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
        >
          {fileError || activeFeedback?.error || actionMessage?.text}
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

      {/* Form Tambah / Edit Berita */}
      <section className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#12241B]">
              {editingItem ? `Edit Berita: ${editingItem.judul}` : "Tulis Berita Baru"}
            </h2>
            <p className="text-xs text-[#6B7A71]">
              Berita berstatus <em>Published</em> akan langsung tampil di halaman publik{" "}
              <code className="font-mono">/berita</code> dan beranda.
            </p>
          </div>
          {editingItem && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setFileError("");
              }}
              className="rounded-lg border border-[#DCE2DA] px-3 py-1.5 text-xs font-semibold text-[#4E5E55] hover:bg-[#F6F7F3] cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form
          key={editingItem?.id ?? "create-form"}
          action={editingItem ? updateDispatch : createDispatch}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {editingItem && (
            <input type="hidden" name="id" value={editingItem.id} />
          )}

          <div>
            <label
              htmlFor="berita-judul"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Judul Berita
            </label>
            <input
              id="berita-judul"
              name="judul"
              type="text"
              required
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.judul ?? ""}
              placeholder="Contoh: Peringatan Dini Kekeringan Lahan Gambut"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="berita-slug"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Slug URL (opsional)
            </label>
            <input
              id="berita-slug"
              name="slug"
              type="text"
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.slug ?? ""}
              placeholder="otomatis-dari-judul-jika-kosong"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="berita-kategori"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Kategori
            </label>
            <select
              id="berita-kategori"
              name="kategori"
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.kategori ?? "informasi"}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            >
              <option value="informasi">Informasi</option>
              <option value="peringatan">Peringatan Dini</option>
              <option value="penanganan">Penanganan Lapangan</option>
              <option value="edukasi">Edukasi Pencegahan</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="berita-status"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Status Publikasi
            </label>
            <select
              id="berita-status"
              name="status"
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.status ?? "draft"}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            >
              <option value="draft">Draft (Internal)</option>
              <option value="published">Published (Publik)</option>
              <option value="archived">Archived (Diarsipkan)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="berita-ringkasan"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Ringkasan Singkat
            </label>
            <input
              id="berita-ringkasan"
              name="ringkasan"
              type="text"
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.ringkasan ?? ""}
              placeholder="Ringkasan 1-2 kalimat untuk pratinjau kartu berita"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="berita-isi"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Isi Berita Lengkap
            </label>
            <textarea
              id="berita-isi"
              name="isi"
              rows={5}
              required
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.isi ?? ""}
              placeholder="Tulis isi informasi atau imbauan lengkap di sini..."
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="berita-gambar"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Gambar Sampul (JPEG/PNG/WebP, maks. 5 MB — bucket{" "}
              <code className="font-mono">berita-images</code>)
            </label>
            <input
              id="berita-gambar"
              name="gambar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={!tableReady || isBusy}
              onChange={handleFileChange}
              className="block w-full text-xs text-[#5F6F66] file:mr-3 file:rounded-lg file:border file:border-[#DCE2DA] file:bg-[#F6F7F3] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#14231B] hover:file:bg-[#EAF1EC] disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={!tableReady || isBusy || Boolean(fileError)}
              className="rounded-lg bg-[#155E42] hover:bg-[#114B35] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isBusy
                ? "Menyimpan..."
                : editingItem
                ? "Simpan Perubahan"
                : "Simpan Berita"}
            </button>
          </div>
        </form>
      </section>

      {/* Daftar Berita Admin */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-[#12241B]">
            Daftar Artikel ({visibleBerita.length})
          </h2>

          <div className="flex flex-wrap gap-2">
            {["semua", "published", "draft", "archived"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#155E42] text-white border-[#155E42]"
                    : "bg-white text-[#4E5E55] border-[#DCE2DA] hover:bg-[#EAF1EC]"
                }`}
              >
                {st === "semua" ? "Semua" : st}
              </button>
            ))}
          </div>
        </div>

        {visibleBerita.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CBD6CE] bg-white p-8 text-center text-sm text-[#606F67]">
            {tableReady
              ? "Belum ada artikel berita pada filter status ini."
              : "Daftar artikel akan tampil setelah tabel public.berita diaktifkan."}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                    <th className="py-3.5 px-4 sm:px-6">Judul</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFE9] text-sm">
                  {visibleBerita.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9FAF8]">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#14231B]">
                        {b.judul}
                      </td>
                      <td className="py-3.5 px-4 text-xs capitalize text-[#5F6F66]">
                        {b.kategori}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            STATUS_BADGES[b.status] ?? STATUS_BADGES.draft
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                        {formatDate(b.tanggal, "short")}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/berita/${b.id}`}
                          className="inline-block rounded-md border border-[#DCE2DA] px-2.5 py-1 text-xs font-semibold text-[#4E5E55] hover:bg-[#F6F7F3]"
                        >
                          Lihat
                        </Link>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setEditingItem(b);
                            setActionMessage(null);
                            setFileError("");
                          }}
                          className="rounded-md border border-[#C5DCF8] bg-[#EBF4FF] px-2.5 py-1 text-xs font-semibold text-[#1E62B5] hover:bg-[#DCEBFE] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget(b)}
                          className="rounded-md border border-[#F3C8B8] bg-[#FDF2EA] px-2.5 py-1 text-xs font-semibold text-[#B83E1B] hover:bg-[#FDE3D5] cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Berita?"
        message={`Artikel "${deleteTarget?.judul ?? ""}" beserta gambar terkait akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isPending={isDeleting}
      />
    </div>
  );
}
