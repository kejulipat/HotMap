import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { extractSupabaseAuthFingerprint } from "@/lib/server-cache";

/**
 * Aturan akses route berdasarkan kolom `role` di tabel `profiles`.
 * Key = prefix path, value = daftar role yang diizinkan.
 */
const ROLE_RULES = {
  "/admin": ["admin"],
  "/petugas": ["petugas", "admin"],
  "/pelapor": ["pelapor", "admin"],
  "/dashboard": ["pelapor", "petugas", "admin"],
  "/test-db": ["admin"],
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
  const { pathname } = request.nextUrl;
  const rulePrefix = matchRule(pathname);
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  const allCookies = request.cookies.getAll();
  const fingerprint = extractSupabaseAuthFingerprint(allCookies);

  // 1. Pengunjung belum login (tidak ada cookie sb-*): 0ms fast-path.
  if (!fingerprint) {
    if (!rulePrefix) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirectTo", redirectTarget);
    return NextResponse.redirect(url);
  }

  // 2. Route publik (/, /peta, /berita, /berita/[id]): tidak perlu blokir dengan network call di middleware.
  if (!rulePrefix && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  // 3. Verifikasi sesi & refresh cookie langsung via @supabase/ssr tanpa cache auth lintas-request
  //    agar pencabutan role/sesi langsung efektif dan token sesi selalu segar.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const rawRole = profile?.role
      ? String(profile.role).toLowerCase().trim()
      : "pelapor";
    role = ROLE_HOME[rawRole] ? rawRole : "pelapor";
  }

  // Route auth (/login, /register) tetapi token ternyata sudah tidak valid -> lanjutkan.
  if (!rulePrefix && !user) {
    return response;
  }

  // Route terproteksi tapi token tidak valid -> ke /login.
  if (rulePrefix && !user) {
    const url = request.nextUrl.clone();
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirectTo", redirectTarget);
    return redirectWithCookies(url, response);
  }

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
    // Jalankan di semua route kecuali file statis, service worker, & aset gambar.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
