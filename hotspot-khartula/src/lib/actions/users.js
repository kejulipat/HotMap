"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/normalizers";
import { invalidateHotmapCache } from "@/lib/server-cache";

const ALLOWED_ROLES = ["admin", "petugas", "pelapor"];

/**
 * Memperbarui profil diri sendiri (hanya full_name & wilayah_id).
 * Kolom `role` sengaja tidak pernah diterima atau diubah oleh pengguna biasa
 * (dilindungi server-side dan RLS `role = private.get_my_role()`).
 */
export async function updateMyProfileAction(_prevState, formData) {
  const { supabase, user, role } = await requireRole([
    "pelapor",
    "petugas",
    "admin",
  ]);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const wilayahRaw = String(formData.get("wilayah_id") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Nama lengkap harus antara 2 hingga 100 karakter." };
  }

  let wilayahId = null;
  if (wilayahRaw) {
    if (!isUuid(wilayahRaw)) {
      return { error: "Pilihan wilayah tidak valid." };
    }
    wilayahId = wilayahRaw;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      wilayah_id: wilayahId,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message || "Gagal memperbarui profil akun." };
  }

  invalidateHotmapCache({ auth: true, data: true });
  revalidatePath(`/${role}/profil`);
  revalidatePath(`/${role}`);
  revalidatePath("/admin/pengguna");

  return { success: "Profil akun Anda berhasil diperbarui." };
}

/**
 * Memperbarui data pengguna (nama, role, wilayah) oleh Admin.
 * Mencegah admin menurunkan role akunnya sendiri secara tidak sengaja.
 */
export async function adminUpdateUserAction(_prevState, formData) {
  const { supabase, user } = await requireRole(["admin"]);

  const targetId = String(formData.get("id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").toLowerCase().trim();
  const wilayahRaw = String(formData.get("wilayah_id") ?? "").trim();

  if (!isUuid(targetId)) {
    return { error: "ID pengguna tidak valid." };
  }
  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Nama lengkap harus antara 2 hingga 100 karakter." };
  }
  if (!ALLOWED_ROLES.includes(nextRole)) {
    return { error: "Role pengguna tidak valid." };
  }
  if (targetId === user.id && nextRole !== "admin") {
    return {
      error:
        "Anda tidak dapat menurunkan role akun admin Anda sendiri untuk mencegah kehilangan akses.",
    };
  }

  let wilayahId = null;
  if (wilayahRaw) {
    if (!isUuid(wilayahRaw)) {
      return { error: "Pilihan wilayah tidak valid." };
    }
    wilayahId = wilayahRaw;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role: nextRole,
      wilayah_id: wilayahId,
    })
    .eq("id", targetId);

  if (error) {
    return { error: error.message || "Gagal memperbarui data pengguna." };
  }

  invalidateHotmapCache({ auth: true, data: true });
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin");

  return {
    success: `Data pengguna "${fullName}" berhasil diperbarui (Role: ${nextRole}).`,
  };
}
