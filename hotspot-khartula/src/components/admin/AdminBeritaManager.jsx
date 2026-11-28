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
  initialEditId = "",
}) {
  const [editingItem, setEditingItem] = useState(
    () =>
      initialEditId
        ? beritaList.find(
            (b) => b.id === initialEditId || b.slug === initialEditId
          ) ?? null
        : null
  );
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
      <section className="rounded-2xl border border-[#DCE0D5] bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#2C3325]">
              {editingItem ? `Edit Berita: ${editingItem.judul}` : "Tulis Berita Baru"}
            </h2>
            <p className="text-xs text-[#6B7263]">
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
              className="rounded-lg border border-[#8A947D] px-3 py-1.5 text-xs font-semibold text-[#4A5243] hover:bg-[#F7F8F2] cursor-pointer"
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
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
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
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="berita-slug"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
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
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="berita-kategori"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Kategori
            </label>
            <select
              id="berita-kategori"
              name="kategori"
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.kategori ?? "informasi"}
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
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
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Status Publikasi
            </label>
            <select
              id="berita-status"
              name="status"
              disabled={!tableReady || isBusy}
              defaultValue={editingItem?.status ?? "draft"}
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            >
              <option value="draft">Draft (Internal)</option>
              <option value="published">Published (Publik)</option>
              <option value="archived">Archived (Diarsipkan)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="berita-ringkasan"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
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
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="berita-isi"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
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
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="berita-gambar"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
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
              className="block w-full text-xs text-[#6B7263] file:mr-3 file:rounded-lg file:border file:border-[#8A947D] file:bg-[#F7F8F2] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#2C3325] hover:file:bg-[#EEF2E4] disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={!tableReady || isBusy || Boolean(fileError)}
              className="rounded-lg bg-[#557029] hover:bg-[#465D21] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
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
          <h2 className="text-lg font-bold text-[#2C3325]">
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
                    ? "bg-[#557029] text-white border-[#557029]"
                    : "bg-white text-[#4A5243] border-[#8A947D] hover:bg-[#EEF2E4]"
                }`}
              >
                {st === "semua" ? "Semua" : st}
              </button>
            ))}
          </div>
        </div>

        {visibleBerita.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#8A947D] bg-white p-8 text-center text-sm text-[#6B7263]">
            {tableReady
              ? "Belum ada artikel berita pada filter status ini."
              : "Daftar artikel akan tampil setelah tabel public.berita diaktifkan."}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#DCE0D5] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EEF2E4] border-b border-[#DCE0D5] text-[11px] font-bold uppercase tracking-wider text-[#6B7263]">
                    <th className="py-3.5 px-4 sm:px-6">Judul</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE0D5] text-sm">
                  {visibleBerita.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F7F8F2]">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#2C3325]">
                        {b.judul}
                      </td>
                      <td className="py-3.5 px-4 text-xs capitalize text-[#6B7263]">
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
                      <td className="py-3.5 px-4 text-xs text-[#6B7263]">
                        {formatDate(b.tanggal, "short")}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/berita/${b.id}`}
                          className="inline-block rounded-md border border-[#8A947D] px-2.5 py-1 text-xs font-semibold text-[#4A5243] hover:bg-[#F7F8F2]"
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
