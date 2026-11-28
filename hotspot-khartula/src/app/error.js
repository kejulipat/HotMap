"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-screen bg-[#F7F8F2] text-[#2C3325] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-[#E5B8A7] bg-white p-6 shadow-sm space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDF2EA] text-[#B83E1B] font-bold text-lg">
          !
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-[#2C3325]">
            Terjadi Gangguan Saat Memuat Halaman
          </h1>
          <p className="text-sm text-[#6B7263]">
            {error?.message ||
              "Sistem mengalami kendala tak terduga. Silakan coba muat ulang halaman."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[#557029] hover:bg-[#465D21] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-4 py-2 text-xs font-semibold text-[#2C3325] hover:bg-[#EEF2E4] transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
