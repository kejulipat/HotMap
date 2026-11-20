/**
 * Server-side TTL cache & in-flight request deduplicator untuk HotMap.
 * Disimpan pada `globalThis` agar bertahan lintas navigasi di `next dev` (localhost)
 * maupun warm serverless instance di Vercel.
 */

const GLOBAL_CACHE_KEY = "__hotmapServerCache_v1";

export const AUTH_CACHE_TTL_MS = 60_000;
export const DATA_CACHE_TTL_MS = 60_000;

function getCacheStore() {
  if (!globalThis[GLOBAL_CACHE_KEY]) {
    globalThis[GLOBAL_CACHE_KEY] = {
      authMap: new Map(),
      authInflight: new Map(),
      dataMap: new Map(),
      dataInflight: new Map(),
    };
  }
  return globalThis[GLOBAL_CACHE_KEY];
}

/**
 * Hash 128-bit deterministik (4x32-bit FNV-1a/cyrb53 hybrid) yang berjalan
 * sinkron di Node.js maupun Edge Runtime tanpa dependensi eksternal.
 */
function hashStringSync(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

/**
 * Menghasilkan fingerprint unik dari cookie sesi Supabase (`sb-*`).
 * Mengembalikan `null` jika pengunjung belum login (tidak ada cookie `sb-*`),
 * sehingga server tidak perlu menghubungi Supabase Auth sama sekali.
 */
export function extractSupabaseAuthFingerprint(cookiesList = []) {
  if (!Array.isArray(cookiesList) || cookiesList.length === 0) {
    return null;
  }

  const sbCookies = cookiesList
    .filter(
      (c) =>
        c &&
        typeof c.name === "string" &&
        c.name.startsWith("sb-") &&
        !c.name.endsWith("-code-verifier") &&
        typeof c.value === "string" &&
        c.value.length > 0
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  if (sbCookies.length === 0) {
    return null;
  }

  const raw = sbCookies.map((c) => `${c.name}=${c.value}`).join(";");
  return `sb:${hashStringSync(raw)}:${raw.length}`;
}

export function getCachedAuth(fingerprint) {
  if (!fingerprint) return null;
  const { authMap } = getCacheStore();
  const entry = authMap.get(fingerprint);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    authMap.delete(fingerprint);
    return null;
  }
  return entry.value;
}

export function setCachedAuth(fingerprint, value, ttlMs = AUTH_CACHE_TTL_MS) {
  if (!fingerprint || !value) return;
  const { authMap } = getCacheStore();
  if (authMap.size > 200) {
    const oldestKey = authMap.keys().next().value;
    if (oldestKey) authMap.delete(oldestKey);
  }
  authMap.set(fingerprint, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Membaca dari cache TTL atau menjalankan `fetcher` dengan deduplikasi Promise in-flight.
 */
export async function readCachedOrFetch(
  kind,
  key,
  ttlMs,
  fetcher,
  shouldCache = () => true
) {
  const store = getCacheStore();
  const map = kind === "auth" ? store.authMap : store.dataMap;
  const inflight = kind === "auth" ? store.authInflight : store.dataInflight;

  const existing = map.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      if (shouldCache(result)) {
        if (map.size > 200) {
          const oldestKey = map.keys().next().value;
          if (oldestKey) map.delete(oldestKey);
        }
        map.set(key, {
          value: result,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return result;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/**
 * Menghapus cache server saat terjadi login/logout atau mutasi data (CRUD berita/laporan).
 */
export function invalidateHotmapCache({ auth = false, data = true } = {}) {
  const store = getCacheStore();
  if (auth) {
    store.authMap.clear();
    store.authInflight.clear();
  }
  if (data) {
    store.dataMap.clear();
    store.dataInflight.clear();
  }
}
