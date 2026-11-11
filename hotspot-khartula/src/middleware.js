import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Aturan akses route berdasarkan kolom `role` di tabel `profiles`.
 * Key = prefix path, value = daftar role yang diizinkan.
 */
const ROLE_RULES = {
  "/admin": ["admin"],
  "/petugas": ["petugas", "admin"],
  "/pelapor": ["pelapor", "admin"],
  "/dashboard": ["pelapor", "petugas", "admin"],
};

// Halaman auth: user yang sudah login akan diarahkan ke dashboard role-nya.
const AUTH_ROUTES = ["/login", "/register"];

// Halaman default per role setelah login / saat akses ditolak.
const ROLE_HOME = {
  admin: "/admin",
  petugas: "/petugas",
  pelapor: "/pelapor",
};

function matchRule(pathname) {
  return Object.keys(ROLE_RULES).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: jangan taruh logic lain di antara createServerClient dan getUser().
  // getUser() memvalidasi token ke server Supabase sekaligus me-refresh sesi.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const rulePrefix = matchRule(pathname);
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Route publik dan user belum login -> lanjutkan.
  if (!rulePrefix && !(isAuthRoute && user)) {
    return response;
  }

  // Route terproteksi tapi belum login -> ke /login.
  if (rulePrefix && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return redirectWithCookies(url, response);
  }

  // Ambil role user dari tabel profiles.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "pelapor";

  // Sudah login tapi membuka /login atau /register -> ke home role.
  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  // Role tidak diizinkan -> ke home role masing-masing.
  if (!ROLE_RULES[rulePrefix].includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

// Pastikan cookie sesi yang sudah di-refresh ikut terbawa saat redirect.
function redirectWithCookies(url, sourceResponse) {
  const redirect = NextResponse.redirect(url);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export const config = {
  matcher: [
    // Jalankan di semua route kecuali file statis & aset gambar.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

