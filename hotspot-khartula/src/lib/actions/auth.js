"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ROLE_HOME,
  isPathAllowedForRole,
  normalizeRole,
} from "@/lib/auth";

function mapAuthError(message) {
  const msg = String(message ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) {
    return "Email atau kata sandi salah.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email akun belum dikonfirmasi. Silakan cek kotak masuk email Anda.";
  }
  if (msg.includes("user already registered") || msg.includes("already exists")) {
    return "Email tersebut sudah terdaftar. Silakan gunakan halaman Login.";
  }
  if (msg.includes("password")) {
    return "Kata sandi tidak memenuhi persyaratan keamanan (minimal 6 karakter).";
  }
  return message || "Terjadi kesalahan autentikasi. Silakan coba lagi.";
}

export async function loginAction(_prevState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Masukkan alamat email yang valid." };
  }
  if (!password) {
    return { error: "Kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    return { error: mapAuthError(error?.message) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);
  const destination = isPathAllowedForRole(redirectTo, role)
    ? redirectTo
    : ROLE_HOME[role] ?? "/pelapor";

  redirect(destination);
}

export async function registerAction(_prevState, formData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (fullName.length < 2) {
    return { error: "Nama lengkap minimal 2 karakter." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Masukkan alamat email yang valid." };
  }
  if (password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }
  if (password !== confirmPassword) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  // Trigger DB `on_auth_user_created` (`public.handle_new_user`) otomatis membuat profil `pelapor`.
  if (data?.session && data?.user) {
    redirect("/pelapor");
  }

  return {
    success:
      "Registrasi berhasil! Jika verifikasi email diaktifkan, silakan cek email Anda sebelum masuk melalui halaman Login.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
