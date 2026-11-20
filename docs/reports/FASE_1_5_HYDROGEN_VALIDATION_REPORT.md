# FASE 1.5 — HYDROGEN INDEPENDENT VALIDATION REPORT (HOTMAP)

- **Proyek**: HOTMAP (`hotspot-khartula/`)
- **Fase**: Fase 1.5 — Validasi Independen & Audit Kesiapan Provisioning Akun Demo
- **Validator Independen**: Gemini Hydrogen
- **Implementer Fase 1.5**: Gemini Neon CLI (laporan acuan: `docs/reports/FASE_1_5_NEON_COMPLETION_REPORT.md`)
- **Tanggal Laporan**: 2026-11-20
- **Supabase Project Ref**: `twhclfubwvahcbgohckx` (`ap-southeast-2`, PostgreSQL `17.11`, Status `ACTIVE_HEALTHY`)
- **Status Validasi Keseluruhan**: **`PARTIALLY VALIDATED — LOGIN & PROVISIONING BLOCKED`**

---

## 1. Ringkasan Eksekutif

Gemini Hydrogen telah melakukan audit dan validasi independen terhadap hasil implementasi Fase 1.5 yang dilaporkan Gemini Neon pada `docs/reports/FASE_1_5_NEON_COMPLETION_REPORT.md`, serta mengevaluasi kesiapan dan mekanisme provisioning tiga akun demo (`admin`, `petugas`, `pelapor`) melalui Supabase MCP.

**Hasil utama validasi independen:**
1. **Implementasi lokal & konfigurasi database remote tervalidasi baik**: `npm run lint` lulus (`0` error), `npm run build` lulus (`26` route terbentuk), unit assertions helper (`storage.js`, `normalizers.js`, `auth.js`) lulus, dan pemeriksaan read-only database remote mengonfirmasi 3 migrasi Fase 1.5 aktif, 8 tabel `public` ber-RLS aktif, 2 bucket Storage aplikasi (`berita-images`, `laporan-bukti`) beserta policy-nya aktif, serta Security Advisor melaporkan `0` temuan (`lints: []`).
2. **Provisioning akun demo & pengujian login/E2E masih `BLOCKED`**: Bagian provisioning melalui Supabase MCP dihentikan sesuai batasan otorisasi keamanan karena Supabase MCP tidak menyediakan tool Auth Admin, sementara `SUPABASE_SERVICE_ROLE_KEY` maupun kredensial `DEMO_*` belum tersedia di `hotspot-khartula/.env.local`.

> **Catatan Input Prompt**: Teks Prompt 2 yang diterima terpotong pada bagian `TAHAP A — AUDIT AWAL` poin 5. Pemeriksaan tetap dijalankan menyeluruh secara read-only pada kode aplikasi, skema remote, keamanan, dan kesiapan provisioning tanpa mengubah source code maupun skema/kebijakan database.

---

## 2. Mengapa Pengujian Login & Provisioning Masih `BLOCKED`?

Pengujian login (baik login reguler maupun Fast Login untuk role `admin`, `petugas`, dan `pelapor`) serta pengujian otorisasi lintas-role runtime belum dapat dijalankan karena **empat kondisi faktual berikut saling mengunci**:

### 2.1. Tidak Ada User di Supabase Auth (`auth.users = 0` baris)
- Hasil query read-only via Supabase MCP pada `20:27 WIB` menunjukkan:
  - `auth.users`: **0 baris**
  - `public.profiles`: **0 baris**
- Tanpa akun terdaftar di `auth.users` dan baris padanan role di `public.profiles`, `supabase.auth.signInWithPassword(...)` tidak memiliki kredensial valid untuk diautentikasi.

### 2.2. Kredensial Demo & `SUPABASE_SERVICE_ROLE_KEY` Belum Ada di `.env.local`
- Pemeriksaan key pada `hotspot-khartula/.env.local` menunjukkan hanya 3 variabel yang terisi (`<SET>`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DATABASE_URL`
- Variabel yang dibutuhkan oleh fitur Fast Login (`src/lib/auth.js` & `src/lib/actions/auth.js`) maupun skrip provisioning (`hotspot-khartula/scripts/provision-demo-users.mjs`) **belum tersedia**:
  - `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`
  - `DEMO_PETUGAS_EMAIL`, `DEMO_PETUGAS_PASSWORD`
  - `DEMO_PELAPOR_EMAIL`, `DEMO_PELAPOR_PASSWORD`
  - `ENABLE_FAST_LOGIN` *(opsional, fallback otomatis `true` di mode development)*
  - `SUPABASE_SERVICE_ROLE_KEY` *(dibutuhkan untuk provisioning otomatis via Auth Admin API)*
- Pada `src/components/auth/LoginForm.jsx`, tombol Fast Login untuk ketiga role otomatis berada dalam kondisi nonaktif (`disabled={isBusy || !isConfigured}`) ketika kredensial belum dikonfigurasi.

### 2.3. Keterbatasan Kemampuan Supabase MCP (Tidak Ada Tool Auth Admin)
- Pemeriksaan terhadap seluruh daftar tool pada MCP server `supabase` (29 tool) dan `supabase_mcp` menunjukkan bahwa **Supabase MCP tidak menyediakan tool Auth Admin** (`createUser`, `updateUserById`, atau `auth.admin.*`).
- Tool `get_publishable_keys` di MCP hanya mengembalikan key publik (`anon` legacy dan `publishable`), **tidak** mengekspos `service_role` / secret key.

### 2.4. Batas Keamanan & Larangan Jalan Pintas
- **Menulis langsung ke `auth.users` via SQL (`execute_sql`) dilarang**: Memasukkan baris langsung ke tabel internal `auth.users` dan `auth.identities` berisiko merusak konsistensi skema internal GoTrue/Supabase Auth dan dilarang keras pada aturan keamanan tugas ini.
- **Registrasi publik (`supabase.auth.signUp` dengan `anon` key) tidak bisa membuat akun `admin` atau `petugas`**:
  - Trigger `on_auth_user_created` (`public.handle_new_user()`) secara paksa menetapkan `'pelapor'::public.user_role` untuk setiap pendaftaran baru.
  - Kebijakan RLS `UPDATE` pada `public.profiles` (`"Pengguna update profil sendiri atau admin kelola semua"`) memverifikasi `role = (SELECT private.get_my_role())`, sehingga user biasa tidak dapat mengubah role miliknya menjadi `admin` atau `petugas`.
  - Karena aturan keamanan melarang modifikasi/pelemahan RLS untuk mempermudah pengujian, jalur Auth Admin resmi mutlak diperlukan.

---

## 3. Cara Membuka Blokir Provisioning & Pengujian Login

Agar pengujian login reguler, Fast Login, RBAC lintas-role, RLS, dan upload Storage dapat dilanjutkan, pengguna perlu menjalankan salah satu dari **dua metode resmi** berikut:

### Opsi 1 — Skrip Otomatis Proyek (Disarankan)
1. Buka Supabase Dashboard proyek `twhclfubwvahcbgohckx` → **Project Settings** → **API Keys**, lalu salin key `service_role` (atau secret key).
2. Tambahkan sementara baris `SUPABASE_SERVICE_ROLE_KEY=...` ke `hotspot-khartula/.env.local`.
3. Jalankan skrip provisioning resmi dari direktori `hotspot-khartula/`:
   ```powershell
   node --env-file=.env.local scripts/provision-demo-users.mjs
   ```
   Skrip ini akan:
   - Membuat/memperbarui 3 akun demo (`admin.demo@hotmap.local`, `petugas.demo@hotmap.local`, `pelapor.demo@hotmap.local`) melalui `supabase.auth.admin.*` dengan password acak kuat dan `email_confirm: true`.
   - Menyinkronkan `public.profiles` (`role`: `admin`, `petugas`, `pelapor`).
   - Menulis `ENABLE_FAST_LOGIN=true` dan `DEMO_*` ke `hotspot-khartula/.env.local` tanpa mencetak password ke terminal.
4. Hapus baris `SUPABASE_SERVICE_ROLE_KEY` dari `.env.local` setelah selesai jika tidak lagi dibutuhkan.

### Opsi 2 — Manual via Supabase Dashboard
1. Buat 3 pengguna di Supabase Dashboard → **Authentication** → **Users** (aktifkan opsi *Auto Confirm User*).
2. Atur `role` pada tabel `public.profiles` untuk ketiga UUID tersebut (`admin`, `petugas`, `pelapor`) melalui Table Editor atau SQL Editor Dashboard.
3. Isi manual `ENABLE_FAST_LOGIN=true` beserta `DEMO_ADMIN_*`, `DEMO_PETUGAS_*`, dan `DEMO_PELAPOR_*` di `hotspot-khartula/.env.local`.

---

## 4. Hasil Audit Independen Tahap A

### 4.1. Keamanan Git & Konfigurasi Fast Login
- `hotspot-khartula/.gitignore` memuat aturan `.env*` dan `!.env.example`.
- `git ls-files "hotspot-khartula/.env.local"` mengembalikan hasil kosong, memastikan `.env.local` tidak dilacak oleh Git.
- Implementasi Fast Login di `src/lib/auth.js`, `src/lib/actions/auth.js`, dan `src/components/auth/LoginForm.jsx`:
  - Kredensial hanya dibaca di server (`DEMO_*`).
  - Dinonaktifkan di produksi kecuali `ENABLE_FAST_LOGIN === "true"`.
  - Setelah `signInWithPassword`, server action memverifikasi `profiles.role === targetRole`; jika tidak cocok, langsung memanggil `signOut()`.

### 4.2. Kondisi Aktual Database & Storage Remote (`twhclfubwvahcbgohckx`)
- **Migrasi remote tercatat**:
  - `20261120124604` (`fase1_5_berita`)
  - `20261120124707` (`fase1_5_laporan_penugasan_foto_riwayat`)
  - `20261120125003` (`fase1_5_rls_and_storage_buckets`)
- **Security Advisor**: `0` peringatan (`lints: []`).
- **RLS Policies (`public`)**: Teridentifikasi **33 policies** pada 8 tabel (`30` policy aktif untuk `anon`/`authenticated` + `3` policy legacy `{service_role}` pada `laporan_karhutla`, `profiles`, `wilayah`).
- **Storage Buckets**:
  - `berita-images` (`public: true`, max 5 MB, `jpeg/png/webp`) — aktif.
  - `laporan-bukti` (`public: false`, max 5 MB, `jpeg/png/webp`) — aktif.
  - `media-karhutla` (`public: true`, max 5 MB, `jpeg/png`) — bucket kosong legacy masih ada.
- **Schema `private`**: `pg_namespace` menunjukkan `private` masih memiliki grant `anon=U/postgres`, sedangkan seluruh policy `TO anon` (`berita`, `laporan_karhutla`, `penanganan_log`, `wilayah`, `storage.objects`) tidak memanggil `private.*`. Oleh karena itu, rancangan migrasi opsional `supabase/migrations/20261120000400_fase1_5_cleanup_optional.sql` valid dan aman untuk dipertimbangkan setelah disetujui pengguna.

### 4.3. Review Independen Perubahan Kode Gemini Neon
Pemeriksaan langsung terhadap `git diff` pada 16 file yang diubah Neon (`hotspot-khartula/src/*` dan `supabase/README.md`) serta file migrasi baru `20261120000400_fase1_5_cleanup_optional.sql`:

- **Tervalidasi benar & sesuai kebutuhan Fase 1.5**:
  - `src/lib/normalizers.js`: penambahan `isValidLatLng`, `isUuid`, pengambilan `EXTENDED_LAPORAN_COLS` (dengan fallback `BASE_LAPORAN_COLS`), metadata `wilayah`, serta pengambilan `penanganan_log` pada `fetchLaporanById`.
  - `src/lib/storage.js`: validasi *magic bytes* (`verifyImageMagicBytes`) untuk JPEG, PNG, dan WebP sebelum upload.
  - `src/lib/actions/auth.js` & `src/middleware.js`: penghapusan `role` dari `user_metadata` pada `signUp`, penghapusan fallback `profiles.insert()` yang terblokir RLS, penggunaan `.maybeSingle()`, serta preservasi query string pada `redirectTo`.
  - `src/lib/actions/berita.js`: validasi panjang minimal slug (`>= 3`), pelestarian `existing.slug` saat update, dan revalidasi path `/berita/<slug>`.
  - `src/components/laporan/LaporanDetailView.jsx`, `src/app/admin/page.js`, `src/app/admin/wilayah/page.js`, `src/app/test-db/page.jsx`, `src/components/landing/LandingExplorer.jsx`, `src/components/ui/SharedUI.jsx`, dan `src/components/auth/LoginForm.jsx`: seluruh perubahan sinkron dengan skema database terkini.

- **Temuan minor hasil review independen (tidak diubah oleh Hydrogen)**:
  1. **Ketidaksinkronan angka jumlah policy di laporan Neon**: Bagian 2 laporan Neon menyebut "26 RLS policies" (angka sebelum migrasi `000300`/rekonsiliasi), sedangkan jumlah aktual di `pg_policies` schema `public` adalah **33 policies** (`30` aktif + `3` legacy `{service_role}`).
  2. **Fallback `verifyImageMagicBytes` pada `src/lib/storage.js`**: Kondisi `if (!file || typeof file.slice !== "function") return true;` aman untuk `File`/`Blob` standar `FormData`, namun lebih aman mengembalikan `false` jika ada objek input tidak standar tanpa `.slice`.
  3. **Kebijakan `UPDATE` petugas pada `public.laporan_karhutla`**: Policy `"Petugas dan Admin update laporan"` masih mengizinkan seluruh `petugas` memperbarui laporan apa pun (belum dibatasi ke `petugas_id = (SELECT auth.uid())`). Wajib diperketat sebelum atau saat Fase 3 aktif.
  4. **Keamanan versi Next.js `16.4.0`**: `npm run build` menampilkan peringatan *known security vulnerability* pada `next@16.4.0` dan deprecate konvensi `middleware.js` → `proxy.js`.

---

## 5. Pengujian Independen yang Dijalankan Hydrogen

| Pengujian | Status | Hasil Aktual |
|---|---|---|
| ESLint (`npm run lint`) | **PASS** | Exit code `0`, tidak ada error/warning lint. |
| Production Build (`npm run build`) | **PASS** | Exit code `0` (pada retry setelah peringatan security advisory Next.js `16.4.0`), seluruh 26 route terkompilasi. |
| Unit Assertions Independen (`storage.js`, `normalizers.js`, `auth.js`) | **PASS** | `HYDROGEN_INDEPENDENT_UNIT_VERIFICATION_PASSED` — validasi upload/magic bytes, batas koordinat `isValidLatLng`, `isUuid`, `normalizeRole`, `isPathAllowedForRole`, dan status `getFastLoginAvailability` terverifikasi. |
| Audit Read-Only Database & Storage Remote via MCP | **PASS** | Migrasi, tabel, policies, advisors (`0` lints), dan konfigurasi bucket terkonfirmasi. |
| Provisioning 3 Akun Demo via MCP | **BLOCKED** | Tidak ada tool Auth Admin di Supabase MCP dan `SUPABASE_SERVICE_ROLE_KEY` belum tersedia di `.env.local`. |
| Pengujian Login, Fast Login, RBAC Runtime, RLS Live, & Storage Upload Live | **BLOCKED** | `auth.users` masih `0` baris dan `DEMO_*` belum dikonfigurasi di `.env.local`. |

---

## 6. Kesimpulan & Rekomendasi Langkah Berikutnya

1. **Status Kode Fase 1.5**: Perubahan kode lokal oleh Gemini Neon **layak diterima secara statis dan build-time** (hanya menyisakan catatan minor non-blokir dan agenda upgrade Next.js `16.4.0`).
2. **Status Kesiapan Masuk Fase 2**: **Belum siap penuh sebelum uji login & E2E dijalankan**.
3. **Langkah berikutnya yang direkomendasikan**:
   - Pengguna menjalankan salah satu metode provisioning resmi (Bagian 3) untuk membuat 3 akun demo dan mengisi `.env.local`.
   - Setelah akun demo dan `.env.local` siap, jalankan pengujian E2E Login, Fast Login, RBAC lintas-role, CRUD Berita + upload `berita-images`, serta verifikasi RLS dengan sesi user nyata.
   - Putuskan secara terpisah apakah ingin menindaklanjuti upgrade keamanan `next@16.4.0` dan penerapan migrasi opsional `20261120000400_fase1_5_cleanup_optional.sql`.
