"use client";

import { useActionState, useRef, useState } from "react";
import { updatePenangananPetugasAction } from "@/lib/actions/laporan";
import { STATUS_META } from "@/lib/normalizers";
import { validateUploadFile } from "@/lib/storage";
import { PETUGAS_ALLOWED_TRANSITIONS } from "@/lib/workflow";

const MAX_FILES = 2;

export default function PetugasPenangananPanel({
  laporan,
  isAssignedToMe = false,
  isAdmin = false,
}) {
  const [state, dispatch, isPending] = useActionState(
    updatePenangananPetugasAction,
    null
  );
  const [fileError, setFileError] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const fileRef = useRef(null);

  const currentStatus = laporan.statusKey;
  const allowedNext = PETUGAS_ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const canUpdate = (isAssignedToMe || isAdmin) && allowedNext.length > 0;

  function handleFileChange(e) {
    setFileError("");
    const files = Array.from(e.target.files ?? []);
    if (files.length > MAX_FILES) {
      setFileError(`Maksimal ${MAX_FILES} foto bukti penanganan per pembaruan.`);
      e.target.value = "";
      setSelectedCount(0);
      return;
    }
    for (const file of files) {
      const check = validateUploadFile(file);
      if (!check.valid) {
        setFileError(`${file.name}: ${check.error}`);
        e.target.value = "";
        setSelectedCount(0);
        return;
      }
    }
    setSelectedCount(files.length);
  }

  if (!isAssignedToMe && !isAdmin) {
    return (
      <div
        role="status"
        className="rounded-xl border border-[#8A947D] bg-[#F7F8F2] p-4 text-xs sm:text-sm text-[#4A5243]"
      >
        <strong>Akses Read-Only:</strong> Laporan ini tidak ditugaskan kepada
        akun Anda. Sesuai kebijakan keamanan least-privilege, petugas hanya
        dapat memperbarui progres pada laporan yang ditugaskan kepadanya.
      </div>
    );
  }

  if (allowedNext.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-[#C4E2CE] bg-[#EAF5EE] p-4 text-xs sm:text-sm text-[#1F6B41]"
      >
        Status laporan saat ini adalah{" "}
        <strong>{STATUS_META[currentStatus]?.label ?? currentStatus}</strong>.
        Tidak ada aksi pembaruan lapangan lebih lanjut pada tahap ini.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#C5DCF8] bg-[#F4F8FE] p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#2C3325]">
          Pembaruan Progres Penanganan Lapangan
        </h3>
        <p className="text-xs text-[#6B7263]">
          Catat perkembangan lapangan, unggah foto dokumentasi penanganan, atau
          tandai penanganan selesai.
        </p>
      </div>

      {(state?.error || fileError) && (
        <div
          role="alert"
          className="rounded-lg border border-[#E5B8A7] bg-[#FDF2EA] px-3 py-2 text-xs text-[#9B4017]"
        >
          {fileError || state?.error}
        </div>
      )}
      {state?.success && (
        <div
          role="status"
          className="rounded-lg border border-[#C4E2CE] bg-[#EAF5EE] px-3 py-2 text-xs text-[#1F6B41]"
        >
          {state.success}
        </div>
      )}

      <form action={dispatch} className="space-y-4">
        <input type="hidden" name="laporan_id" value={laporan.id} />

        <div>
          <label
            htmlFor="petugas-status-update"
            className="block text-xs font-semibold text-[#4A5243] mb-1"
          >
            Status Progres <span className="text-[#C85A28]">*</span>
          </label>
          <select
            id="petugas-status-update"
            name="status_update"
            defaultValue={allowedNext[0]}
            disabled={isPending}
            className="w-full rounded-lg border border-[#C5DCF8] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
          >
            {allowedNext.map((st) => (
              <option key={st} value={st}>
                {st === "ditangani" && currentStatus === "ditangani"
                  ? "Tetap Ditangani (Tambah Log Progres)"
                  : STATUS_META[st]?.label ?? st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="petugas-catatan"
            className="block text-xs font-semibold text-[#4A5243] mb-1"
          >
            Catatan Lapangan <span className="text-[#C85A28]">*</span>
          </label>
          <textarea
            id="petugas-catatan"
            name="catatan_penanganan"
            rows={3}
            required
            minLength={5}
            maxLength={2000}
            disabled={isPending}
            placeholder="Laporkan tindakan pemadaman, kondisi api terkini, kendala akses, atau hasil pendinginan..."
            className="w-full rounded-lg border border-[#C5DCF8] bg-white px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="petugas-foto"
            className="block text-xs font-semibold text-[#4A5243] mb-1"
          >
            Foto Bukti Penanganan (opsional, maks. {MAX_FILES} foto JPEG/PNG/WebP
            &le; 5 MB)
          </label>
          <input
            ref={fileRef}
            id="petugas-foto"
            name="foto_penanganan"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={isPending}
            onChange={handleFileChange}
            className="block w-full text-xs text-[#6B7263] file:mr-3 file:rounded-lg file:border file:border-[#C5DCF8] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#2C3325] hover:file:bg-[#EEF2E4]"
          />
          {selectedCount > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-[#557029]">
              {selectedCount} foto dipilih untuk diunggah.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canUpdate || isPending || Boolean(fileError)}
            className="rounded-lg bg-[#557029] hover:bg-[#465D21] px-5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Menyimpan Progres..." : "Simpan Progres Lapangan"}
          </button>
        </div>
      </form>
    </div>
  );
}
