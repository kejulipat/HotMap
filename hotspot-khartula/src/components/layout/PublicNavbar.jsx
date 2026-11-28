"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import BrandLogo from "@/components/ui/BrandLogo";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ROLE_DASHBOARD = {
  admin: { href: "/admin", label: "Dashboard Admin" },
  petugas: { href: "/petugas", label: "Dashboard Petugas" },
  pelapor: { href: "/pelapor", label: "Dashboard Pelapor" },
};

export default function PublicNavbar({ currentUser = null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/peta", label: "Peta Karhutla" },
    { href: "/berita", label: "Berita" },
  ];

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const dashboardTarget = currentUser?.role
    ? ROLE_DASHBOARD[currentUser.role] ?? ROLE_DASHBOARD.pelapor
    : null;

  function handleConfirmLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <>
      {/* Main Editorial Navbar (Semi-Transparan Hijau Hutan Gelap) */}
      <header className="sticky top-0 z-30 bg-[#243314]/88 backdrop-blur-md border-b border-white/15 text-white shadow-sm">
        <div className="mx-auto max-w-300 px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo + Tagline */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <BrandLogo size={40} />
            <div>
              <span className="block font-serif text-[20px] font-bold leading-none tracking-tight text-white">
                HotMap
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-white/80">
                SIPKARHUTLA &bull; Web GIS Karhutla
              </span>
            </div>
          </Link>

          {/* Desktop Horizontal Navigation (up to 6 links) */}
          <nav
            aria-label="Navigasi utama"
            className="hidden lg:flex items-center gap-1.5 text-[14px] font-medium"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`rounded-sm px-3.5 py-2 transition-colors ${
                    active
                      ? "border border-white/40 bg-white/18 text-white font-semibold"
                      : "border border-transparent text-white/90 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {currentUser ? (
              <>
                <Link
                  href={dashboardTarget.href}
                  className={`rounded-sm px-3.5 py-2 transition-colors ${
                    isActive(dashboardTarget.href)
                      ? "border border-white/40 bg-white/18 text-white font-semibold"
                      : "border border-transparent text-white/90 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {dashboardTarget.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="rounded-sm border border-transparent px-3.5 py-2 text-white/85 hover:border-white/30 hover:bg-white/12 hover:text-white transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-sm px-3.5 py-2 transition-colors ${
                    isActive("/login")
                      ? "border border-white/40 bg-white/18 text-white font-semibold"
                      : "border border-transparent text-white/90 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={`rounded-sm px-3.5 py-2 transition-colors ${
                    isActive("/register")
                      ? "border border-white/40 bg-white/18 text-white font-semibold"
                      : "border border-transparent text-white/90 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  Daftar
                </Link>
              </>
            )}

            {currentUser?.role !== "petugas" && (
              <Link
                href="/pelapor/laporan/buat"
                className="ml-2 inline-flex items-center justify-center rounded-full bg-white hover:bg-[#F7F8F2] px-5 py-2 text-[13px] font-semibold text-[#3F561E] shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Laporkan
              </Link>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center rounded-sm border border-white/35 bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileOpen && (
          <div className="hm-animate-fade-fast lg:hidden border-t border-white/15 bg-[#1E2B11]/95 backdrop-blur-md px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-sm px-3.5 py-2.5 text-sm font-medium ${
                    active
                      ? "border border-white/35 bg-white/18 text-white font-semibold"
                      : "text-white/90 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-white/15 space-y-2">
              {currentUser ? (
                <>
                  <Link
                    href={dashboardTarget.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-sm bg-white/15 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    {dashboardTarget.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="w-full text-left rounded-sm px-3.5 py-2.5 text-sm font-medium text-[#FFD9CC] hover:bg-white/10 cursor-pointer"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center rounded-sm border px-3 py-2.5 text-sm font-semibold ${
                      isActive("/login")
                        ? "border-white/50 bg-white/20 text-white"
                        : "border-white/30 text-white/95 hover:bg-white/10"
                    }`}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center rounded-sm border px-3 py-2.5 text-sm font-semibold ${
                      isActive("/register")
                        ? "border-white/50 bg-white/20 text-white"
                        : "border-white/30 text-white/95 hover:bg-white/10"
                    }`}
                  >
                    Daftar
                  </Link>
                </div>
              )}

              {currentUser?.role !== "petugas" && (
                <Link
                  href="/pelapor/laporan/buat"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#3F561E] hover:bg-[#F7F8F2]"
                >
                  Laporkan Kejadian
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <ConfirmDialog
        open={confirmLogout}
        title="Keluar dari HotMap?"
        message="Sesi login Anda akan diakhiri dan Anda akan diarahkan ke halaman login."
        confirmLabel="Ya, Keluar"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmLogout(false)}
        isPending={isPending}
      />
    </>
  );
}
