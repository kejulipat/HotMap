"use client";

import Link from "next/link";

export default function AdminError({ error, reset }) {
  return (
    <div className="rounded-2xl border border-[#E5B8A7] bg-white p-6 shadow-2xs space-y-4 max-w-xl">
      <h2 className="text-lg font-bold text-[#9B4017]">
        Gagal Memuat Halaman Portal Admin
      </h2>
      <p className="text-sm text-[#6B7263]">
        {error?.message ||
          "Terjadi kesalahan saat memproses data portal admin. Silakan coba lagi."}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#557029] hover:bg-[#465D21] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          Muat Ulang
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-[#8A947D] px-4 py-2 text-xs font-semibold text-[#2C3325] hover:bg-[#F7F8F2]"
        >
          Dashboard Admin
        </Link>
      </div>
    </div>
  );
}
