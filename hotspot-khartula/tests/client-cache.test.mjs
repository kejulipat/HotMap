import test from "node:test";
import assert from "node:assert/strict";
import {
  CLIENT_CACHE_PREFIX,
  clearHotmapBrowserCache,
  readBrowserCache,
  writeBrowserCache,
} from "../src/lib/client-cache.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    get length() {
      return map.size;
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(k, String(v));
    },
    removeItem(k) {
      map.delete(k);
    },
  };
}

test("writeBrowserCache and readBrowserCache store, expire, and clear entries cleanly", () => {
  const storage = createMemoryStorage();
  storage.setItem("unrelated_key", "keep-me");

  assert.equal(writeBrowserCache("pref:basemap", "satellite", 60_000, storage), true);
  assert.equal(readBrowserCache("pref:basemap", storage), "satellite");

  // Entry kadaluarsa harus otomatis dibersihkan dan mengembalikan null
  assert.equal(writeBrowserCache("expired:item", { ok: true }, -10, storage), true);
  assert.equal(readBrowserCache("expired:item", storage), null);
  assert.equal(storage.getItem(`${CLIENT_CACHE_PREFIX}expired:item`), null);

  // Data JSON rusak tidak melempar error
  storage.setItem(`${CLIENT_CACHE_PREFIX}corrupt`, "{bad json");
  assert.equal(readBrowserCache("corrupt", storage), null);

  // clearHotmapBrowserCache hanya menghapus key milik HotMap
  const removed = clearHotmapBrowserCache(storage);
  assert.equal(removed, 1);
  assert.equal(readBrowserCache("pref:basemap", storage), null);
  assert.equal(storage.getItem("unrelated_key"), "keep-me");
});
