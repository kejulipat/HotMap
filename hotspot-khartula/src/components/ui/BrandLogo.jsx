import Image from "next/image";

/**
 * Reusable brand logo mark for HotMap (SIPKARHUTLA) navbars and headers.
 */
export default function BrandLogo({ size = 40, className = "" }) {
  return (
    <Image
      src="/images/hotmap-logo.svg"
      alt="Logo HotMap"
      width={size}
      height={size}
      priority
      className={`shrink-0 transition-transform duration-200 group-hover:scale-[1.03] ${className}`.trim()}
    />
  );
}
