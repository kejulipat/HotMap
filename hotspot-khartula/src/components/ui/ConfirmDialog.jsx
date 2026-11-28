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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C3325]/45 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-[12px] border border-[#DCE0D5] bg-white p-6 hm-floating-card">
        <h3
          id="confirm-dialog-title"
          className="font-serif text-[20px] font-semibold text-[#2C3325]"
        >
          {title}
        </h3>
        <p className="mt-2 text-[14px] text-[#6B7263]">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="rounded-full border border-[#8A947D] bg-white px-5 py-2 text-sm font-semibold text-[#2C3325] hover:bg-[#F7F8F2] disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="rounded-full bg-[#B83E1B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#9B3417] disabled:opacity-60 cursor-pointer"
          >
            {isPending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
