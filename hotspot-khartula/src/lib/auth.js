import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AUTH_CACHE_TTL_MS,
  readCachedOrFetch,
} from "@/lib/server-cache";

export const ROLE_HOME = {
  admin: "/admin",
  petugas: "/petugas",
  pelapor: "/pelapor",
};

export const ROLE_LABELS = {
  admin: "Admin",
  petugas: "Petugas",
  pelapor: "Pelapor",
};

const ROLE_ALLOWED_PREFIXES = {
  admin: ["/admin", "/petugas", "/pelapor", "/dashboard", "/test-db"],
  petugas: ["/petugas", "/dashboard"],
  pelapor: ["/pelapor", "/dashboard"],
};

export function normalizeRole(rawRole) {
  const val = rawRole ? String(rawRole).toLowerCase().trim() : "pelapor";
  return ROLE_HOME[val] ? val : "pelapor";
}

export function isPathAllowedForRole(targetPath, role) {
  if (!targetPath || typeof targetPath !== "string") return false;
  if (!targetPath.startsWith("/") || targetPath.startsWith("//") || targetPath.includes("\\")) {
    return false;
  }
  const cleanPath = targetPath.split("?")[0];
  const allowed = ROLE_ALLOWED_PREFIXES[role] ?? [];
  return allowed.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
  );
}

/**
 * Mengambil user Supabase Auth saat ini beserta baris profil & role dari tabel `profiles`.
 * - Jika tidak ada cookie sesi `sb-*`, langsung selesai dalam 0ms tanpa network call.
 * - Jika ada cookie sesi, hasil verifikasi `getUser()` + `profiles` di-cache di memori
 *   server selama 60 detik berdasarkan fingerprint token (dan langsung dihapus saat login/logout).
 */
export const getCurrentUserWithRole = cache(async function getCurrentUserWithRole() {
  const supabase = await createClient();
  const fingerprint = supabase.__authFingerprint;

  if (!fingerprint) {
    supabase.__sessionScope = "anon";
    supabase.__isAuthenticated = false;
    return { supabase, user: null, profile: null, role: null };
  }

  const resolved = await readCachedOrFetch(
    "auth",
    fingerprint,
    AUTH_CACHE_TTL_MS,
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { user: null, profile: null, role: null };
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name, wilayah_id, created_at")
        .eq("id", user.id)
        .maybeSingle();

      const role = normalizeRole(profile?.role);

      return {
        user,
        profile: profile ?? null,
        role,
      };
    },
    (res) => Boolean(res?.user)
  );

  supabase.__isAuthenticated = Boolean(resolved.user);
  supabase.__sessionScope = !resolved.user
    ? "anon"
    : resolved.role === "admin" || resolved.role === "petugas"
    ? "staff"
    : `pelapor:${resolved.user.id}`;

  return {
    supabase,
    user: resolved.user,
    profile: resolved.profile,
    role: resolved.role,
  };
});

/**
 * Penjaga server untuk route dan halaman terproteksi.
 * Tidak boleh hanya mengandalkan middleware atau penyembunyian menu client.
 */
export async function requireRole(allowedRoles = []) {
  const session = await getCurrentUserWithRole();

  if (!session.user) {
    redirect("/login");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    redirect(ROLE_HOME[session.role] ?? "/");
  }

  return session;
}
