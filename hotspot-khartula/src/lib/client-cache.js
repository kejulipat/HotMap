/**
 * Browser-side TTL cache berbasis `localStorage` untuk menyimpan data publik
 * (snapshot laporan/wilayah/berita) dan preferensi UI (mis. pilihan basemap)
 * agar pengunjung yang kembali membuka HotMap mendapat respons instan.
 *
 * Catatan keamanan:
 * - JANGAN pernah menyimpan token auth, kredensial, atau data privat di sini.
 * - Aman dipanggil di SSR maupun mode incognito (tidak pernah melempar error).
 */

export const CLIENT_CACHE_PREFIX = "hotmap_cache_v1:";
export const PUBLIC_SNAPSHOT_TTL_MS = 10 * 60 * 1000; // 10 menit
export const UI_PREF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

function resolveStorage(customStorage) {
  if (customStorage) return customStorage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readBrowserCache(key, customStorage = null) {
  const storage = resolveStorage(customStorage);
  if (!storage || !key) return null;

  const fullKey = `${CLIENT_CACHE_PREFIX}${key}`;
  try {
    const raw = storage.getItem(fullKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.expiresAt !== "number"
    ) {
      storage.removeItem(fullKey);
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      storage.removeItem(fullKey);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    try {
      storage.removeItem(fullKey);
    } catch {
      // Abaikan error penyimpanan privat
    }
    return null;
  }
}

export function writeBrowserCache(
  key,
  value,
  ttlMs = PUBLIC_SNAPSHOT_TTL_MS,
  customStorage = null
) {
  const storage = resolveStorage(customStorage);
  if (!storage || !key) return false;

  const fullKey = `${CLIENT_CACHE_PREFIX}${key}`;
  const payload = JSON.stringify({
    value,
    savedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });

  try {
    storage.setItem(fullKey, payload);
    return true;
  } catch {
    // Jika quota penuh, bersihkan cache HotMap lama lalu coba simpan sekali lagi
    try {
      clearHotmapBrowserCache(storage);
      storage.setItem(fullKey, payload);
      return true;
    } catch {
      return false;
    }
  }
}

export function clearHotmapBrowserCache(customStorage = null) {
  const storage = resolveStorage(customStorage);
  if (!storage) return 0;

  let removed = 0;
  try {
    const keysToRemove = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(CLIENT_CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k);
      removed += 1;
    }
  } catch {
    return removed;
  }
  return removed;
}
