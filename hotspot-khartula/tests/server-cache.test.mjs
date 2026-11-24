import test from "node:test";
import assert from "node:assert/strict";
import {
  extractSupabaseAuthFingerprint,
  invalidateHotmapCache,
  readCachedOrFetch,
} from "../src/lib/server-cache.js";

test("extractSupabaseAuthFingerprint returns null for anon and deterministic key for sb-* cookies", () => {
  assert.equal(extractSupabaseAuthFingerprint([]), null);
  assert.equal(
    extractSupabaseAuthFingerprint([
      { name: "sb-proj-auth-token-code-verifier", value: "abc" },
      { name: "other", value: "123" },
    ]),
    null
  );

  const fp1 = extractSupabaseAuthFingerprint([
    { name: "sb-proj-auth-token", value: "token-value-1" },
  ]);
  const fp2 = extractSupabaseAuthFingerprint([
    { name: "sb-proj-auth-token", value: "token-value-1" },
  ]);
  const fp3 = extractSupabaseAuthFingerprint([
    { name: "sb-proj-auth-token", value: "token-value-2" },
  ]);
  assert.ok(fp1 && fp1.startsWith("sb:"));
  assert.equal(fp1, fp2);
  assert.notEqual(fp1, fp3);
});

test("readCachedOrFetch deduplicates in-flight fetches and respects invalidation", async () => {
  invalidateHotmapCache({ auth: true, data: true });

  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 15));
    return { value: calls };
  };

  const [r1, r2] = await Promise.all([
    readCachedOrFetch("data", "test-key", 10_000, fetcher),
    readCachedOrFetch("data", "test-key", 10_000, fetcher),
  ]);
  assert.equal(calls, 1);
  assert.equal(r1.value, 1);
  assert.equal(r2.value, 1);

  invalidateHotmapCache({ data: true });
  const r3 = await readCachedOrFetch("data", "test-key", 10_000, fetcher);
  assert.equal(calls, 2);
  assert.equal(r3.value, 2);
});
