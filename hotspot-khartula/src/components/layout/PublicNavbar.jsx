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
      {/* Top Utility Bar */}
      <div className="w-full bg-[#557029] border-t-2 border-[#6F8E3D] text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-9 flex items-center justify-end gap-4 text-[12px] font-medium">
          <span className="truncate">
            Posko Pemantauan Karhutla Indonesia &bull; Layanan Pelaporan Warga 24/7 &bull; siaga@hotmap.id
          </span>
        </div>
      </div>

      {/* Main Editorial Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#DCE0D5]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          {/* Brand Logo + Tagline */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <BrandLogo size={40} />
            <div>
              <span className="block font-serif text-[20px] font-bold leading-none tracking-tight text-[#2C3325]">
                HotMap
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-[#6B7263]">
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
                  className={`rounded-[4px] px-3.5 py-2 transition-colors ${
                    active
                      ? "border border-[#8A947D] bg-[#F7F8F2] text-[#2C3325] font-semibold"
                      : "border border-transparent text-[#2C3325] hover:bg-[#F7F8F2] hover:text-[#557029]"
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
                  className={`rounded-[4px] px-3.5 py-2 transition-colors ${
                    isActive(dashboardTarget.href)
                      ? "border border-[#8A947D] bg-[#F7F8F2] text-[#2C3325] font-semibold"
                      : "border border-transparent text-[#2C3325] hover:bg-[#F7F8F2] hover:text-[#557029]"
                  }`}
                >
                  {dashboardTarget.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="rounded-[4px] border border-transparent px-3.5 py-2 text-[#6B7263] hover:border-[#DCE0D5] hover:bg-[#F7F8F2] hover:text-[#2C3325] transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-[4px] px-3.5 py-2 transition-colors ${
                    isActive("/login")
                      ? "border border-[#8A947D] bg-[#F7F8F2] text-[#2C3325] font-semibold"
                      : "border border-transparent text-[#2C3325] hover:bg-[#F7F8F2] hover:text-[#557029]"
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={`rounded-[4px] px-3.5 py-2 transition-colors ${
                    isActive("/register")
                      ? "border border-[#8A947D] bg-[#F7F8F2] text-[#2C3325] font-semibold"
                      : "border border-transparent text-[#2C3325] hover:bg-[#F7F8F2] hover:text-[#557029]"
                  }`}
                >
                  Daftar
                </Link>
              </>
            )}

            {currentUser?.role !== "petugas" && (
              <Link
                href="/pelapor/laporan/buat"
                className="ml-2 inline-flex items-center justify-center rounded-full bg-[#557029] hover:bg-[#465D21] px-5 py-2 text-[13px] font-semibold text-white transition-colors"
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
            className="lg:hidden inline-flex items-center justify-center rounded-[4px] border border-[#8A947D] bg-white p-2 text-[#2C3325] hover:bg-[#F7F8F2] cursor-pointer"
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
          <div className="lg:hidden border-t border-[#DCE0D5] bg-white px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-[4px] px-3.5 py-2.5 text-sm font-medium ${
                    active
                      ? "border border-[#8A947D] bg-[#F7F8F2] text-[#2C3325] font-semibold"
                      : "text-[#2C3325] hover:bg-[#F7F8F2]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#DCE0D5] space-y-2">
              {currentUser ? (
                <>
                  <Link
                    href={dashboardTarget.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-[4px] bg-[#EEF2E4] px-3.5 py-2.5 text-sm font-semibold text-[#2C3325]"
                  >
                    {dashboardTarget.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="w-full text-left rounded-[4px] px-3.5 py-2.5 text-sm font-medium text-[#9B4017] hover:bg-[#FDF2EA] cursor-pointer"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center rounded-[4px] border px-3 py-2.5 text-sm font-semibold ${
                      isActive("/login")
                        ? "border-[#557029] bg-[#EEF2E4] text-[#2C3325]"
                        : "border-[#8A947D] text-[#2C3325]"
                    }`}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center rounded-[4px] border px-3 py-2.5 text-sm font-semibold ${
                      isActive("/register")
                        ? "border-[#557029] bg-[#EEF2E4] text-[#2C3325]"
                        : "border-[#8A947D] text-[#2C3325]"
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
                  className="block text-center rounded-full bg-[#557029] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#465D21]"
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
