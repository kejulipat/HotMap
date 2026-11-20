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

export async function uploadBeritaImage(supabase, userId, file) {
  const check = validateUploadFile(file);
  if (!check.valid) {
    return { path: null, publicUrl: null, error: check.error };
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
