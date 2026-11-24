import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_UPLOAD_BYTES,
  generateSafeStoragePath,
  validateUploadFile,
  verifyImageMagicBytes,
} from "../src/lib/storage.js";

function makeFakeFile(bytes, { name = "bukti.png", type = "image/png" } = {}) {
  const uint8 = new Uint8Array(bytes);
  return {
    name,
    type,
    size: uint8.byteLength,
    slice(start, end) {
      const sub = uint8.slice(start, end);
      return {
        async arrayBuffer() {
          return sub.buffer.slice(sub.byteOffset, sub.byteOffset + sub.byteLength);
        },
      };
    },
  };
}

test("validateUploadFile enforces MIME, extension, and 5 MB limit", () => {
  const ok = validateUploadFile({ name: "foto.jpg", type: "image/jpeg", size: 1024 });
  assert.equal(ok.valid, true);

  const tooBig = validateUploadFile({
    name: "big.jpg",
    type: "image/jpeg",
    size: MAX_UPLOAD_BYTES + 1,
  });
  assert.equal(tooBig.valid, false);

  const badMime = validateUploadFile({
    name: "script.svg",
    type: "image/svg+xml",
    size: 500,
  });
  assert.equal(badMime.valid, false);

  const mismatch = validateUploadFile({
    name: "fake.png",
    type: "image/jpeg",
    size: 500,
  });
  assert.equal(mismatch.valid, false);
});

test("verifyImageMagicBytes is fail-closed and validates JPEG/PNG/WebP headers", async () => {
  // Fail-closed for invalid/missing slice
  assert.equal(await verifyImageMagicBytes(null, "image/png"), false);
  assert.equal(await verifyImageMagicBytes({}, "image/png"), false);

  // Valid PNG signature
  const png = makeFakeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  assert.equal(await verifyImageMagicBytes(png, "image/png"), true);

  // Valid JPEG signature
  const jpg = makeFakeFile([0xff, 0xd8, 0xff, 0xe0, 0x00], {
    name: "a.jpg",
    type: "image/jpeg",
  });
  assert.equal(await verifyImageMagicBytes(jpg, "image/jpeg"), true);

  // Valid WebP signature (RIFF....WEBP)
  const webp = makeFakeFile(
    [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
    { name: "a.webp", type: "image/webp" }
  );
  assert.equal(await verifyImageMagicBytes(webp, "image/webp"), true);

  // Spoofed HTML disguised as .jpg
  const spoof = makeFakeFile(
    Array.from(Buffer.from("<html><script>alert(1)</script></html>")),
    { name: "evil.jpg", type: "image/jpeg" }
  );
  assert.equal(await verifyImageMagicBytes(spoof, "image/jpeg"), false);
});

test("generateSafeStoragePath strips traversal segments", () => {
  const path = generateSafeStoragePath(
    "../admin-id",
    "../../laporan-1",
    "../../my photo.png"
  );
  assert.equal(path.includes(".."), false);
  assert.match(path, /^admin-id\/laporan-1\/\d+-[a-z0-9-]+\.png$/);
});
