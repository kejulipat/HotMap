"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CoordinatePicker from "@/components/map/CoordinatePicker";
import { createLaporanAction } from "@/lib/actions/laporan";
import { isValidCoordinatePair, isWithinIndonesiaBounds } from "@/lib/gis";
import { validateUploadFile } from "@/lib/storage";
import {
  JENIS_KEJADIAN_OPTIONS,
  TINGKAT_KEPARAHAN_OPTIONS,
} from "@/lib/workflow";

const MAX_FILES = 3;

export default function CreateLaporanForm({ wilayahList = [] }) {
  const [state, dispatch, isPending] = useActionState(createLaporanAction, null);

  const [selectedWilayahId, setSelectedWilayahId] = useState(
    wilayahList[0]?.id ?? ""
  );
  const [latInput, setLatInput] = useState(
    wilayahList[0]?.centerLat != null ? String(wilayahList[0].centerLat) : ""
  );
  const [lngInput, setLngInput] = useState(
    wilayahList[0]?.centerLng != null ? String(wilayahList[0].centerLng) : ""
  );
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const parsedLat = latInput.trim() === "" ? null : Number(latInput);
  const parsedLng = lngInput.trim() === "" ? null : Number(lngInput);
  const validPair = isValidCoordinatePair(parsedLat, parsedLng);
  const insideIndonesia = validPair
    ? isWithinIndonesiaBounds(parsedLat, parsedLng)
    : true;

  const selectedWilayah = useMemo(
    () => wilayahList.find((w) => w.id === selectedWilayahId) ?? null,
    [wilayahList, selectedWilayahId]
  );

  const wilayahCenter = useMemo(() => {
    if (
      selectedWilayah &&
      isValidCoordinatePair(selectedWilayah.centerLat, selectedWilayah.centerLng)
    ) {
      return {
        lat: selectedWilayah.centerLat,
        lng: selectedWilayah.centerLng,
      };
    }
    return null;
  }, [selectedWilayah]);

  function handleWilayahChange(nextId) {
    setSelectedWilayahId(nextId);
    const found = wilayahList.find((w) => w.id === nextId);
    if (found && isValidCoordinatePair(found.centerLat, found.centerLng)) {
      setLatInput(String(found.centerLat));
      setLngInput(String(found.centerLng));
    }
  }

  function handleMapCoordinateChange(nextLat, nextLng) {
    setLatInput(String(nextLat));
    setLngInput(String(nextLng));
  }

  function handleFileChange(e) {
    setFileError("");
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) {
      setSelectedFiles([]);
      return;
    }

    if (incoming.length > MAX_FILES) {
      setFileError(`Maksimal ${MAX_FILES} foto bukti yang dapat diunggah.`);
      e.target.value = "";
      setSelectedFiles([]);
      return;
    }

    const previews = [];
    for (const file of incoming) {
      const check = validateUploadFile(file);
      if (!check.valid) {
        setFileError(`${file.name}: ${check.error}`);
        e.target.value = "";
        setSelectedFiles([]);
        return;
      }
      previews.push({
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setSelectedFiles(previews);
  }

  function handleClearFiles() {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const noWilayah = wilayahList.length === 0;

  return (
    <form action={dispatch} className="space-y-6">
      {noWilayah && (
        <div
          role="alert"
          className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3.5 text-sm text-[#9B4017]"
        >
          <strong>Data master wilayah masih kosong.</strong> Admin perlu
          menambahkan minimal 1 wilayah melalui menu{" "}
          <code className="font-mono bg-white/80 px-1 rounded">
            /admin/wilayah
          </code>{" "}
          sebelum laporan baru dapat dikirim.
        </div>
      )}

      {(state?.error || fileError) && (
        <div
          role="alert"
          className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
        >
          {fileError || state?.error}
        </div>
      )}

      {/* Bagian 1: Informasi Kejadian */}
      <section className="rounded-2xl border border-[#E3E8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#12241B]">
            1. Informasi Kejadian
          </h2>
          <p className="text-xs text-[#6B7A71]">
            Isi keterangan kejadian karhutla selengkap mungkin untuk mempercepat
            verifikasi tim operasional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="judul"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Judul Kejadian <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="judul"
              name="judul"
              type="text"
              required
              minLength={3}
              maxLength={160}
              disabled={isPending || noWilayah}
              placeholder="Contoh: Kebakaran lahan gambut dekat akses Desa Pelalawan"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="wilayah_id"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Wilayah Pemantauan <span className="text-[#C85A28]">*</span>
            </label>
            <select
              id="wilayah_id"
              name="wilayah_id"
              required
              disabled={isPending || noWilayah}
              value={selectedWilayahId}
              onChange={(e) => handleWilayahChange(e.target.value)}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            >
              {noWilayah ? (
                <option value="">Belum ada wilayah tersedia</option>
              ) : (
                wilayahList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama}
                    {w.kabupatenKota ? ` — ${w.kabupatenKota}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="jenis_kejadian"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Jenis Kejadian <span className="text-[#C85A28]">*</span>
            </label>
            <select
              id="jenis_kejadian"
              name="jenis_kejadian"
              defaultValue="kebakaran_lahan"
              disabled={isPending || noWilayah}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            >
              {JENIS_KEJADIAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tingkat_keparahan"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Perkiraan Keparahan
            </label>
            <select
              id="tingkat_keparahan"
              name="tingkat_keparahan"
              defaultValue="sedang"
              disabled={isPending || noWilayah}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            >
              {TINGKAT_KEPARAHAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="estimasi_luas"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Estimasi Luas Terdampak (hektar)
            </label>
            <input
              id="estimasi_luas"
              name="estimasi_luas"
              type="number"
              step="0.01"
              min="0"
              disabled={isPending || noWilayah}
              placeholder="Contoh: 2.5"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="waktu_kejadian"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Waktu Kejadian
            </label>
            <input
              id="waktu_kejadian"
              name="waktu_kejadian"
              type="datetime-local"
              disabled={isPending || noWilayah}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="alamat_lokasi"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Alamat / Patokan Lokasi
            </label>
            <input
              id="alamat_lokasi"
              name="alamat_lokasi"
              type="text"
              maxLength={300}
              disabled={isPending || noWilayah}
              placeholder="Nama desa, dusun, atau patokan akses jalan"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="deskripsi"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Deskripsi Kondisi Lapangan <span className="text-[#C85A28]">*</span>
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              rows={4}
              required
              minLength={5}
              maxLength={3000}
              disabled={isPending || noWilayah}
              placeholder="Jelaskan kondisi api/asap, arah angin, kedekatan dengan pemukiman, dan akses kendaraan pemadam..."
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>
      </section>

      {/* Bagian 2: Lokasi & Peta Interaktif */}
      <section className="rounded-2xl border border-[#E3E8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#12241B]">
            2. Titik Koordinat Lokasi Kejadian
          </h2>
          <p className="text-xs text-[#6B7A71]">
            Pilih titik langsung pada peta, gunakan GPS perangkat, atau masukkan
            koordinat latitude/longitude yang akurat.
          </p>
        </div>

        <CoordinatePicker
          latitude={validPair ? parsedLat : null}
          longitude={validPair ? parsedLng : null}
          wilayahCenter={wilayahCenter}
          onChange={handleMapCoordinateChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="latitude"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Latitude <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              required
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              disabled={isPending || noWilayah}
              placeholder="-2.213600"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 font-mono text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="longitude"
              className="block text-xs font-semibold text-[#4E5E55] mb-1.5"
            >
              Longitude <span className="text-[#C85A28]">*</span>
            </label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              required
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              disabled={isPending || noWilayah}
              placeholder="113.910800"
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2.5 font-mono text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {validPair && !insideIndonesia && (
          <p className="text-xs font-semibold text-[#B83E1B]">
            Koordinat berada di luar wilayah geografis Indonesia (Lat -11.5..6.5,
            Lng 94.5..142.0) dan akan ditolak saat pengiriman.
          </p>
        )}
      </section>

      {/* Bagian 3: Foto Bukti Lapangan */}
      <section className="rounded-2xl border border-[#E3E8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#12241B]">
              3. Foto Bukti Kejadian (Opsional, maks. {MAX_FILES} foto)
            </h2>
            <p className="text-xs text-[#6B7A71]">
              Format JPEG, PNG, atau WebP, maksimal 5 MB per foto. Disimpan aman
              pada bucket privat{" "}
              <code className="font-mono">laporan-bukti</code>.
            </p>
          </div>
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleClearFiles}
              className="text-xs font-semibold text-[#B83E1B] hover:underline cursor-pointer"
            >
              Hapus Pilihan
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          id="bukti_foto"
          name="bukti_foto"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={isPending || noWilayah}
          onChange={handleFileChange}
          className="block w-full text-xs text-[#5F6F66] file:mr-3 file:rounded-lg file:border file:border-[#DCE2DA] file:bg-[#F6F7F3] file:px-3.5 py-2 file:py-2 file:text-xs file:font-semibold file:text-[#14231B] hover:file:bg-[#EAF1EC] disabled:opacity-60"
        />

        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="rounded-xl border border-[#E3E8E1] bg-[#FBFBFA] p-2 space-y-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="h-28 w-full rounded-lg object-cover"
                />
                <p className="truncate text-[11px] font-medium text-[#14231B]">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Link
          href="/pelapor/laporan"
          className="rounded-lg border border-[#DCE2DA] bg-white px-4 py-2.5 text-xs font-semibold text-[#4E5E55] hover:bg-[#F6F7F3]"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={
            isPending || noWilayah || Boolean(fileError) || !validPair || !insideIndonesia
          }
          className="rounded-lg bg-[#C85A28] hover:bg-[#B04B1D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Mengirim Laporan..." : "Kirim Laporan Karhutla"}
        </button>
      </div>
    </form>
  );
}
