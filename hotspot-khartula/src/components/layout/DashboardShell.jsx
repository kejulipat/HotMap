"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { Breadcrumb } from "@/components/ui/SharedUI";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ROLE_MENUS = {
  pelapor: [
    { href: "/pelapor", label: "Dashboard" },
    { href: "/pelapor/laporan/buat", label: "Buat Laporan" },
    { href: "/pelapor/laporan", label: "Laporan Saya" },
    { href: "/pelapor/profil", label: "Profil" },
  ],
  petugas: [
    { href: "/petugas", label: "Dashboard" },
    { href: "/petugas/laporan", label: "Daftar Laporan" },
    { href: "/petugas/peta", label: "Peta Operasional" },
    { href: "/petugas/profil", label: "Profil" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/peta", label: "Monitoring Peta" },
    { href: "/admin/laporan", label: "Manajemen Laporan" },
    { href: "/admin/pengguna", label: "Manajemen Pengguna" },
    { href: "/admin/wilayah", label: "Manajemen Wilayah" },
    { href: "/admin/berita", label: "Manajemen Berita" },
    { href: "/admin/pengaturan", label: "Pengaturan" },
  ],
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
      SEGMENT_LABELS[seg] ?? (idx === segments.length - 1 ? `Detail (${seg.slice(0, 8)})` : seg);
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

  const menuItems = ROLE_MENUS[role] ?? ROLE_MENUS.pelapor;
  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.pelapor;
  const breadcrumbs = buildBreadcrumbs(pathname);

  const activeHref = menuItems.reduce((best, item) => {
    const matched =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matched) return best;
    return !best || item.href.length > best.length ? item.href : best;
  }, null);

  const profileHref =
    role === "admin" ? "/admin/pengaturan" : `/${role}/profil`;

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
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white border-r border-[#DCE0D5] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-[72px] px-5 border-b border-[#DCE0D5] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[8px] border border-[#DCE0D5] bg-[#F7F8F2] flex items-center justify-center text-[#6F8E3D]">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3L6 12h4l-3 7h10l-3-7h4L12 3z" />
              </svg>
            </div>
            <div>
              <span className="block font-serif text-[17px] font-bold text-[#2C3325] leading-tight">
                HotMap
              </span>
              <span className="block text-[11px] font-medium text-[#6B7263]">
                Portal {badge.label}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
            className="lg:hidden rounded-[4px] p-1.5 text-[#6B7263] hover:bg-[#F7F8F2] cursor-pointer"
          >
            &#10005;
          </button>
        </div>

        <nav aria-label="Menu Dashboard" className="flex-1 overflow-y-auto p-3.5 space-y-1">
          {menuItems.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between rounded-[6px] px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                  active
                    ? "bg-[#557029] text-white"
                    : "text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                }`}
              >
                <span>{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#DCE0D5] p-3.5 space-y-2">
          {actualRole === "admin" && role !== "admin" && (
            <Link
              href="/admin"
              className="block rounded-full border border-[#557029] bg-[#EEF2E4] px-3.5 py-2 text-center text-xs font-semibold text-[#3F561E] hover:bg-[#E1E9D2] transition-colors"
            >
              Kembali ke Portal Admin
            </Link>
          )}
          <Link
            href="/"
            className="block rounded-full border border-[#8A947D] bg-white px-3.5 py-2 text-center text-xs font-semibold text-[#2C3325] hover:bg-[#F7F8F2] transition-colors"
          >
            Lihat Beranda Publik
          </Link>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="w-full rounded-full border border-[#E5B8A7] bg-[#FDF2EA] px-3.5 py-2 text-xs font-semibold text-[#9B3417] hover:bg-[#FDE3D5] transition-colors cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-[72px] bg-white/95 backdrop-blur border-b border-[#DCE0D5] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu sidebar"
              className="lg:hidden rounded-[4px] border border-[#8A947D] p-2 text-[#2C3325] hover:bg-[#F7F8F2] cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="truncate">
              <Breadcrumb items={breadcrumbs} />
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              className="flex items-center gap-2.5 rounded-[8px] border border-[#DCE0D5] bg-[#F7F8F2] px-3 py-1.5 text-left hover:border-[#8A947D] transition-colors cursor-pointer"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-[#2C3325] leading-tight max-w-[160px] truncate">
                  {userInfo.fullName || userInfo.email || "Pengguna"}
                </p>
                <p className="text-[11px] text-[#6B7263] truncate max-w-[160px]">
                  {userInfo.email}
                </p>
              </div>
              <span
                className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}
              >
                {badge.label}
              </span>
              <svg
                className="h-3.5 w-3.5 text-[#6B7263]"
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
              <div className="absolute right-0 mt-2 w-56 rounded-[8px] border border-[#DCE0D5] bg-white p-1.5 shadow-md z-40">
                <div className="px-3 py-2 border-b border-[#DCE0D5]">
                  <p className="text-xs font-bold text-[#2C3325] truncate">
                    {userInfo.fullName || "Pengguna HotMap"}
                  </p>
                  <p className="text-[11px] text-[#6B7263] truncate">
                    {userInfo.email}
                  </p>
                </div>

                <Link
                  href={profileHref}
                  onClick={() => setProfileMenuOpen(false)}
                  className="mt-1 block rounded-[4px] px-3 py-2 text-xs font-medium text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                >
                  {role === "admin" ? "Pengaturan Aplikasi" : "Profil Saya"}
                </Link>

                {role === "admin" && (
                  <Link
                    href="/test-db"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block rounded-[4px] px-3 py-2 text-xs font-medium text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                  >
                    Tes Koneksi Database
                  </Link>
                )}

                <Link
                  href="/"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block rounded-[4px] px-3 py-2 text-xs font-medium text-[#2C3325] hover:bg-[#EEF2E4] hover:text-[#465D21]"
                >
                  Beranda Publik
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="mt-1 w-full text-left rounded-[4px] px-3 py-2 text-xs font-semibold text-[#9B3417] hover:bg-[#FDF2EA] cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
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
