"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isValidCoordinatePair, isWithinIndonesiaBounds } from "@/lib/gis";
import { isUuid } from "@/lib/normalizers";
import { PUBLIC_DATA_CACHE_TAG } from "@/lib/public-cache";
import { invalidateHotmapCache } from "@/lib/server-cache";

function validateWilayahInput(formData) {
  const namaWilayah = String(formData.get("nama_wilayah") ?? "").trim();
  const kabupatenKota = String(formData.get("kabupaten_kota") ?? "").trim();
  const rawLat = String(formData.get("center_lat") ?? "").trim();
  const rawLng = String(formData.get("center_lng") ?? "").trim();

  if (namaWilayah.length < 2 || namaWilayah.length > 120) {
    return { error: "Nama wilayah/provinsi harus antara 2 hingga 120 karakter." };
  }
  if (kabupatenKota.length < 2 || kabupatenKota.length > 120) {
    return { error: "Nama kabupaten/kota harus antara 2 hingga 120 karakter." };
  }

  const centerLat = Number(rawLat);
  const centerLng = Number(rawLng);
  if (!rawLat || !rawLng || !isValidCoordinatePair(centerLat, centerLng)) {
    return {
      error: "Koordinat pusat (center_lat, center_lng) harus berupa angka koordinat valid.",
    };
  }
  if (!isWithinIndonesiaBounds(centerLat, centerLng)) {
    return {
      error:
        "Koordinat pusat berada di luar rentang geografis Indonesia (Lat -11.5..6.5, Lng 94.5..142.0).",
    };
  }

  return {
    nama_wilayah: namaWilayah,
    kabupaten_kota: kabupatenKota,
    center_lat: Number(centerLat.toFixed(6)),
    center_lng: Number(centerLng.toFixed(6)),
  };
}

function mapWilayahDbError(error, fallback) {
  if (error?.code === "23505") {
    return "Kombinasi nama wilayah dan kabupaten/kota tersebut sudah terdaftar.";
  }
  if (error?.code === "23503") {
    return "Wilayah ini tidak dapat dihapus karena masih digunakan oleh laporan atau profil pengguna.";
  }
  return error?.message || fallback;
}

function revalidateWilayahRoutes() {
  invalidateHotmapCache({ data: true });
  revalidateTag(PUBLIC_DATA_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/peta");
  revalidatePath("/admin");
  revalidatePath("/admin/wilayah");
  revalidatePath("/admin/peta");
  revalidatePath("/admin/pengguna");
  revalidatePath("/pelapor/laporan/buat");
}

export async function createWilayahAction(_prevState, formData) {
  const { supabase } = await requireRole(["admin"]);
  const validated = validateWilayahInput(formData);
  if (validated.error) {
    return { error: validated.error };
  }

  const { error } = await supabase.from("wilayah").insert(validated);
  if (error) {
    return { error: mapWilayahDbError(error, "Gagal menambahkan wilayah baru.") };
  }

  revalidateWilayahRoutes();
  return {
    success: `Wilayah "${validated.nama_wilayah} — ${validated.kabupaten_kota}" berhasil ditambahkan.`,
  };
}

export async function updateWilayahAction(_prevState, formData) {
  const { supabase } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (!isUuid(id)) {
    return { error: "ID wilayah tidak valid." };
  }

  const validated = validateWilayahInput(formData);
  if (validated.error) {
    return { error: validated.error };
  }

  const { error } = await supabase
    .from("wilayah")
    .update(validated)
    .eq("id", id);

  if (error) {
    return { error: mapWilayahDbError(error, "Gagal memperbarui data wilayah.") };
  }

  revalidateWilayahRoutes();
  return {
    success: `Wilayah "${validated.nama_wilayah} — ${validated.kabupaten_kota}" berhasil diperbarui.`,
  };
}

export async function deleteWilayahAction(formData) {
  const { supabase } = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "").trim();
  if (!isUuid(id)) {
    return { error: "ID wilayah tidak valid." };
  }

  const { error } = await supabase.from("wilayah").delete().eq("id", id);
  if (error) {
    return { error: mapWilayahDbError(error, "Gagal menghapus wilayah.") };
  }

  revalidateWilayahRoutes();
  return { success: "Wilayah berhasil dihapus." };
}
