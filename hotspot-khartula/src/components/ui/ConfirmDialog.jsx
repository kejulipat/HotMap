"use client";

export default function ConfirmDialog({
  open,
  title = "Konfirmasi Tindakan",
  message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  isPending = false,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-xl">
        <h3
          id="confirm-dialog-title"
          className="text-lg font-bold text-[#14231B]"
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#5E6D64]">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="rounded-lg border border-[#DCE2DA] bg-white px-4 py-2 text-sm font-semibold text-[#4E5E55] hover:bg-[#F6F7F3] disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="rounded-lg bg-[#C85A28] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B04B1D] disabled:opacity-60 cursor-pointer"
          >
            {isPending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
