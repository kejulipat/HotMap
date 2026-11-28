"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState("");
  const [state, dispatch, isPending] = useActionState(registerAction, null);

  const activeError = clientError || state?.error;

  function handleSubmit(e) {
    setClientError("");
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (fullName.length < 2) {
      e.preventDefault();
      setClientError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.preventDefault();
      setClientError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 6) {
      e.preventDefault();
      setClientError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Konfirmasi kata sandi tidak cocok.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-[#DCE0D5] bg-white/95 backdrop-blur-sm p-6 sm:p-8 hm-floating-card space-y-6">
        <div className="space-y-1.5">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#557029]">
            Registrasi Pelapor
          </span>
          <h1 className="text-2xl font-bold text-[#2C3325]">
            Buat Akun HotMap
          </h1>
          <p className="text-sm text-[#6B7263]">
            Pendaftaran publik otomatis terdaftar sebagai <strong className="text-[#2C3325]">Pelapor</strong> untuk mengirim dan memantau laporan karhutla.
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

        {state?.success && (
          <div
            role="status"
            className="hm-animate-fade-fast rounded-xl border border-[#C4E2CE] bg-[#EAF5EE] px-4 py-3 text-sm text-[#1F6B41] space-y-2"
          >
            <p>{state.success}</p>
            <Link
              href="/login"
              className="inline-block font-semibold underline"
            >
              Menuju halaman Login &rarr;
            </Link>
          </div>
        )}

        <form
          action={dispatch}
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="reg-fullname"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Nama Lengkap
            </label>
            <input
              id="reg-fullname"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              disabled={isPending}
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2.5 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="nama@contoh.id"
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2.5 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isPending}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2.5 pr-20 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isPending}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#6B7263] hover:bg-[#EEF2E4] hover:text-[#557029] cursor-pointer"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-xs font-semibold text-[#4A5243] mb-1.5"
            >
              Konfirmasi Kata Sandi
            </label>
            <input
              id="reg-confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={isPending}
              placeholder="Ulangi kata sandi"
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3.5 py-2.5 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#557029] hover:bg-[#465D21] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
          >
            {isPending ? "Mendaftarkan..." : "Daftar sebagai Pelapor"}
          </button>
        </form>

        <p className="text-center text-xs text-[#6B7263]">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#557029] hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
