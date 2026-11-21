"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  isSentinelZeroCoordinate,
  isValidCoordinatePair,
  isWithinIndonesiaBounds,
} from "@/lib/gis";
import { isUuid, normalizeStatusKey } from "@/lib/normalizers";
import { invalidateHotmapCache } from "@/lib/server-cache";
import {
  STORAGE_BUCKETS,
  deleteStorageObject,
  uploadLaporanEvidence,
  validateUploadFile,
  verifyImageMagicBytes,
} from "@/lib/storage";
import {
  ALLOWED_JENIS_KEJADIAN,
  ALLOWED_KEPARAHAN,
  isValidStatusTransition,
} from "@/lib/workflow";

const MAX_PHOTOS_CREATE = 3;
const MAX_PHOTOS_PENANGANAN = 2;

function revalidateLaporanRoutes(laporanId = null) {
  invalidateHotmapCache({ data: true });
  revalidatePath("/");
  revalidatePath("/peta");
  revalidatePath("/admin");
  revalidatePath("/admin/peta");
  revalidatePath("/admin/laporan");
  revalidatePath("/petugas");
  revalidatePath("/petugas/peta");
  revalidatePath("/petugas/laporan");
  revalidatePath("/pelapor");
  revalidatePath("/pelapor/laporan");
  if (laporanId) {
    revalidatePath(`/admin/laporan/${laporanId}`);
    revalidatePath(`/petugas/laporan/${laporanId}`);
    revalidatePath(`/pelapor/laporan/${laporanId}`);
  }
}

function extractValidFiles(formData, fieldName, maxCount) {
  const entries = formData.getAll(fieldName);
  const files = entries.filter(
    (item) => item && typeof item === "object" && Number(item.size ?? 0) > 0
  );
  if (files.length > maxCount) {
    return {
      files: [],
      error: `Maksimal ${maxCount} foto yang dapat diunggah dalam satu pengiriman.`,
    };
  }
  return { files, error: null };
}

async function preValidateImageFiles(files) {
  for (const file of files) {
    const check = validateUploadFile(file);
    if (!check.valid) {
      return { valid: false, error: `${file.name || "File"}: ${check.error}` };
    }
    const magicOk = await verifyImageMagicBytes(file, check.mimeType);
    if (!magicOk) {
      return {
        valid: false,
        error: `${file.name || "File"}: Konten file bukan gambar JPEG, PNG, atau WebP yang valid.`,
      };
    }
  }
  return { valid: true, error: null };
}

async function rollbackUploadedPaths(supabase, paths) {
  for (const path of paths) {
    await deleteStorageObject(supabase, STORAGE_BUCKETS.LAPORAN, path);
  }
}

/**
 * Membuat laporan karhutla baru (role `pelapor` atau `admin`).
 * Alur atomik: validasi ketat -> upload foto ke folder `<uid>/<draftId>` ->
 * INSERT laporan_karhutla -> INSERT laporan_foto -> INSERT laporan_riwayat_status.
 * Jika langkah DB gagal, seluruh file Storage yang baru diunggah langsung dihapus (rollback).
 */
export async function createLaporanAction(_prevState, formData) {
  const { supabase, user, role } = await requireRole(["pelapor", "admin"]);

  const judul = String(formData.get("judul") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const wilayahId = String(formData.get("wilayah_id") ?? "").trim();
  const alamatLokasi = String(formData.get("alamat_lokasi") ?? "").trim();
  const jenisKejadian = String(formData.get("jenis_kejadian") ?? "kebakaran_lahan")
    .toLowerCase()
    .trim();
  const tingkatKeparahan = String(formData.get("tingkat_keparahan") ?? "sedang")
    .toLowerCase()
    .trim();
  const rawLuas = String(formData.get("estimasi_luas") ?? "").trim();
  const rawLat = String(formData.get("latitude") ?? "").trim();
  const rawLng = String(formData.get("longitude") ?? "").trim();
  const rawWaktu = String(formData.get("waktu_kejadian") ?? "").trim();

  if (judul.length < 3 || judul.length > 160) {
    return { error: "Judul kejadian harus antara 3 hingga 160 karakter." };
  }
  if (deskripsi.length < 5 || deskripsi.length > 3000) {
    return { error: "Deskripsi kejadian harus antara 5 hingga 3000 karakter." };
  }
  if (!isUuid(wilayahId)) {
    return { error: "Pilih wilayah kejadian yang valid." };
  }
  if (alamatLokasi.length > 300) {
    return { error: "Alamat/keterangan lokasi maksimal 300 karakter." };
  }
  if (!ALLOWED_JENIS_KEJADIAN.includes(jenisKejadian)) {
    return { error: "Jenis kejadian tidak valid." };
  }
  if (tingkatKeparahan && !ALLOWED_KEPARAHAN.includes(tingkatKeparahan)) {
    return { error: "Tingkat keparahan tidak valid." };
  }

  const latitude = Number(rawLat);
  const longitude = Number(rawLng);
  if (!rawLat || !rawLng || !isValidCoordinatePair(latitude, longitude)) {
    return { error: "Koordinat latitude dan longitude wajib diisi dengan angka valid." };
  }
  if (isSentinelZeroCoordinate(latitude, longitude)) {
    return { error: "Koordinat (0, 0) tidak valid. Pilih titik lokasi kejadian di peta." };
  }
  if (!isWithinIndonesiaBounds(latitude, longitude)) {
    return {
      error:
        "Koordinat berada di luar batas geografis Indonesia (Lat -11.5..6.5, Lng 94.5..142.0).",
    };
  }

  let estimasiLuas = null;
  if (rawLuas !== "") {
    const numLuas = Number(rawLuas);
    if (!Number.isFinite(numLuas) || numLuas < 0 || numLuas > 1_000_000) {
      return { error: "Estimasi luas harus berupa angka >= 0 (dalam hektar)." };
    }
    estimasiLuas = Number(numLuas.toFixed(2));
  }

  let waktuKejadianIso = new Date().toISOString();
  if (rawWaktu) {
    const parsedDate = new Date(rawWaktu);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "Format waktu kejadian tidak valid." };
    }
    const maxAllowedMs = Date.now() + 24 * 60 * 60 * 1000;
    if (parsedDate.getTime() > maxAllowedMs) {
      return { error: "Waktu kejadian tidak boleh melebihi tanggal hari ini." };
    }
    waktuKejadianIso = parsedDate.toISOString();
  }

  // Pastikan wilayah_id benar-benar ada di database
  const { data: wilayahExists, error: wilayahErr } = await supabase
    .from("wilayah")
    .select("id")
    .eq("id", wilayahId)
    .maybeSingle();

  if (wilayahErr || !wilayahExists) {
    return { error: "Wilayah yang dipilih tidak ditemukan di database." };
  }

  // Validasi foto bukti sebelum mengunggah apa pun
  const { files, error: fileCountErr } = extractValidFiles(
    formData,
    "bukti_foto",
    MAX_PHOTOS_CREATE
  );
  if (fileCountErr) {
    return { error: fileCountErr };
  }

  const preCheck = await preValidateImageFiles(files);
  if (!preCheck.valid) {
    return { error: preCheck.error };
  }

  // Upload foto ke bucket privat `laporan-bukti` terlebih dahulu agar mudah rollback jika DB gagal
  const draftFolder = `laporan-${
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36)
  }`;
  const uploadedFiles = [];

  for (const file of files) {
    const up = await uploadLaporanEvidence(supabase, user.id, draftFolder, file);
    if (up.error || !up.path) {
      await rollbackUploadedPaths(
        supabase,
        uploadedFiles.map((item) => item.path)
      );
      return { error: up.error || "Gagal mengunggah foto bukti kejadian." };
    }
    uploadedFiles.push(up);
  }

  // Insert baris utama ke public.laporan_karhutla (status & pelapor_id selalu dikunci di server)
  const { data: created, error: insertErr } = await supabase
    .from("laporan_karhutla")
    .insert({
      pelapor_id: user.id,
      wilayah_id: wilayahId,
      judul,
      deskripsi,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      status: "menunggu_verifikasi",
      waktu_kejadian: waktuKejadianIso,
      jenis_kejadian: jenisKejadian,
      alamat_lokasi: alamatLokasi || null,
      estimasi_luas: estimasiLuas,
      tingkat_keparahan: tingkatKeparahan || null,
    })
    .select("id")
    .single();

  if (insertErr || !created?.id) {
    await rollbackUploadedPaths(
      supabase,
      uploadedFiles.map((item) => item.path)
    );
    return {
      error:
        insertErr?.message ||
        "Gagal menyimpan laporan karhutla ke database. Silakan coba lagi.",
    };
  }

  // Simpan metadata foto ke public.laporan_foto
  if (uploadedFiles.length > 0) {
    const fotoRows = uploadedFiles.map((item) => ({
      laporan_id: created.id,
      storage_path: item.path,
      uploaded_by: user.id,
      jenis_foto: "bukti_awal",
      mime_type: item.mimeType,
      file_size: item.size,
    }));

    const { error: fotoErr } = await supabase
      .from("laporan_foto")
      .insert(fotoRows);

    if (fotoErr) {
      await rollbackUploadedPaths(
        supabase,
        uploadedFiles.map((item) => item.path)
      );
      return {
        error:
          "Laporan tersimpan, tetapi metadata foto bukti gagal dicatat. Silakan hubungi admin atau unggah ulang.",
      };
    }
  }

  // Catat riwayat status awal pada public.laporan_riwayat_status
  await supabase.from("laporan_riwayat_status").insert({
    laporan_id: created.id,
    status_sebelumnya: null,
    status_baru: "menunggu_verifikasi",
    changed_by: user.id,
    catatan: "Laporan baru dikirim oleh pelapor.",
  });

  revalidateLaporanRoutes(created.id);
  redirect(
    role === "admin"
      ? `/admin/laporan/${created.id}`
      : `/pelapor/laporan/${created.id}`
  );
}

/**
 * Verifikasi, ubah status, tentukan prioritas/keparahan, dan simpan catatan verifikasi (Admin only).
 */
export async function verifyAndUpdateLaporanAction(_prevState, formData) {
  const { supabase, user } = await requireRole(["admin"]);

  const laporanId = String(formData.get("laporan_id") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").toLowerCase().trim();
  const tingkatKeparahan = String(formData.get("tingkat_keparahan") ?? "")
    .toLowerCase()
    .trim();
  const catatan = String(formData.get("catatan_verifikasi") ?? "").trim();

  if (!isUuid(laporanId)) {
    return { error: "ID laporan tidak valid." };
  }
  if (tingkatKeparahan && !ALLOWED_KEPARAHAN.includes(tingkatKeparahan)) {
    return { error: "Tingkat prioritas/keparahan tidak valid." };
  }
  if (catatan.length > 1000) {
    return { error: "Catatan verifikasi maksimal 1000 karakter." };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("laporan_karhutla")
    .select("id, status, tingkat_keparahan, verified_by, verified_at")
    .eq("id", laporanId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { error: "Laporan tidak ditemukan." };
  }

  const currentStatus = normalizeStatusKey(existing.status);
  if (!isValidStatusTransition("admin", currentStatus, nextStatus)) {
    return {
      error: `Transisi status dari "${currentStatus}" ke "${nextStatus}" tidak diizinkan.`,
    };
  }

  if (nextStatus === "ditolak" && catatan.length < 5) {
    return {
      error: "Mohon isi alasan penolakan minimal 5 karakter pada catatan verifikasi.",
    };
  }

  const updatePayload = {
    status: nextStatus,
    tingkat_keparahan: tingkatKeparahan || existing.tingkat_keparahan || null,
    catatan_verifikasi: catatan || null,
  };

  if (
    ["terverifikasi", "ditangani", "selesai", "ditolak"].includes(nextStatus) &&
    !existing.verified_at
  ) {
    updatePayload.verified_by = user.id;
    updatePayload.verified_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from("laporan_karhutla")
    .update(updatePayload)
    .eq("id", laporanId);

  if (updateErr) {
    return {
      error: updateErr.message || "Gagal memperbarui status verifikasi laporan.",
    };
  }

  const statusChanged = currentStatus !== nextStatus;
  if (statusChanged || catatan) {
    await supabase.from("laporan_riwayat_status").insert({
      laporan_id: laporanId,
      status_sebelumnya: currentStatus,
      status_baru: nextStatus,
      changed_by: user.id,
      catatan:
        catatan ||
        (statusChanged
          ? `Status diperbarui oleh admin menjadi ${nextStatus}.`
          : "Catatan/prioritas diperbarui oleh admin."),
    });
  }

  revalidateLaporanRoutes(laporanId);
  return {
    success: `Laporan berhasil diperbarui ke status "${nextStatus.replace("_", " ")}".`,
  };
}

/**
 * Menugaskan atau mengalihkan laporan ke petugas lapangan (Admin only).
 * Trigger DB `trg_sync_laporan_petugas` menyinkronkan `laporan_karhutla.petugas_id`.
 */
export async function assignPetugasAction(_prevState, formData) {
  const { supabase, user } = await requireRole(["admin"]);

  const laporanId = String(formData.get("laporan_id") ?? "").trim();
  const petugasId = String(formData.get("petugas_id") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();

  if (!isUuid(laporanId) || !isUuid(petugasId)) {
    return { error: "Laporan atau petugas yang dipilih tidak valid." };
  }
  if (catatan.length > 500) {
    return { error: "Catatan penugasan maksimal 500 karakter." };
  }

  const [laporanRes, petugasRes] = await Promise.all([
    supabase
      .from("laporan_karhutla")
      .select("id, status, petugas_id")
      .eq("id", laporanId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", petugasId)
      .maybeSingle(),
  ]);

  if (laporanRes.error || !laporanRes.data) {
    return { error: "Laporan tidak ditemukan." };
  }
  if (petugasRes.error || !petugasRes.data) {
    return { error: "Akun petugas tidak ditemukan." };
  }
  if (String(petugasRes.data.role).toLowerCase().trim() !== "petugas") {
    return { error: "Pengguna yang dipilih bukan akun dengan role Petugas." };
  }

  const currentStatus = normalizeStatusKey(laporanRes.data.status);
  if (currentStatus === "ditolak" || currentStatus === "selesai") {
    return {
      error:
        "Laporan yang sudah selesai atau ditolak tidak dapat ditugaskan ke petugas baru.",
    };
  }

  // Batalkan penugasan aktif sebelumnya (jika ada) agar lolos unique partial index
  const { error: cancelPrevErr } = await supabase
    .from("penugasan_laporan")
    .update({ status_penugasan: "dibatalkan" })
    .eq("laporan_id", laporanId)
    .in("status_penugasan", ["ditugaskan", "diterima", "dalam_penanganan"]);

  if (cancelPrevErr) {
    return {
      error:
        cancelPrevErr.message ||
        "Gagal membatalkan penugasan aktif sebelumnya.",
    };
  }

  const { error: insertAssignErr } = await supabase
    .from("penugasan_laporan")
    .insert({
      laporan_id: laporanId,
      petugas_id: petugasId,
      assigned_by: user.id,
      status_penugasan: "ditugaskan",
      catatan: catatan || null,
    });

  if (insertAssignErr) {
    return {
      error: insertAssignErr.message || "Gagal menyimpan penugasan petugas.",
    };
  }

  // Jika laporan masih menunggu_verifikasi, otomatis naikkan ke terverifikasi saat ditugaskan
  if (currentStatus === "menunggu_verifikasi") {
    await supabase
      .from("laporan_karhutla")
      .update({
        status: "terverifikasi",
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", laporanId);

    await supabase.from("laporan_riwayat_status").insert({
      laporan_id: laporanId,
      status_sebelumnya: "menunggu_verifikasi",
      status_baru: "terverifikasi",
      changed_by: user.id,
      catatan: `Diverifikasi dan ditugaskan ke ${petugasRes.data.full_name}.${
        catatan ? ` Catatan: ${catatan}` : ""
      }`,
    });
  } else {
    await supabase.from("laporan_riwayat_status").insert({
      laporan_id: laporanId,
      status_sebelumnya: currentStatus,
      status_baru: currentStatus,
      changed_by: user.id,
      catatan: `Penugasan petugas kepada ${petugasRes.data.full_name}.${
        catatan ? ` Catatan: ${catatan}` : ""
      }`,
    });
  }

  revalidateLaporanRoutes(laporanId);
  return {
    success: `Laporan berhasil ditugaskan kepada ${petugasRes.data.full_name}.`,
  };
}

/**
 * Membatalkan penugasan petugas aktif (Admin only).
 */
export async function cancelPenugasanAction(formData) {
  const { supabase, user } = await requireRole(["admin"]);
  const laporanId = String(formData.get("laporan_id") ?? "").trim();
  if (!isUuid(laporanId)) {
    return { error: "ID laporan tidak valid." };
  }

  const { data: laporan } = await supabase
    .from("laporan_karhutla")
    .select("id, status")
    .eq("id", laporanId)
    .maybeSingle();

  if (!laporan) {
    return { error: "Laporan tidak ditemukan." };
  }

  const { error } = await supabase
    .from("penugasan_laporan")
    .update({ status_penugasan: "dibatalkan" })
    .eq("laporan_id", laporanId)
    .in("status_penugasan", ["ditugaskan", "diterima", "dalam_penanganan"]);

  if (error) {
    return { error: error.message || "Gagal membatalkan penugasan." };
  }

  const statusNow = normalizeStatusKey(laporan.status);
  await supabase.from("laporan_riwayat_status").insert({
    laporan_id: laporanId,
    status_sebelumnya: statusNow,
    status_baru: statusNow,
    changed_by: user.id,
    catatan: "Penugasan petugas aktif dibatalkan oleh admin.",
  });

  revalidateLaporanRoutes(laporanId);
  return { success: "Penugasan aktif berhasil dibatalkan." };
}

/**
 * Menghapus laporan karhutla beserta file bukti privat di Storage (Admin only).
 */
export async function deleteLaporanAction(formData) {
  const { supabase } = await requireRole(["admin"]);
  const laporanId = String(formData.get("laporan_id") ?? "").trim();
  if (!isUuid(laporanId)) {
    return { error: "ID laporan tidak valid." };
  }

  const { data: photos } = await supabase
    .from("laporan_foto")
    .select("storage_path")
    .eq("laporan_id", laporanId);

  const { error } = await supabase
    .from("laporan_karhutla")
    .delete()
    .eq("id", laporanId);

  if (error) {
    return { error: error.message || "Gagal menghapus laporan." };
  }

  for (const photo of photos ?? []) {
    if (photo.storage_path) {
      await deleteStorageObject(
        supabase,
        STORAGE_BUCKETS.LAPORAN,
        photo.storage_path
      );
    }
  }

  revalidateLaporanRoutes(laporanId);
  redirect("/admin/laporan");
}

/**
 * Memperbarui progres penanganan lapangan oleh Petugas (atau Admin).
 * KEAMANAN KETAT: Petugas WAJIB diverifikasi di server bahwa laporan ini benar-benar
 * ditugaskan kepadanya (`laporan.petugas_id === user.id`), tidak boleh memperbarui
 * laporan milik petugas lain atau laporan yang belum ditugaskan!
 */
export async function updatePenangananPetugasAction(_prevState, formData) {
  const { supabase, user, role } = await requireRole(["petugas", "admin"]);

  const laporanId = String(formData.get("laporan_id") ?? "").trim();
  const nextStatus = String(formData.get("status_update") ?? "")
    .toLowerCase()
    .trim();
  const catatan = String(formData.get("catatan_penanganan") ?? "").trim();

  if (!isUuid(laporanId)) {
    return { error: "ID laporan tidak valid." };
  }
  if (catatan.length < 5 || catatan.length > 2000) {
    return {
      error: "Catatan penanganan lapangan harus antara 5 hingga 2000 karakter.",
    };
  }

  const { data: laporan, error: fetchErr } = await supabase
    .from("laporan_karhutla")
    .select("id, status, petugas_id")
    .eq("id", laporanId)
    .maybeSingle();

  if (fetchErr || !laporan) {
    return { error: "Laporan tidak ditemukan." };
  }

  // Otorisasi ketat server-side: petugas hanya boleh mengubah laporan yang ditugaskan kepadanya
  if (role !== "admin" && laporan.petugas_id !== user.id) {
    return {
      error:
        "Akses ditolak: Anda hanya dapat memperbarui progres laporan yang ditugaskan kepada Anda.",
    };
  }

  const currentStatus = normalizeStatusKey(laporan.status);
  if (!isValidStatusTransition("petugas", currentStatus, nextStatus)) {
    return {
      error: `Transisi status dari "${currentStatus}" ke "${nextStatus}" tidak diizinkan untuk alur penanganan lapangan.`,
    };
  }

  // Validasi foto bukti penanganan (opsional 0-2 file)
  const { files, error: fileCountErr } = extractValidFiles(
    formData,
    "foto_penanganan",
    MAX_PHOTOS_PENANGANAN
  );
  if (fileCountErr) {
    return { error: fileCountErr };
  }

  const preCheck = await preValidateImageFiles(files);
  if (!preCheck.valid) {
    return { error: preCheck.error };
  }

  const uploadedFiles = [];
  for (const file of files) {
    const up = await uploadLaporanEvidence(supabase, user.id, laporanId, file);
    if (up.error || !up.path) {
      await rollbackUploadedPaths(
        supabase,
        uploadedFiles.map((item) => item.path)
      );
      return { error: up.error || "Gagal mengunggah foto bukti penanganan." };
    }
    uploadedFiles.push(up);
  }

  // 1. Update status laporan_karhutla (HANYA kolom status — tidak menyentuh kolom administratif!)
  if (currentStatus !== nextStatus) {
    const { error: updateStatusErr } = await supabase
      .from("laporan_karhutla")
      .update({ status: nextStatus })
      .eq("id", laporanId);

    if (updateStatusErr) {
      await rollbackUploadedPaths(
        supabase,
        uploadedFiles.map((item) => item.path)
      );
      return {
        error:
          updateStatusErr.message || "Gagal memperbarui status laporan.",
      };
    }
  }

  // 2. Sinkronkan status penugasan aktif pada penugasan_laporan
  const nextPenugasanStatus =
    nextStatus === "selesai" ? "selesai" : "dalam_penanganan";
  const penugasanUpdate = {
    status_penugasan: nextPenugasanStatus,
    ...(nextStatus === "selesai" ? { completed_at: new Date().toISOString() } : {}),
  };

  let penugasanQuery = supabase
    .from("penugasan_laporan")
    .update(penugasanUpdate)
    .eq("laporan_id", laporanId)
    .in("status_penugasan", ["ditugaskan", "diterima", "dalam_penanganan"]);

  if (role !== "admin") {
    penugasanQuery = penugasanQuery.eq("petugas_id", user.id);
  }
  await penugasanQuery;

  // 3. Simpan metadata foto penanganan ke laporan_foto
  const jenisFoto = nextStatus === "selesai" ? "selesai" : "penanganan";
  if (uploadedFiles.length > 0) {
    const fotoRows = uploadedFiles.map((item) => ({
      laporan_id: laporanId,
      storage_path: item.path,
      uploaded_by: user.id,
      jenis_foto: jenisFoto,
      mime_type: item.mimeType,
      file_size: item.size,
    }));

    const { error: fotoErr } = await supabase
      .from("laporan_foto")
      .insert(fotoRows);

    if (fotoErr) {
      await rollbackUploadedPaths(
        supabase,
        uploadedFiles.map((item) => item.path)
      );
      return {
        error: fotoErr.message || "Gagal mencatat metadata foto penanganan.",
      };
    }
  }

  // 4. Catat log penanganan lapangan ke public.penanganan_log
  const { error: logErr } = await supabase.from("penanganan_log").insert({
    laporan_id: laporanId,
    petugas_id: user.id,
    status_update: nextStatus,
    catatan_penanganan: catatan,
    foto_bukti_url: uploadedFiles[0]?.path ?? null,
  });

  if (logErr) {
    return { error: logErr.message || "Gagal mencatat log penanganan." };
  }

  // 5. Catat riwayat perubahan status pada public.laporan_riwayat_status
  await supabase.from("laporan_riwayat_status").insert({
    laporan_id: laporanId,
    status_sebelumnya: currentStatus,
    status_baru: nextStatus,
    changed_by: user.id,
    catatan,
  });

  revalidateLaporanRoutes(laporanId);
  return {
    success:
      nextStatus === "selesai"
        ? "Penanganan berhasil ditandai SELESAI dan bukti lapangan tercatat."
        : "Progres penanganan lapangan berhasil diperbarui.",
  };
}
