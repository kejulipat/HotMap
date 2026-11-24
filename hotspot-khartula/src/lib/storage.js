export const STORAGE_BUCKETS = {
  BERITA: "berita-images",
  LAPORAN: "laporan-bukti",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MIME_TO_EXTENSIONS = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function getFileExtension(filename) {
  const clean = String(filename ?? "").trim().toLowerCase();
  const lastDot = clean.lastIndexOf(".");
  return lastDot >= 0 ? clean.slice(lastDot) : "";
}

/**
 * Validasi file gambar sebelum diunggah ke Supabase Storage.
 * Mengembalikan `{ valid: true, ext, mimeType, size }` atau `{ valid: false, error }`.
 */
export function validateUploadFile(file) {
  if (!file || typeof file !== "object") {
    return { valid: false, error: "File tidak ditemukan." };
  }

  const size = Number(file.size ?? 0);
  const mimeType = String(file.type ?? "").toLowerCase().trim();
  const ext = getFileExtension(file.name);

  if (!Number.isFinite(size) || size <= 0) {
    return { valid: false, error: "File kosong atau tidak valid." };
  }

  if (size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: "Ukuran file melebihi batas maksimal 5 MB.",
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: "Format file tidak diizinkan. Gunakan gambar JPEG, PNG, atau WebP.",
    };
  }

  const expectedExts = MIME_TO_EXTENSIONS[mimeType] ?? [];
  if (!ext || !expectedExts.includes(ext)) {
    return {
      valid: false,
      error: "Ekstensi file tidak sesuai dengan tipe gambar (gunakan .jpg, .jpeg, .png, atau .webp).",
    };
  }

  return {
    valid: true,
    ext,
    mimeType,
    size,
  };
}

function sanitizeSegment(value, fallback = "item") {
  const cleaned = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || fallback;
}

/**
 * Menghasilkan path penyimpanan unik di bawah folder `userId` untuk kepatuhan Storage RLS.
 */
export function generateSafeStoragePath(userId, folder, originalFilename) {
  const safeUser = sanitizeSegment(userId, "user");
  const safeFolder = sanitizeSegment(folder, "uploads");
  const ext = getFileExtension(originalFilename) || ".jpg";
  const uniqueId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}`;
  return `${safeUser}/${safeFolder}/${Date.now()}-${uniqueId}${ext}`;
}

export function getBeritaImagePublicUrl(supabase, path) {
  if (!supabase || !path) return null;
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.BERITA)
    .getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function verifyImageMagicBytes(file, expectedMimeType) {
  if (!file || typeof file.slice !== "function") {
    return false;
  }

  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return false;

    if (expectedMimeType === "image/jpeg") {
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }

    if (expectedMimeType === "image/png") {
      return (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    }

    if (expectedMimeType === "image/webp") {
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    }

    return false;
  } catch {
    return false;
  }
}

export async function uploadBeritaImage(supabase, userId, file) {
  const check = validateUploadFile(file);
  if (!check.valid) {
    return { path: null, publicUrl: null, error: check.error };
  }

  const signatureValid = await verifyImageMagicBytes(file, check.mimeType);
  if (!signatureValid) {
    return {
      path: null,
      publicUrl: null,
      error: "Konten file tidak sesuai dengan format gambar yang diizinkan (JPEG/PNG/WebP).",
    };
  }

  const storagePath = generateSafeStoragePath(userId, "berita", file.name);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.BERITA)
    .upload(storagePath, file, {
      contentType: check.mimeType,
      upsert: false,
    });

  if (error) {
    return {
      path: null,
      publicUrl: null,
      error: error.message || "Gagal mengunggah gambar berita ke Storage.",
    };
  }

  return {
    path: storagePath,
    publicUrl: getBeritaImagePublicUrl(supabase, storagePath),
    mimeType: check.mimeType,
    size: check.size,
    error: null,
  };
}

export async function uploadLaporanEvidence(supabase, userId, laporanId, file) {
  const check = validateUploadFile(file);
  if (!check.valid) {
    return { path: null, error: check.error };
  }

  const signatureValid = await verifyImageMagicBytes(file, check.mimeType);
  if (!signatureValid) {
    return {
      path: null,
      error: "Konten file tidak sesuai dengan format gambar yang diizinkan (JPEG/PNG/WebP).",
    };
  }

  const storagePath = generateSafeStoragePath(
    userId,
    laporanId || "draft",
    file.name
  );
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.LAPORAN)
    .upload(storagePath, file, {
      contentType: check.mimeType,
      upsert: false,
    });

  if (error) {
    return {
      path: null,
      error: error.message || "Gagal mengunggah foto bukti laporan ke Storage.",
    };
  }

  return {
    path: storagePath,
    mimeType: check.mimeType,
    size: check.size,
    error: null,
  };
}

export async function getLaporanEvidenceSignedUrl(
  supabase,
  path,
  expiresIn = 3600
) {
  if (!supabase || !path) return { signedUrl: null, error: null };
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.LAPORAN)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { signedUrl: null, error: error.message };
  }

  return { signedUrl: data?.signedUrl ?? null, error: null };
}

export async function deleteStorageObject(supabase, bucket, path) {
  if (!supabase || !path) return { error: null };
  if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
    return { error: "Bucket Storage tidak valid." };
  }
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error: error ? error.message : null };
}
