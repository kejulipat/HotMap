import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
 */
export async function getCurrentUserWithRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, wilayah_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);

  return {
    supabase,
    user,
    profile: profile ?? null,
    role,
  };
}

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

export function isFastLoginEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return process.env.ENABLE_FAST_LOGIN !== "false";
  }
  return process.env.ENABLE_FAST_LOGIN === "true";
}

const DEMO_ENV_MAP = {
  admin: ["DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD"],
  petugas: ["DEMO_PETUGAS_EMAIL", "DEMO_PETUGAS_PASSWORD"],
  pelapor: ["DEMO_PELAPOR_EMAIL", "DEMO_PELAPOR_PASSWORD"],
};

export function getDemoCredentialsForRole(targetRole) {
  const pair = DEMO_ENV_MAP[targetRole];
  if (!pair) return null;
  const email = process.env[pair[0]]?.trim() ?? "";
  const password = process.env[pair[1]]?.trim() ?? "";
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Mengembalikan hanya status ketersediaan (boolean) ke UI tanpa pernah mengekspos kredensial.
 */
export function getFastLoginAvailability() {
  const enabled = isFastLoginEnabled();
  return {
    enabled,
    roles: {
      admin: Boolean(getDemoCredentialsForRole("admin")),
      petugas: Boolean(getDemoCredentialsForRole("petugas")),
      pelapor: Boolean(getDemoCredentialsForRole("pelapor")),
    },
  };
}
