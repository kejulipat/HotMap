"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { loginAction, fastLoginAction } from "@/lib/actions/auth";

const FAST_ROLES = [
  {
    key: "admin",
    label: "Login sebagai Admin",
    desc: "Kelola laporan, wilayah, berita & pengguna",
    badge: "Admin",
    accent: "border-[#F3C8B8] bg-[#FDF2EA] hover:border-[#C85A28] text-[#9B4017]",
    iconBg: "bg-[#C85A28] text-white",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
      </svg>
    ),
  },
  {
    key: "petugas",
    label: "Login sebagai Petugas",
    desc: "Pantau peta operasional & tindak lanjut laporan",
    badge: "Petugas",
    accent: "border-[#C5DCF8] bg-[#EBF4FF] hover:border-[#2B7FD9] text-[#1E62B5]",
    iconBg: "bg-[#2B7FD9] text-white",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "pelapor",
    label: "Login sebagai Pelapor",
    desc: "Buat laporan kejadian & pantau progres",
    badge: "Pelapor",
    accent: "border-[#C9D6B5] bg-[#EEF2E4] hover:border-[#557029] text-[#3F561E]",
    iconBg: "bg-[#557029] text-white",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function LoginForm({
  redirectTo = "",
  fastLogin = { enabled: false, roles: { admin: false, petugas: false, pelapor: false } },
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState("");
  const [activeFastRole, setActiveFastRole] = useState(null);

  const [loginState, loginDispatch, isLoginPending] = useActionState(
    loginAction,
    null
  );
  const [fastState, fastDispatch, isFastActionPending] = useActionState(
    fastLoginAction,
    null
  );
  const [isTransitionPending, startTransition] = useTransition();

  const isBusy = isLoginPending || isFastActionPending || isTransitionPending;
  const activeError = clientError || fastState?.error || loginState?.error;

  function handleRegularSubmit(e) {
    setClientError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.preventDefault();
      setClientError("Masukkan alamat email yang valid.");
      return;
    }
    if (!password) {
      e.preventDefault();
      setClientError("Kata sandi wajib diisi.");
    }
  }

  function handleFastLogin(roleKey) {
    if (isBusy) return;
    setClientError("");
    setActiveFastRole(roleKey);
    const fd = new FormData();
    fd.set("targetRole", roleKey);
    startTransition(() => {
      fastDispatch(fd);
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="rounded-2xl border border-[#DCE0D5] bg-white/95 backdrop-blur-sm p-6 sm:p-8 hm-floating-card space-y-6">
        <div className="space-y-1.5">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#557029]">
            Autentikasi HotMap
          </span>
          <h1 className="text-2xl font-bold text-[#2C3325]">
            Masuk ke Sistem
          </h1>
          <p className="text-sm text-[#6B7263]">
            Gunakan akun terdaftar untuk mengakses layanan pelaporan atau operasional karhutla.
          </p>
        </div>

        {activeError && (
          <div
            role="alert"
            className="hm-animate-fade-fast rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
          >
            {activeError}
          </div>
        )}

        <form
          action={loginDispatch}
          onSubmit={handleRegularSubmit}
          className="space-y-4"
          noValidate
        >
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isBusy}
              placeholder="nama@contoh.id"
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2.5 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={isBusy}
                placeholder="Masukkan kata sandi"
                className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2.5 pr-20 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isBusy}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#6B7263] hover:bg-[#EEF2E4] hover:text-[#557029] cursor-pointer"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-lg bg-[#557029] hover:bg-[#465D21] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
          >
            {isLoginPending ? "Memproses masuk..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-[#6B7263]">
          Belum memiliki akun pelapor?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#557029] hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>

        {/* Fast Login Section */}
        {fastLogin.enabled && (
          <div className="pt-5 border-t border-[#DCE0D5] space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A5243]">
                Fast Login (Pengujian Role)
              </span>
              <span className="rounded bg-[#F7F8F2] border border-[#DCE0D5] px-2 py-0.5 text-[10px] font-semibold text-[#6B7263]">
                Demo Cepat
              </span>
            </div>

            <div className="space-y-2.5">
              {FAST_ROLES.map((item) => {
                const isConfigured = Boolean(fastLogin.roles?.[item.key]);
                const isThisLoading = isBusy && activeFastRole === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={isBusy || !isConfigured}
                    onClick={() => handleFastLogin(item.key)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${item.accent}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${item.iconBg}`}
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-sm font-bold leading-tight">
                          {isThisLoading ? `Masuk sebagai ${item.badge}...` : item.label}
                        </span>
                        <span className="block text-[11px] opacity-80 truncate">
                          {isConfigured
                            ? item.desc
                            : `Belum dikonfigurasi pada environment server (DEMO_${item.key.toUpperCase()}_*)`}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-bold">
                      {isConfigured ? "Siap" : "Kosong"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
