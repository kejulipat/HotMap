"use client";

import { useEffect, useState } from "react";
import { formatDate, normalizeDate } from "@/lib/normalizers";

function formatBytes(bytes) {
  const num = Number(bytes ?? 0);
  if (!Number.isFinite(num) || num <= 0) return "";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FotoGalleryLightbox({
  fotoList = [],
  compact = false,
  emptyMessage = "Belum ada foto bukti yang diunggah untuk laporan ini.",
}) {
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    if (!activePhoto) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setActivePhoto(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePhoto]);

  if (fotoList.length === 0) {
    return (
      <p className={compact ? "text-xs text-[#6B7263] leading-relaxed" : "text-sm text-[#6B7263]"}>
        {emptyMessage}
      </p>
    );
  }

  const gridClass = compact
    ? fotoList.length === 1
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-2 gap-2.5"
    : "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const thumbHeightClass = compact
    ? fotoList.length === 1
      ? "h-44"
      : "h-28"
    : "h-44";

  return (
    <>
      <div className={gridClass}>
        {fotoList.map((foto, idx) => (
          <div
            key={foto.id}
            className={`rounded-xl border border-[#DCE0D5] bg-[#F7F8F2] ${
              compact ? "p-2 space-y-1.5" : "p-3 space-y-2"
            }`}
          >
            {foto.signedUrl ? (
              <button
                type="button"
                onClick={() => setActivePhoto(foto)}
                className={`group relative block ${thumbHeightClass} w-full overflow-hidden rounded-lg border border-[#DCE0D5] bg-[#EEF2E4] cursor-pointer`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.signedUrl}
                  alt={`Foto ${foto.jenisFoto?.replace("_", " ") || "bukti"} #${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Perbesar
                </span>
              </button>
            ) : (
              <div
                className={`${thumbHeightClass} w-full rounded-lg bg-[#EEF2E4] flex items-center justify-center text-xs text-[#6B7263]`}
              >
                Pratinjau tidak tersedia
              </div>
            )}

            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="font-semibold capitalize text-[#2C3325] truncate">
                {String(foto.jenisFoto ?? "bukti_awal").replace("_", " ")}
              </span>
              <span className="text-[#6B7263] shrink-0">
                {formatBytes(foto.fileSize)}
                {!compact && foto.fileSize ? " • " : ""}
                {!compact ? formatDate(normalizeDate(foto.createdAt), "short") : ""}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Lightbox */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau Foto Bukti"
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-2xl bg-white p-3 sm:p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="text-xs sm:text-sm font-semibold text-[#2C3325] capitalize">
                Foto {String(activePhoto.jenisFoto ?? "bukti").replace("_", " ")}
                <span className="ml-2 font-normal text-[#6B7263]">
                  {formatBytes(activePhoto.fileSize)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="rounded-lg border border-[#8A947D] px-3 py-1 text-xs font-semibold text-[#4A5243] hover:bg-[#F7F8F2] cursor-pointer"
              >
                Tutup (Esc)
              </button>
            </div>
            <div className="max-h-[75vh] overflow-hidden rounded-xl bg-[#2C3325] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.signedUrl}
                alt={`Foto ${activePhoto.jenisFoto ?? "bukti"}`}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
