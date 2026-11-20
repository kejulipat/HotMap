"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export default function LoginForm({ redirectTo = "" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState("");

  const [loginState, loginDispatch, isLoginPending] = useActionState(
    loginAction,
    null
  );

  const isBusy = isLoginPending;
  const activeError = clientError || loginState?.error;

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

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="rounded-2xl border border-[#E3E8E1] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="space-y-1.5">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#155E42]">
            Autentikasi HotMap
          </span>
          <h1 className="text-2xl font-bold text-[#12241B]">
            Masuk ke Sistem
          </h1>
          <p className="text-sm text-[#606F67]">
            Gunakan akun terdaftar untuk mengakses layanan pelaporan atau operasional karhutla.
          </p>
        </div>

        {activeError && (
          <div
            role="alert"
            className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
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
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
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
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
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
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 pr-20 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isBusy}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#5F6F66] hover:bg-[#EAF1EC] hover:text-[#155E42] cursor-pointer"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-lg bg-[#155E42] hover:bg-[#114B35] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoginPending ? "Memproses masuk..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-[#606F67]">
          Belum memiliki akun pelapor?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#155E42] hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
