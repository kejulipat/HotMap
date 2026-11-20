# PREVIEW BRANCH REPORT — `preview/no-fast-login` (HOTMAP)

- **Proyek**: HOTMAP (`hotspot-khartula/`)
- **Tanggal**: 2026-11-20
- **Prinsip**: *Minimal Change — Maximum Preservation*

---

## Ringkasan Status

- **CODE CHANGE**: `PASS`
- **NORMAL LOGIN**: `PASS`
- **RBAC**: `PASS`
- **REGRESSION**: `PASS`
- **GIT BRANCH**: `PASS`
- **ONLINE PREVIEW**: `BLOCKED` *(Branch `preview/no-fast-login` berhasil di-push ke `origin`, namun verifikasi URL Preview online memerlukan penyelesaian penyimpanan Environment Variables `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` pada target `Preview` di Dashboard Vercel)*

---

## 1. Branch Sumber dan Commit SHA

- **Branch Sumber**: `fix/pre-phase-2-readiness` (kondisi Fase 1.5 tervalidasi)
- **Commit SHA Sumber**: `b4e6c3f2aedbd259de6204878ea149f60706ee07` (`b4e6c3f fix(fase-1.5): harden validation, storage upload, auth flow, and add fase 1.5 reports`)

## 2. Branch Preview yang Dibuat

- **Nama Branch**: `preview/no-fast-login`
- Dibuat langsung dari `b4e6c3f2aedbd259de6204878ea149f60706ee07` tanpa menyentuh `main` maupun mengubah riwayat commit branch lain.

## 3. Daftar File yang Diubah

1. `hotspot-khartula/src/app/login/page.js`
2. `hotspot-khartula/src/components/auth/LoginForm.jsx`
3. `hotspot-khartula/src/lib/actions/auth.js`
4. `hotspot-khartula/src/lib/auth.js`
5. `hotspot-khartula/src/app/admin/pengaturan/page.js`

## 4. Penjelasan Perubahan Setiap File

1. **`hotspot-khartula/src/app/login/page.js`**:
   - Menghapus import dan pemanggilan `getFastLoginAvailability()` serta prop `fastLogin` pada `<LoginForm />`.
2. **`hotspot-khartula/src/components/auth/LoginForm.jsx`**:
   - Menghapus daftar `FAST_ROLES`, state/transition Fast Login (`activeFastRole`, `fastState`, `fastDispatch`, `handleFastLogin`), import `fastLoginAction`, dan blok UI `"Fast Login (Pengujian Role)"` (ketiga tombol *Login sebagai Admin/Petugas/Pelapor*).
   - Mempertahankan form Normal Login (`email`, `password`, tombol tampilkan/sembunyikan sandi, validasi input, `loginAction`, dan link `/register`).
3. **`hotspot-khartula/src/lib/actions/auth.js`**:
   - Menghapus server action `fastLoginAction` beserta import `getDemoCredentialsForRole`, `isFastLoginEnabled`, dan `ROLE_LABELS` yang hanya dipakai oleh `fastLoginAction`.
   - Mempertahankan `loginAction`, `registerAction`, `logoutAction`, dan `mapAuthError` tanpa perubahan logika.
4. **`hotspot-khartula/src/lib/auth.js`**:
   - Menghapus helper khusus Fast Login (`isFastLoginEnabled`, `DEMO_ENV_MAP`, `getDemoCredentialsForRole`, `getFastLoginAvailability`) sehingga kode aplikasi tidak lagi bergantung pada `ENABLE_FAST_LOGIN` maupun `DEMO_*`.
   - Mempertahankan `ROLE_HOME`, `ROLE_LABELS`, `normalizeRole`, `isPathAllowedForRole`, `getCurrentUserWithRole`, dan `requireRole`.
5. **`hotspot-khartula/src/app/admin/pengaturan/page.js`**:
   - Menghapus kartu status `"Status Fast Login Demo"` dan pemanggilan `getFastLoginAvailability()` yang sudah dihapus dari `src/lib/auth.js`.

## 5. Daftar Fitur yang Sengaja Tidak Diubah

- Normal Login menggunakan email dan kata sandi (`signInWithPassword`).
- Registrasi akun pelapor (`signUp`) dan Logout (`signOut`).
- Supabase Auth, session cookies (`@supabase/ssr`), dan `src/middleware.js`.
- Redirect setelah login/logout dan validasi `redirectTo` berdasarkan role.
- Role `admin`, `petugas`, `pelapor` beserta RBAC server (`requireRole`).
- Struktur database Supabase, RLS seluruh 8 tabel `public`, trigger/function, serta Storage buckets (`berita-images`, `laporan-bukti`) dan kebijakan RLS Storage.
- Seluruh halaman dashboard, GIS/peta, laporan karhutla, penugasan, penanganan, berita, wilayah, dan `.env.local` lokal pengguna.

## 6. Hasil Pemeriksaan Normal Login & UI `/login`

- `GET /login` mengembalikan HTTP `200`.
- Input `name="email"` dan `name="password"` tersedia dan berfungsi.
- Ketiga tombol Fast Login (`Login sebagai Admin`, `Login sebagai Petugas`, `Login sebagai Pelapor`) serta teks `"Fast Login"` sudah **tidak ada** di DOM (`hasFastLogin: false`).

## 7. Hasil Pengujian Ketiga Akun (Normal Login)

Pengujian dijalankan secara live terhadap server lokal dan Supabase Auth (`twhclfubwvahcbgohckx`) tanpa menampilkan kredensial:

| Role | Email | Metode | Hasil Login & Redirect | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin.demo@hotmap.local` | `signInWithPassword` (Normal Login) | Berhasil masuk dan akses `/admin` (`HTTP 200`) | **PASS** |
| **Petugas** | `petugas.demo@hotmap.local` | `signInWithPassword` (Normal Login) | Berhasil masuk dan akses `/petugas` (`HTTP 200`) | **PASS** |
| **Pelapor** | `pelapor.demo@hotmap.local` | `signInWithPassword` (Normal Login) | Berhasil masuk dan akses `/pelapor` (`HTTP 200`) | **PASS** |

## 8. Hasil Pengujian RBAC dan Session

- **Proteksi Anon (Belum Login)**:
  - `/admin`, `/petugas`, `/pelapor`, `/dashboard`, `/test-db` → seluruhnya redirect `HTTP 307` ke `/login?redirectTo=...` (**PASS**).
- **RBAC Admin**:
  - Diizinkan (`HTTP 200`): `/admin`, `/admin/pengaturan` (tanpa kartu Fast Login), `/admin/pengguna`, `/test-db`, `/petugas`, `/pelapor` (**PASS**).
  - Membuka `/login` saat sesi aktif → redirect `HTTP 307` ke `/admin` (**PASS**).
- **RBAC Petugas**:
  - Diizinkan (`HTTP 200`): `/petugas`, `/petugas/laporan`, `/petugas/peta` (**PASS**).
  - Diblokir (`HTTP 307` → `/petugas`): `/admin`, `/admin/pengguna`, `/test-db`, `/pelapor` (**PASS**).
  - Membuka `/login` saat sesi aktif → redirect `HTTP 307` ke `/petugas` (**PASS**).
- **RBAC Pelapor**:
  - Diizinkan (`HTTP 200`): `/pelapor`, `/pelapor/laporan`, `/pelapor/laporan/buat` (**PASS**).
  - Diblokir (`HTTP 307` → `/pelapor`): `/admin`, `/petugas`, `/test-db` (**PASS**).
  - Membuka `/login` saat sesi aktif → redirect `HTTP 307` ke `/pelapor` (**PASS**).
- **Session & Logout**:
  - Sesi bertahan antar-request dengan cookie Supabase SSR, dan setelah `signOut()` akses ulang ke `/admin`, `/petugas`, `/pelapor` kembali diarahkan (`HTTP 307`) ke `/login` (**PASS**).

## 9. Hasil Lint dan Build

- **Pencarian referensi Fast Login di `src/`**: `0` referensi tersisa.
- **`npm run lint`**: **PASS** (exit code `0`, `0` error/warning).
- **`npm run build`**: **PASS** (exit code `0`, seluruh 26 route berhasil dikompilasi oleh Next.js `16.4.0` Turbopack).
  - *Catatan informasi build*: Next.js `16.4.0` menampilkan rekomendasi upgrade keamanan (`next upgrade`) dan pemberitahuan deprecate konvensi `middleware` → `proxy`. Sesuai aturan Tahap 5, tidak dilakukan upgrade Next.js atau perubahan middleware pada task ini.

## 10. Status Push Git

- Branch `preview/no-fast-login` di-commit dan di-push ke remote `origin` (`https://github.com/kejulipat/HotMap.git`) menggunakan `git push -u origin preview/no-fast-login` tanpa mengubah `main` maupun `fix/pre-phase-2-readiness`.

## 11. Status Deployment Preview

- Repository GitHub telah terhubung dengan Vercel. Setiap push branch baru (`preview/no-fast-login`) otomatis memicu **Preview Deployment** di Vercel.
- Agar Preview Deployment berjalan tanpa `500 MIDDLEWARE_INVOCATION_FAILED`, pastikan di **Vercel Dashboard → Settings → Environment Variables**:
  1. `NEXT_PUBLIC_SUPABASE_URL` aktif untuk environment **Preview** (pilih *All Environments*, tanpa filter `gitBranch` yang digabung dengan `Production`).
  2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` aktif untuk environment **Preview**.
  3. **Root Directory** diatur ke `hotspot-khartula`.
  *(Variabel `ENABLE_FAST_LOGIN` dan `DEMO_*` tidak diperlukan pada branch `preview/no-fast-login`.)*

## 12. URL Preview

- **Status**: Belum terverifikasi secara langsung dari terminal lokal (`BLOCKED` pada verifikasi URL live karena tidak ada konfigurasi/token `.vercel` lokal).
- Setelah build Preview di Vercel selesai, URL Preview dapat dilihat langsung pada daftar **Vercel Dashboard → Deployments** (untuk branch `preview/no-fast-login`) atau komentar bot Vercel pada halaman branch/PR GitHub:
  `https://github.com/kejulipat/HotMap/tree/preview/no-fast-login`

## 13. Konfigurasi Supabase Tambahan yang Mungkin Diperlukan

- Normal Login (`signInWithPassword`) menggunakan komunikasi langsung ke endpoint Supabase Auth dan tidak memerlukan perubahan Redirect URLs.
- Namun, jika Anda menguji alur **Registrasi akun baru dengan konfirmasi email** atau **Reset Password** dari domain Preview Vercel (`https://*-kejulipats-projects.vercel.app` atau domain preview proyek Anda), tambahkan URL Preview Vercel ke **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** secara manual:
  - `https://<nama-project>-git-preview-no-fast-login-<team-slug>.vercel.app/**`
- *(Tidak ada perubahan konfigurasi Supabase remote yang dilakukan pada task ini.)*

## 14. Risiko dan Keterbatasan Preview

1. **Database & Storage Bersama (Shared Supabase Project)**:
   - Versi Preview terhubung ke project Supabase yang sama (`twhclfubwvahcbgohckx`). Setiap aktivitas pengujian pada Preview (membuat laporan, mengubah berita/wilayah, mengunggah foto, atau registrasi user baru) **akan langsung memengaruhi data pada database dan Storage yang sama**.
2. **Keamanan Kredensial**:
   - Branch `preview/no-fast-login` sama sekali tidak membaca maupun mengekspos variabel `DEMO_*` atau `SUPABASE_SERVICE_ROLE_KEY`. Penguji harus memasukkan email dan kata sandi secara manual melalui form Normal Login.
