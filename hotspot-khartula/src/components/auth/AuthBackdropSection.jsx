import Image from "next/image";

/**
 * Latar foto penuh WebP bernuansa organik-editorial untuk halaman Masuk & Daftar
 * dengan animasi drift halus dan overlay gelap agar kartu form tetap nyaman dibaca.
 */
export default function AuthBackdropSection({ children }) {
  return (
    <section className="relative flex-1 w-full min-h-[calc(100dvh-72px)] flex items-center justify-center overflow-hidden bg-[#1D2716] px-4 sm:px-6 py-10 sm:py-14">
      <Image
        src="/images/auth-forest-fire.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center hm-animate-bg-drift"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-br from-[#172111]/78 via-[#212E18]/62 to-[#2B2014]/70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-[#131B0E]/68 via-transparent to-[#131B0E]/45"
      />

      <div className="relative z-10 w-full hm-animate-scale-in">
        {children}
      </div>
    </section>
  );
}
