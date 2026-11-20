import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#F6F7F3] text-[#14231B] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-[#E3E8E1] bg-white p-8 text-center shadow-2xs space-y-4">
        <span className="inline-block rounded-lg bg-[#FDF2EA] px-3 py-1 text-xs font-bold text-[#C85A28]">
          404 &bull; Halaman Tidak Ditemukan
        </span>
        <h1 className="text-2xl font-bold text-[#12241B]">
          Route yang Anda tuju tidak tersedia
        </h1>
        <p className="text-sm text-[#606F67]">
          Periksa kembali alamat halaman atau kembali ke beranda pemantauan karhutla.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-[#155E42] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#114B35] transition-colors"
          >
            Ke Beranda
          </Link>
          <Link
            href="/peta"
            className="rounded-lg border border-[#DCE2DA] bg-white px-4 py-2.5 text-sm font-semibold text-[#14231B] hover:bg-[#F6F7F3] transition-colors"
          >
            Buka Peta Karhutla
          </Link>
        </div>
      </div>
    </main>
  );
}
