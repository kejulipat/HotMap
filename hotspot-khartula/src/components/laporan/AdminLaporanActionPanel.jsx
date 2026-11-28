"use client";

import { useActionState, useState, useTransition } from "react";
import {
  assignPetugasAction,
  cancelPenugasanAction,
  deleteLaporanAction,
  verifyAndUpdateLaporanAction,
} from "@/lib/actions/laporan";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { STATUS_META } from "@/lib/normalizers";
import {
  ADMIN_ALLOWED_TRANSITIONS,
  TINGKAT_KEPARAHAN_OPTIONS,
} from "@/lib/workflow";

export default function AdminLaporanActionPanel({
  laporan,
  petugasList = [],
}) {
  const [verifyState, verifyDispatch, isVerifying] = useActionState(
    verifyAndUpdateLaporanAction,
    null
  );
  const [assignState, assignDispatch, isAssigning] = useActionState(
    assignPetugasAction,
    null
  );
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isMutating, startTransition] = useTransition();

  const currentStatus = laporan.statusKey;
  const nextOptions = Array.from(
    new Set([currentStatus, ...(ADMIN_ALLOWED_TRANSITIONS[currentStatus] ?? [])])
  );

  const isBusy = isVerifying || isAssigning || isMutating;

  function handleCancelAssignment() {
    const fd = new FormData();
    fd.set("laporan_id", laporan.id);
    startTransition(async () => {
      const res = await cancelPenugasanAction(fd);
      setCancelFeedback(res);
    });
  }

  function handleConfirmDelete() {
    const fd = new FormData();
    fd.set("laporan_id", laporan.id);
    startTransition(async () => {
      await deleteLaporanAction(fd);
    });
  }

  return (
    <div className="space-y-5 pt-2 border-t border-[#DCE0D5]">
      {/* Panel 1: Verifikasi, Status & Prioritas */}
      <div className="rounded-xl border border-[#8A947D] bg-[#F7F8F2] p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#2C3325]">
            Verifikasi, Status &amp; Prioritas Laporan
          </h3>
          <p className="text-xs text-[#6B7263]">
            Setiap perubahan status tercatat permanen pada riwayat audit
            laporan.
          </p>
        </div>

        {verifyState?.error && (
          <div
            role="alert"
            className="rounded-lg border border-[#E5B8A7] bg-[#FDF2EA] px-3 py-2 text-xs text-[#9B4017]"
          >
            {verifyState.error}
          </div>
        )}
        {verifyState?.success && (
          <div
            role="status"
            className="rounded-lg border border-[#C4E2CE] bg-[#EAF5EE] px-3 py-2 text-xs text-[#1F6B41]"
          >
            {verifyState.success}
          </div>
        )}

        <form action={verifyDispatch} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <input type="hidden" name="laporan_id" value={laporan.id} />

          <div>
            <label
              htmlFor="admin-status"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Status Laporan
            </label>
            <select
              id="admin-status"
              name="status"
              defaultValue={currentStatus}
              disabled={isBusy}
              className="w-full rounded-lg border border-[#8A947D] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            >
              {nextOptions.map((st) => (
                <option key={st} value={st}>
                  {STATUS_META[st]?.label ?? st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-keparahan"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Prioritas / Tingkat Keparahan
            </label>
            <select
              id="admin-keparahan"
              name="tingkat_keparahan"
              defaultValue={laporan.tingkatKeparahan ?? "sedang"}
              disabled={isBusy}
              className="w-full rounded-lg border border-[#8A947D] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            >
              {TINGKAT_KEPARAHAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="admin-catatan"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Catatan Verifikasi / Tindak Lanjut
            </label>
            <textarea
              id="admin-catatan"
              name="catatan_verifikasi"
              rows={3}
              defaultValue={laporan.catatanVerifikasi ?? ""}
              disabled={isBusy}
              placeholder="Tuliskan catatan verifikasi, instruksi lapangan, atau alasan penolakan..."
              className="w-full rounded-lg border border-[#8A947D] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-lg bg-[#557029] hover:bg-[#465D21] px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? "Menyimpan..." : "Simpan Status & Verifikasi"}
            </button>
          </div>
        </form>
      </div>

      {/* Panel 2: Penugasan Petugas */}
      <div className="rounded-xl border border-[#C5DCF8] bg-[#F4F8FE] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#2C3325]">
              Penugasan Petugas Lapangan
            </h3>
            <p className="text-xs text-[#6B7263]">
              Petugas aktif saat ini:{" "}
              <strong className="text-[#2C3325]">{laporan.petugas}</strong>
            </p>
          </div>

          {laporan.petugasId &&
            !["selesai", "ditolak"].includes(currentStatus) && (
              <button
                type="button"
                disabled={isBusy}
                onClick={handleCancelAssignment}
                className="rounded-lg border border-[#E5B8A7] bg-white px-3 py-1.5 text-xs font-semibold text-[#B83E1B] hover:bg-[#FDF2EA] cursor-pointer"
              >
                Batalkan Penugasan Aktif
              </button>
            )}
        </div>

        {(assignState?.error || cancelFeedback?.error) && (
          <div
            role="alert"
            className="rounded-lg border border-[#E5B8A7] bg-[#FDF2EA] px-3 py-2 text-xs text-[#9B4017]"
          >
            {assignState?.error || cancelFeedback?.error}
          </div>
        )}
        {(assignState?.success || cancelFeedback?.success) && (
          <div
            role="status"
            className="rounded-lg border border-[#C4E2CE] bg-[#EAF5EE] px-3 py-2 text-xs text-[#1F6B41]"
          >
            {assignState?.success || cancelFeedback?.success}
          </div>
        )}

        {["selesai", "ditolak"].includes(currentStatus) ? (
          <p className="text-xs text-[#6B7263]">
            Penugasan baru dinonaktifkan karena laporan berstatus{" "}
            <strong>{STATUS_META[currentStatus]?.label}</strong>.
          </p>
        ) : petugasList.length === 0 ? (
          <p className="text-xs text-[#9B4017]">
            Belum ada akun ber-role <strong>Petugas</strong> pada tabel{" "}
            <code className="font-mono">profiles</code>.
          </p>
        ) : (
          <form action={assignDispatch} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <input type="hidden" name="laporan_id" value={laporan.id} />

            <div>
              <label
                htmlFor="assign-petugas"
                className="block text-xs font-semibold text-[#4A5243] mb-1"
              >
                Pilih Petugas
              </label>
              <select
                id="assign-petugas"
                name="petugas_id"
                defaultValue={laporan.petugasId ?? petugasList[0]?.id ?? ""}
                disabled={isBusy}
                className="w-full rounded-lg border border-[#C5DCF8] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
              >
                {petugasList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.id.slice(0, 8)}
                    {p.wilayahNama ? ` (${p.wilayahNama})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="assign-catatan"
                className="block text-xs font-semibold text-[#4A5243] mb-1"
              >
                Instruksi Penugasan (opsional)
              </label>
              <input
                id="assign-catatan"
                name="catatan"
                type="text"
                maxLength={500}
                disabled={isBusy}
                placeholder="Contoh: Prioritas verifikasi lapangan & pemadaman awal"
                className="w-full rounded-lg border border-[#C5DCF8] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isBusy}
                className="rounded-lg bg-[#1E62B5] hover:bg-[#174E92] px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAssigning
                  ? "Menugaskan..."
                  : laporan.petugasId
                  ? "Alihkan Penugasan Petugas"
                  : "Tugaskan Petugas"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Panel 3: Zona Hapus Laporan */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F3C8B8] bg-[#FDF2EA]/60 px-4 py-3">
        <p className="text-xs text-[#9B4017]">
          Hapus permanen laporan beserta seluruh lampiran foto bukti privatnya.
        </p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setConfirmDelete(true)}
          className="rounded-lg border border-[#E5B8A7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#B83E1B] hover:bg-[#FDEEE9] cursor-pointer"
        >
          Hapus Laporan
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Laporan Permanen?"
        message={`Laporan "${laporan.judul}" beserta seluruh foto bukti dan riwayat penanganannya akan dihapus permanen.`}
        confirmLabel="Ya, Hapus Laporan"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
        isPending={isMutating}
      />
    </div>
  );
}
