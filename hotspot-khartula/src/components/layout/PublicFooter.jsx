import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-[#E3E8E1] bg-[#F6F7F3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7A71]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#14231B]">HotMap (SIPKARHUTLA)</span>
          <span>&bull; Web GIS Operasional Karhutla</span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-5">
          <Link href="/" className="hover:text-[#14231B] transition-colors">
            Beranda
          </Link>
          <Link href="/peta" className="hover:text-[#14231B] transition-colors">
            Peta Karhutla
          </Link>
          <Link href="/berita" className="hover:text-[#14231B] transition-colors">
            Berita
          </Link>
          <Link href="/login" className="hover:text-[#14231B] transition-colors">
            Login
          </Link>
          <Link href="/register" className="hover:text-[#14231B] transition-colors">
            Registrasi
          </Link>
        </nav>
      </div>
    </footer>
  );
}
