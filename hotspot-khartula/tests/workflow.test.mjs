import test from "node:test";
import assert from "node:assert/strict";
import {
  getJenisKejadianLabel,
  getKeparahanMeta,
  isValidStatusTransition,
} from "../src/lib/workflow.js";

test("Admin status transitions allow valid operational workflow", () => {
  assert.equal(isValidStatusTransition("admin", "menunggu_verifikasi", "terverifikasi"), true);
  assert.equal(isValidStatusTransition("admin", "menunggu_verifikasi", "ditolak"), true);
  assert.equal(isValidStatusTransition("admin", "terverifikasi", "ditangani"), true);
  assert.equal(isValidStatusTransition("admin", "ditangani", "selesai"), true);
  // Cannot jump directly from menunggu_verifikasi to selesai
  assert.equal(isValidStatusTransition("admin", "menunggu_verifikasi", "selesai"), false);
  assert.equal(isValidStatusTransition("admin", "menunggu_verifikasi", "invalid_status"), false);
});

test("Petugas status transitions are strictly limited to handling stages", () => {
  assert.equal(isValidStatusTransition("petugas", "terverifikasi", "ditangani"), true);
  assert.equal(isValidStatusTransition("petugas", "ditangani", "ditangani"), true);
  assert.equal(isValidStatusTransition("petugas", "ditangani", "selesai"), true);

  // Forbidden transitions for petugas
  assert.equal(isValidStatusTransition("petugas", "menunggu_verifikasi", "terverifikasi"), false);
  assert.equal(isValidStatusTransition("petugas", "menunggu_verifikasi", "ditangani"), false);
  assert.equal(isValidStatusTransition("petugas", "terverifikasi", "ditolak"), false);
  assert.equal(isValidStatusTransition("petugas", "terverifikasi", "selesai"), false);
  assert.equal(isValidStatusTransition("petugas", "selesai", "ditangani"), false);
});

test("Pelapor and unknown roles cannot transition administrative statuses", () => {
  assert.equal(isValidStatusTransition("pelapor", "menunggu_verifikasi", "terverifikasi"), false);
  assert.equal(isValidStatusTransition("anon", "terverifikasi", "ditangani"), false);
});

test("Labels and metadata helpers resolve expected values", () => {
  assert.equal(getJenisKejadianLabel("kebakaran_gambut"), "Kebakaran Lahan Gambut");
  assert.equal(getKeparahanMeta("kritis")?.value, "kritis");
  assert.equal(getKeparahanMeta("unknown"), null);
});
