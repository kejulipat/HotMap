"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import BrandLogo from "@/components/ui/BrandLogo";
import { Breadcrumb } from "@/components/ui/SharedUI";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function MenuIcon({ name, className = "h-4 w-4 shrink-0" }) {
  switch (name) {
    case "home":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        </svg>
      );
    case "map":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5h6M9 10h6M9 14h6M9 18h4" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.85" />
          <path d="M16 3.2a3.5 3.5 0 0 1 0 6.6" />
        </svg>
      );
    case "pin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case "news":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "user":
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
  }
}

const ROLE_MENU_GROUPS = {
  pelapor: [
    {
      heading: null,
      items: [{ href: "/pelapor", label: "Dashboard", icon: "home" }],
    },
    {
      heading: "Pelaporan",
      items: [
        { href: "/pelapor/laporan/buat", label: "Buat Laporan", icon: "plus" },
        { href: "/pelapor/laporan", label: "Laporan Saya", icon: "clipboard" },
      ],
    },
    {
      heading: "Akun",
      items: [{ href: "/pelapor/profil", label: "Profil Saya", icon: "user" }],
    },
  ],
  petugas: [
    {
      heading: null,
      items: [{ href: "/petugas", label: "Dashboard", icon: "home" }],
    },
    {
      heading: "Operasional",
      items: [
        { href: "/petugas/laporan", label: "Daftar Laporan", icon: "clipboard" },
        { href: "/petugas/peta", label: "Peta Operasional", icon: "map" },
      ],
    },
    {
      heading: "Akun",
      items: [{ href: "/petugas/profil", label: "Profil Saya", icon: "user" }],
    },
  ],
  admin: [
    {
      heading: null,
      items: [{ href: "/admin", label: "Dashboard", icon: "home" }],
    },
    {
      heading: "Operasional",
      items: [
        { href: "/admin/peta", label: "Monitoring Peta", icon: "map" },
        { href: "/admin/laporan", label: "Manajemen Laporan", icon: "clipboard" },
      ],
    },
    {
      heading: "Manajemen & Sistem",
      items: [
        { href: "/admin/pengguna", label: "Manajemen Pengguna", icon: "users" },
        { href: "/admin/wilayah", label: "Manajemen Wilayah", icon: "pin" },
        { href: "/admin/berita", label: "Manajemen Berita", icon: "news" },
        { href: "/admin/pengaturan", label: "Pengaturan", icon: "settings" },
      ],
    },
  ],
};

const ROLE_QUICK_ACTION = {
  admin: { href: "/admin/peta", label: "Monitoring Peta", icon: "map" },
  petugas: { href: "/petugas/peta", label: "Peta Operasional", icon: "map" },
  pelapor: { href: "/pelapor/laporan/buat", label: "Buat Laporan", icon: "plus" },
};

const ROLE_BADGE = {
  admin: { label: "Admin", cls: "bg-[#FDEEE9] text-[#9B3417] border-[#F0C1B0]" },
  petugas: { label: "Petugas", cls: "bg-[#EBF4FF] text-[#1A559E] border-[#BFD8F5]" },
  pelapor: { label: "Pelapor", cls: "bg-[#EEF2E4] text-[#3F561E] border-[#C9D6B5]" },
};

const SEGMENT_LABELS = {
  admin: "Dashboard Admin",
  petugas: "Dashboard Petugas",
  pelapor: "Dashboard Pelapor",
  laporan: "Laporan",
  buat: "Buat Laporan",
  peta: "Peta",
  pengguna: "Manajemen Pengguna",
  wilayah: "Manajemen Wilayah",
  berita: "Manajemen Berita",
  pengaturan: "Pengaturan",
  profil: "Profil",
  "test-db": "Tes Database",
};

function buildBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const items = [{ label: "Beranda", href: "/" }];
  let currentPath = "";

  segments.forEach((seg, idx) => {
    currentPath += `/${seg}`;
    const label =
      SEGMENT_LABELS[seg] ??
      (idx === segments.length - 1 ? `Detail (${seg.slice(0, 8)})` : seg);
    items.push({
      label,
      href: idx < segments.length - 1 ? currentPath : null,
    });
  });

  return items;
}

export default function DashboardShell({
  role = "pelapor",
  actualRole = null,
  userInfo = {},
  children,
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isPending, startTransition] = useTransition();

  const menuGroups = ROLE_MENU_GROUPS[role] ?? ROLE_MENU_GROUPS.pelapor;
  const flatItems = menuGroups.flatMap((group) => group.items);
  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.pelapor;
  const quickAction = ROLE_QUICK_ACTION[role] ?? ROLE_QUICK_ACTION.pelapor;
  const breadcrumbs = buildBreadcrumbs(pathname);

  const activeHref = flatItems.reduce((best, item) => {
    const matched =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matched) return best;
    return !best || item.href.length > best.length ? item.href : best;
  }, null);

  const profileHref =
    role === "admin" ? "/admin/pengaturan" : `/${role}/profil`;

  const displayName = userInfo.fullName || userInfo.email || "Pengguna HotMap";

  function handleConfirmLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F8F2] text-[#2C3325] flex font-sans">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Dark Forest Olive Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#1E2B11] text-white border-r border-white/10 flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-3 min-w-0 group">
            <BrandLogo size={36} />
            <div className="min-w-0">
              <span className="block font-serif text-[17px] font-bold tracking-wide text-white leading-none">
                HOTMAP
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D4B95E] truncate">
                Portal {badge.label}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
            className="lg:hidden rounded-sm p-1.5 text-white/75 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            &#10005;
          </button>
        </div>

        {/* Grouped Navigation Menu */}
        <nav
          aria-label="Menu Dashboard"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
        >
          {menuGroups.map((group, groupIdx) => (
            <div key={group.heading ?? `top-${groupIdx}`} className="space-y-1">
              {group.heading && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {group.heading}
                </p>
              )}

              {group.items.map((item) => {
                const active = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] transition-all duration-150 ${
                      active
                        ? "bg-white/12 text-white font-semibold shadow-2xs"
                        : "text-white/75 font-medium hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <MenuIcon
                        name={item.icon}
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active
                            ? "text-[#D4B95E]"
                            : "text-white/60 group-hover:text-white/90"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="h-4 w-1 shrink-0 rounded-full bg-[#D4B95E]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Identity & Public Return Links */}
        <div className="border-t border-white/10 px-4 py-3.5 space-y-3 shrink-0 bg-[#18230D]/70">
          {actualRole === "admin" && role !== "admin" && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className="block rounded-lg border border-[#D4B95E]/40 bg-[#D4B95E]/15 px-3 py-2 text-center text-xs font-semibold text-[#F4E3A8] hover:bg-[#D4B95E]/25 transition-colors"
            >
              &larr; Kembali ke Portal Admin
            </Link>
          )}

          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[#D4B95E]">
              <MenuIcon name="user" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white leading-tight truncate">
                {displayName}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[#C9D98B] truncate">
                {badge.label} &bull; SIPKARHUTLA
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/75 hover:text-white transition-colors"
            >
              <span>Kembali ke situs publik</span>
            </Link>
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="font-semibold text-[#F7B29B] hover:text-[#FFD6C7] transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean White Top Header */}
        <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-[#DCE0D5] px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu sidebar"
              className="lg:hidden rounded-lg border border-[#DCE0D5] bg-[#F7F8F2] p-2 text-[#2C3325] hover:border-[#8A947D] hover:bg-[#EEF2E4] cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="truncate">
              <Breadcrumb items={breadcrumbs} />
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Functional Role Quick Action Button */}
            <Link
              href={quickAction.href}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#1E2B11] hover:bg-[#2C3E19] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <MenuIcon name={quickAction.icon} className="h-3.5 w-3.5 text-[#D4B95E]" />
              <span>{quickAction.label}</span>
            </Link>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                className="flex items-center gap-2.5 rounded-lg border border-transparent hover:border-[#DCE0D5] hover:bg-[#F7F8F2] px-2 py-1.5 text-left transition-colors cursor-pointer"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E2B11] text-[#D4B95E] shadow-2xs">
                  <MenuIcon name="user" className="h-4 w-4" />
                </span>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-[#2C3325] leading-tight max-w-40 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-[#6B7263] truncate max-w-40">
                    {badge.label}
                    {userInfo.email ? ` • ${userInfo.email}` : ""}
                  </p>
                </div>
                <svg
                  className={`h-3.5 w-3.5 text-[#6B7263] transition-transform duration-200 ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className="hm-animate-fade-fast absolute right-0 mt-2 w-60 rounded-xl border border-[#DCE0D5] bg-white p-1.5 shadow-lg z-40">
                  <div className="px-3 py-2.5 border-b border-[#DCE0D5] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#2C3325] truncate">
                        {displayName}
                      </p>
                      <span
                        className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {userInfo.email && (
                      <p className="text-[11px] text-[#6B7263] truncate">
                        {userInfo.email}
                      </p>
                    )}
                  </div>

                  <Link
                    href={profileHref}
                    onClick={() => setProfileMenuOpen(false)}
                    className="mt-1 block rounded-lg px-3 py-2 text-xs font-medium text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                  >
                    {role === "admin" ? "Pengaturan Aplikasi" : "Profil Saya"}
                  </Link>

                  {role === "admin" && (
                    <Link
                      href="/test-db"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-xs font-medium text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                    >
                      Tes Koneksi Database
                    </Link>
                  )}

                  <Link
                    href="/"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                  >
                    Kembali ke Situs Publik
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="mt-1 w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-[#9B3417] hover:bg-[#FDF2EA] cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-300 w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Keluar dari HotMap?"
        message="Sesi Anda akan diakhiri. Anda harus masuk kembali untuk mengakses halaman operasional."
        confirmLabel="Ya, Keluar"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmLogout(false)}
        isPending={isPending}
      />
    </div>
  );
}
