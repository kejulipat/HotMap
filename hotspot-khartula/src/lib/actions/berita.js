"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  STORAGE_BUCKETS,
  deleteStorageObject,
  uploadBeritaImage,
} from "@/lib/storage";

const ALLOWED_CATEGORIES = ["informasi", "peringatan", "penanganan", "edukasi"];
const ALLOWED_STATUSES = ["draft", "published", "archived"];

function slugify(input) {
  const base = String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "berita";
}

function validateBeritaFields(formData) {
  const judul = String(formData.get("judul") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const ringkasan = String(formData.get("ringkasan") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "informasi")
    .toLowerCase()
    .trim();
  const status = String(formData.get("status") ?? "draft")
    .toLowerCase()
    .trim();

  if (judul.length < 3) {
    return { error: "Judul berita minimal 3 karakter." };
  }
  if (isi.length < 10) {
    return { error: "Isi berita minimal 10 karakter." };
  }
  if (!ALLOWED_CATEGORIES.includes(kategori)) {
    return { error: "Kategori berita tidak valid." };
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return { error: "Status publikasi berita tidak valid." };
  }

  return {
    judul,
    slugInput,
    ringkasan: ringkasan || null,
    isi,
    kategori,
    status,
  };
}

function formatDbError(error, fallback) {
  if (error?.code === "PGRST205") {
    return "Tabel public.berita belum tersedia di database live. Terapkan migration 20261118000100_fase1_5_berita.sql terlebih dahulu.";
  }
  if (error?.code === "23505") {
    return "Slug berita sudah digunakan oleh artikel lain. Gunakan slug yang berbeda.";
  }
  return error?.message || fallback;
}

export async function createBeritaAction(_prevState, formData) {
  const { supabase, user } = await requireRole(["admin"]);
  const validated = validateBeritaFields(formData);
  if (validated.error) {
    return { error: validated.error };
  }

  const slug = validated.slugInput
    ? slugify(validated.slugInput)
    : `${slugify(validated.judul)}-${Date.now().toString(36).slice(-4)}`;

  let gambarPath = null;
  let gambarUrl = null;
  const imageFile = formData.get("gambar");

  if (imageFile && typeof imageFile === "object" && Number(imageFile.size ?? 0) > 0) {
    const uploadRes = await uploadBeritaImage(supabase, user.id, imageFile);
    if (uploadRes.error) {
      return { error: uploadRes.error };
    }
    gambarPath = uploadRes.path;
    gambarUrl = uploadRes.publicUrl;
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("berita").insert({
    judul: validated.judul,
    slug,
    ringkasan: validated.ringkasan,
    isi: validated.isi,
    kategori: validated.kategori,
    status: validated.status,
    gambar_path: gambarPath,
    gambar_url: gambarUrl,
    author_id: user.id,
    published_at: validated.status === "published" ? nowIso : null,
  });

  if (error) {
    if (gambarPath) {
      await deleteStorageObject(supabase, STORAGE_BUCKETS.BERITA, gambarPath);
    }
    return { error: formatDbError(error, "Gagal menyimpan berita baru.") };
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath("/admin/berita");

  return {
    success: `Berita "${validated.judul}" berhasil disimpan (${validated.status}).`,
  };
}

export async function updateBeritaAction(_prevState, formData) {
  const { supabase, user } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "ID berita tidak valid." };
  }

  const validated = validateBeritaFields(formData);
  if (validated.error) {
    return { error: validated.error };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("berita")
    .select("id, gambar_path, gambar_url, published_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return { error: formatDbError(fetchErr, "Gagal memeriksa data berita.") };
  }
  if (!existing) {
    return { error: "Berita tidak ditemukan." };
  }

  let gambarPath = existing.gambar_path;
  let gambarUrl = existing.gambar_url;
  const imageFile = formData.get("gambar");
  let newlyUploadedPath = null;

  if (imageFile && typeof imageFile === "object" && Number(imageFile.size ?? 0) > 0) {
    const uploadRes = await uploadBeritaImage(supabase, user.id, imageFile);
    if (uploadRes.error) {
      return { error: uploadRes.error };
    }
    newlyUploadedPath = uploadRes.path;
    gambarPath = uploadRes.path;
    gambarUrl = uploadRes.publicUrl;
  }

  const slug = validated.slugInput
    ? slugify(validated.slugInput)
    : slugify(validated.judul);

  const publishedAt =
    validated.status === "published"
      ? existing.published_at ?? new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("berita")
    .update({
      judul: validated.judul,
      slug,
      ringkasan: validated.ringkasan,
      isi: validated.isi,
      kategori: validated.kategori,
      status: validated.status,
      gambar_path: gambarPath,
      gambar_url: gambarUrl,
      published_at: publishedAt,
    })
    .eq("id", id);

  if (error) {
    if (newlyUploadedPath) {
      await deleteStorageObject(
        supabase,
        STORAGE_BUCKETS.BERITA,
        newlyUploadedPath
      );
    }
    return { error: formatDbError(error, "Gagal memperbarui berita.") };
  }

  if (newlyUploadedPath && existing.gambar_path) {
    await deleteStorageObject(
      supabase,
      STORAGE_BUCKETS.BERITA,
      existing.gambar_path
    );
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath(`/berita/${id}`);
  revalidatePath("/admin/berita");

  return {
    success: `Berita "${validated.judul}" berhasil diperbarui.`,
  };
}

export async function deleteBeritaAction(formData) {
  const { supabase } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "ID berita tidak valid." };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("berita")
    .select("id, gambar_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return { error: formatDbError(fetchErr, "Gagal memeriksa berita.") };
  }
  if (!existing) {
    return { error: "Berita tidak ditemukan atau sudah terhapus." };
  }

  const { error } = await supabase.from("berita").delete().eq("id", id);
  if (error) {
    return { error: formatDbError(error, "Gagal menghapus berita.") };
  }

  if (existing.gambar_path) {
    await deleteStorageObject(
      supabase,
      STORAGE_BUCKETS.BERITA,
      existing.gambar_path
    );
  }

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath("/admin/berita");

  return { success: "Berita berhasil dihapus." };
}
