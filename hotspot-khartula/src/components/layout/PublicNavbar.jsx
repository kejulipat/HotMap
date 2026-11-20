"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
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
      <header className="sticky top-0 z-30 bg-[#F6F7F3]/95 backdrop-blur border-b border-[#E3E8E1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#155E42] flex items-center justify-center text-white shadow-sm">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3L5 12h4l-3 7h12l-3-7h4L12 3z" />
                <path d="M12 19v3" />
              </svg>
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-[#12241B]">
                HotMap
              </span>
              <span className="block text-[11px] text-[#6B7A71]">
                SIPKARHUTLA &bull; Web GIS Karhutla
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Navigasi utama"
            className="hidden lg:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-2 transition-colors ${
                    active
                      ? "text-[#155E42] font-semibold"
                      : "text-[#5F6F66] hover:text-[#14231B]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#155E42]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth & CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            {currentUser ? (
              <>
                <Link
                  href={dashboardTarget.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D5E2D8] bg-white px-3.5 py-2 text-sm font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-[#155E42]" />
                  {dashboardTarget.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="rounded-lg border border-[#E3E8E1] px-3.5 py-2 text-sm font-medium text-[#5F6F66] hover:bg-white hover:text-[#14231B] transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isActive("/login")
                      ? "bg-[#EAF1EC] text-[#155E42]"
                      : "text-[#4E5E55] hover:bg-white hover:text-[#14231B]"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isActive("/register")
                      ? "border-[#155E42] bg-[#EAF1EC] text-[#155E42]"
                      : "border-[#DCE2DA] bg-white text-[#14231B] hover:border-[#155E42]"
                  }`}
                >
                  Registrasi
                </Link>
              </>
            )}

            {currentUser?.role !== "petugas" && (
              <Link
                href="/pelapor/laporan/buat"
                className="inline-flex items-center justify-center rounded-lg bg-[#C85A28] hover:bg-[#B04B1D] active:bg-[#9B4017] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                Laporkan kebakaran
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center rounded-lg border border-[#DCE2DA] bg-white p-2 text-[#14231B] hover:bg-[#EAF1EC] cursor-pointer"
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
          <div className="lg:hidden border-t border-[#E3E8E1] bg-white px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-[#EAF1EC] text-[#155E42] font-semibold"
                      : "text-[#4E5E55] hover:bg-[#F6F7F3]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#ECEFE9] space-y-2">
              {currentUser ? (
                <>
                  <Link
                    href={dashboardTarget.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg bg-[#EAF1EC] px-3.5 py-2.5 text-sm font-semibold text-[#155E42]"
                  >
                    {dashboardTarget.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="w-full text-left rounded-lg px-3.5 py-2.5 text-sm font-medium text-[#B83E1B] hover:bg-[#FDEEE9] cursor-pointer"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                      isActive("/login")
                        ? "border-[#155E42] bg-[#EAF1EC] text-[#155E42]"
                        : "border-[#DCE2DA] text-[#14231B]"
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                      isActive("/register")
                        ? "border-[#155E42] bg-[#EAF1EC] text-[#155E42]"
                        : "border-[#DCE2DA] text-[#14231B]"
                    }`}
                  >
                    Registrasi
                  </Link>
                </div>
              )}

              {currentUser?.role !== "petugas" && (
                <Link
                  href="/pelapor/laporan/buat"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center rounded-lg bg-[#C85A28] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B04B1D]"
                >
                  Laporkan kebakaran
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
