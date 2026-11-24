"use client";

import Link from "next/link";

export default function PetugasError({ error, reset }) {
  return (
    <div className="rounded-2xl border border-[#E5B8A7] bg-white p-6 shadow-2xs space-y-4 max-w-xl">
      <h2 className="text-lg font-bold text-[#9B4017]">
        Gagal Memuat Halaman Portal Petugas
      </h2>
      <p className="text-sm text-[#606F67]">
        {error?.message ||
          "Terjadi kesalahan saat memuat data operasional petugas. Silakan coba lagi."}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#155E42] hover:bg-[#114B35] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          Muat Ulang
        </button>
        <Link
          href="/petugas"
          className="rounded-lg border border-[#DCE2DA] px-4 py-2 text-xs font-semibold text-[#14231B] hover:bg-[#F6F7F3]"
        >
          Dashboard Petugas
        </Link>
      </div>
    </div>
  );
}
