import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "Beranda Pemantauan" },
  { href: "/peta", label: "Peta Karhutla Interaktif" },
  { href: "/berita", label: "Berita & Peringatan Dini" },
  { href: "/pelapor/laporan/buat", label: "Buat Laporan Kejadian" },
  { href: "/login", label: "Masuk Portal Sistem" },
  { href: "/register", label: "Daftar Akun Pelapor" },
];

export default function PublicFooter() {
  return (
    <footer className="relative mt-auto bg-[#4E6733] text-white overflow-hidden">
      {/*
        PLACEHOLDER TEKSTUR LATAR FOOTER (siap diganti):
        Untuk menambahkan tekstur foto dedaunan tipis di latar footer, aktifkan elemen berikut
        dan simpan aset foto pada `public/images/footer-foliage.jpg`:
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('/images/footer-foliage.jpg')" }}
        />
      */}

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Kolom Kiri: Daftar Tautan Berikon Kecil */}
          <div className="space-y-4">
            <h2 className="font-serif text-[18px] font-semibold text-white">
              Navigasi Sistem
            </h2>
            <ul className="space-y-2.5 text-[14px]">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2.5 text-white/90 hover:text-white transition-colors"
                  >
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-[#D7E3C3]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom Tengah: Ringkasan Editorial + Grid Ikon Kanal */}
          <div className="space-y-4">
            <h2 className="font-serif text-[18px] font-semibold text-white">
              HotMap (SIPKARHUTLA)
            </h2>
            <p className="text-[14px] leading-relaxed text-white/85">
              Platform Web GIS operasional untuk pelaporan masyarakat, verifikasi posko,
              penugasan petugas lapangan, dan pemantauan penanganan kebakaran hutan serta
              lahan secara transparan di seluruh wilayah Indonesia.
            </p>

            <div className="pt-1 flex items-center gap-2.5">
              <Link
                href="/peta"
                aria-label="Buka Peta Karhutla"
                title="Peta Karhutla"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#4E6733] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2.2" />
                </svg>
              </Link>
              <Link
                href="/berita"
                aria-label="Baca Berita Karhutla"
                title="Berita & Informasi"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#4E6733] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 5h16v14H4z" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </Link>
              <Link
                href="/pelapor/laporan/buat"
                aria-label="Buat Laporan Kejadian"
                title="Buat Laporan"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#4E6733] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
              <a
                href="https://github.com/kejulipat/HotMap"
                target="_blank"
                rel="noreferrer"
                aria-label="Repositori GitHub HotMap"
                title="GitHub HotMap"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#4E6733] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>
          </div>

          {/* Kolom Kanan: Pencarian Berita + Info Kontak + Akses Cepat */}
          <div className="space-y-4">
            <h2 className="font-serif text-[18px] font-semibold text-white">
              Cari Informasi &amp; Kontak
            </h2>

            <form action="/berita" method="get" className="flex items-stretch">
              <label htmlFor="footer-search-berita" className="sr-only">
                Cari berita dan informasi karhutla
              </label>
              <input
                id="footer-search-berita"
                name="q"
                type="search"
                placeholder="Cari berita atau wilayah..."
                className="w-full rounded-l-[4px] border border-white bg-white px-3.5 py-2 text-[14px] text-[#2C3325] placeholder:text-[#6B7263] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Cari berita"
                className="inline-flex items-center justify-center rounded-r-[4px] bg-[#6F8E3D] hover:bg-[#557029] px-3.5 text-white transition-colors cursor-pointer"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </form>

            <div className="space-y-1 text-[13px] text-white/90">
              <p className="font-semibold text-white">Posko Pemantauan Karhutla</p>
              <p>Cakupan: Seluruh Wilayah Indonesia</p>
              <p>Surel Operasional: siaga@hotmap.id</p>
            </div>

            <div className="pt-1">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-4 py-2 text-[12px] font-semibold text-white hover:bg-white hover:text-[#4E6733] transition-colors"
              >
                Bergabung sebagai Pelapor &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-white/80">
          <p>&copy; {new Date().getFullYear()} HotMap (SIPKARHUTLA). Web GIS Operasional Karhutla.</p>
          <p>Titik peta merupakan laporan masyarakat terverifikasi, bukan deteksi hotspot satelit.</p>
        </div>
      </div>
    </footer>
  );
}
