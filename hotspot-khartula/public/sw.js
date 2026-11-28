// Service Worker caching ringan untuk HotMap (SIPKARHUTLA)
// Menyimpan tile peta GIS & aset statis publik di browser Cache Storage
// agar kunjungan ulang berlangsung instan tanpa menyentuh sesi/auth/API Supabase.

const TILE_CACHE = "hotmap-tiles-v1";
const ASSET_CACHE = "hotmap-assets-v1";
const MAX_TILE_ENTRIES = 250;

const TILE_HOST_PATTERNS = [
  "tile.openstreetmap.org",
  "server.arcgisonline.com",
  "tile.opentopomap.org",
];

function isMapTileRequest(url) {
  return TILE_HOST_PATTERNS.some((host) => url.hostname.endsWith(host));
}

function isCacheableStaticAsset(url, isLocalhost) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/images/")) return true;
  if (!isLocalhost && url.pathname.startsWith("/_next/static/")) return true;
  if (!isLocalhost && url.pathname.startsWith("/_next/image")) return true;
  return false;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("hotmap-") &&
                key !== TILE_CACHE &&
                key !== ASSET_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Jangan pernah intercept Supabase, API, navigasi dokumen, atau route terproteksi
  if (
    url.hostname.endsWith("supabase.co") ||
    request.mode === "navigate" ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 1. Tile Peta GIS -> Cache-First (instan untuk pengguna yang kembali membuka peta)
  if (isMapTileRequest(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const networkRes = await fetch(request);
        if (networkRes && (networkRes.ok || networkRes.type === "opaque")) {
          cache.put(request, networkRes.clone());
          trimCache(TILE_CACHE, MAX_TILE_ENTRIES);
        }
        return networkRes;
      })
    );
    return;
  }

  // 2. Gambar & aset statis lokal -> Stale-While-Revalidate / Cache-First
  const isLocalhost =
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1";

  if (isCacheableStaticAsset(url, isLocalhost)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((networkRes) => {
            if (networkRes && networkRes.ok) {
              cache.put(request, networkRes.clone());
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })
    );
  }
});
