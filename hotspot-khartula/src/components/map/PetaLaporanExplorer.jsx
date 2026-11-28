"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import HotmapMap from "@/components/map/HotmapMap";
import { EmptyState, StatusBadge } from "@/components/ui/SharedUI";
import {
  formatCoordinates,
  getGoogleMapsUrl,
  getOsmUrl,
  isValidCoordinatePair,
} from "@/lib/gis";
import {
  STATUS_META,
  SUMMARY_CARDS,
  computeStatusCounts,
  formatDate,
} from "@/lib/normalizers";
import {
  TINGKAT_KEPARAHAN_OPTIONS,
  getJenisKejadianLabel,
  getKeparahanMeta,
} from "@/lib/workflow";

export default function PetaLaporanExplorer({
  laporanList = [],
  wilayahList = [],
  detailHrefPrefix = null,
  currentUserId = null,
  enablePetugasScope = false,
  title = "Peta Sebaran Kejadian Karhutla",
  subtitle = "Klik marker pada peta atau baris pada daftar untuk menyinkronkan lokasi kejadian.",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [wilayahFilter, setWilayahFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [keparahanFilter, setKeparahanFilter] = useState("semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [petugasScope, setPetugasScope] = useState("semua"); // 'semua' | 'tugas_saya'
  const [selectedId, setSelectedId] = useState(laporanList[0]?.id ?? null);
  const [focusTarget, setFocusTarget] = useState(null);

  const wilayahOptions = useMemo(() => {
    const names = new Set(wilayahList.map((w) => w.nama).filter(Boolean));
    for (const item of laporanList) {
      if (item.wilayah) names.add(item.wilayah);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [wilayahList, laporanList]);

  const wilayahByName = useMemo(() => {
    const map = new Map();
    for (const w of wilayahList) {
      if (w.nama) map.set(w.nama, w);
    }
    return map;
  }, [wilayahList]);

  const baseFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return laporanList.filter((item) => {
      if (
        enablePetugasScope &&
        petugasScope === "tugas_saya" &&
        currentUserId &&
        item.petugasId !== currentUserId
      ) {
        return false;
      }
      if (wilayahFilter !== "semua" && item.wilayah !== wilayahFilter) {
        return false;
      }
      if (
        keparahanFilter !== "semua" &&
        (item.tingkatKeparahan ?? "") !== keparahanFilter
      ) {
        return false;
      }
      if (startDate && item.tanggal && item.tanggal < startDate) {
        return false;
      }
      if (endDate && item.tanggal && item.tanggal > endDate) {
        return false;
      }
      if (q) {
        const haystack = [
          item.judul,
          item.wilayah,
          item.alamatLokasi,
          item.deskripsi,
          item.petugas,
          item.pelapor,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    laporanList,
    enablePetugasScope,
    petugasScope,
    currentUserId,
    wilayahFilter,
    keparahanFilter,
    startDate,
    endDate,
    searchQuery,
  ]);

  const counts = useMemo(
    () => computeStatusCounts(baseFiltered),
    [baseFiltered]
  );

  const filteredLaporan = useMemo(() => {
    if (statusFilter === "semua") return baseFiltered;
    return baseFiltered.filter((item) => item.statusKey === statusFilter);
  }, [baseFiltered, statusFilter]);

  const selectedReport = useMemo(
    () =>
      filteredLaporan.find((item) => item.id === selectedId) ??
      filteredLaporan[0] ??
      null,
    [filteredLaporan, selectedId]
  );

  function handleSelectFromList(item) {
    setSelectedId(item.id);
    if (isValidCoordinatePair(item.latitude, item.longitude)) {
      setFocusTarget((prev) => ({
        lat: item.latitude,
        lng: item.longitude,
        zoom: 12,
        reportId: item.id,
        seq: (prev?.seq ?? 0) + 1,
      }));
    }
  }

  function handleWilayahChange(nextWilayah) {
    setWilayahFilter(nextWilayah);
    if (nextWilayah !== "semua") {
      const w = wilayahByName.get(nextWilayah);
      if (w && isValidCoordinatePair(w.centerLat, w.centerLng)) {
        setFocusTarget((prev) => ({
          lat: w.centerLat,
          lng: w.centerLng,
          zoom: 9,
          seq: (prev?.seq ?? 0) + 1,
        }));
      }
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setWilayahFilter("semua");
    setStatusFilter("semua");
    setKeparahanFilter("semua");
    setStartDate("");
    setEndDate("");
    setPetugasScope("semua");
  }

  const googleMapsUrl = selectedReport
    ? getGoogleMapsUrl(selectedReport.latitude, selectedReport.longitude)
    : null;
  const osmUrl = selectedReport
    ? getOsmUrl(selectedReport.latitude, selectedReport.longitude)
    : null;
  const selectedKeparahan = selectedReport
    ? getKeparahanMeta(selectedReport.tingkatKeparahan)
    : null;

  return (
    <div className="space-y-6">
      {/* Kartu Ringkasan Status Interaktif */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SUMMARY_CARDS.map((card) => {
          const isActive = statusFilter === card.key;
          const isPrimary = card.key === "semua";
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key)}
              className={`text-left rounded-xl p-3.5 transition-all border cursor-pointer ${
                isPrimary
                  ? "bg-[#557029] text-white border-[#557029] shadow-2xs"
                  : isActive
                  ? "bg-white text-[#2C3325] border-[#557029] ring-2 ring-[#557029]/20"
                  : "bg-white text-[#2C3325] border-[#DCE0D5] hover:border-[#8A947D]"
              }`}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold">
                  {counts[card.key] ?? 0}
                </span>
                <span
                  className={`text-xs ${
                    isPrimary ? "text-white/80" : "text-[#6B7263]"
                  }`}
                >
                  laporan
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${card.dotColor}`}
                />
                <span className="truncate">{card.label}</span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Filter Bar Multi-Dimensi */}
      <section className="rounded-2xl border border-[#DCE0D5] bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#2C3325]">{title}</h2>
            <p className="text-xs text-[#6B7263]">{subtitle}</p>
          </div>

          {enablePetugasScope && currentUserId && (
            <div className="inline-flex rounded-lg border border-[#8A947D] bg-[#F7F8F2] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPetugasScope("semua")}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  petugasScope === "semua"
                    ? "bg-[#557029] text-white"
                    : "text-[#4A5243] hover:text-[#2C3325]"
                }`}
              >
                Semua Laporan
              </button>
              <button
                type="button"
                onClick={() => setPetugasScope("tugas_saya")}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  petugasScope === "tugas_saya"
                    ? "bg-[#557029] text-white"
                    : "text-[#4A5243] hover:text-[#2C3325]"
                }`}
              >
                Ditugaskan ke Saya
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label
              htmlFor="peta-search"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Pencarian Lokasi / Judul
            </label>
            <input
              id="peta-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, alamat, wilayah..."
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="peta-wilayah"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Wilayah
            </label>
            <select
              id="peta-wilayah"
              value={wilayahFilter}
              onChange={(e) => handleWilayahChange(e.target.value)}
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            >
              <option value="semua">Semua wilayah</option>
              {wilayahOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="peta-status"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Status
            </label>
            <select
              id="peta-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            >
              <option value="semua">Semua status</option>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="peta-keparahan"
              className="block text-xs font-semibold text-[#4A5243] mb-1"
            >
              Prioritas / Keparahan
            </label>
            <select
              id="peta-keparahan"
              value={keparahanFilter}
              onChange={(e) => setKeparahanFilter(e.target.value)}
              className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-3 py-2 text-sm text-[#2C3325] focus:border-[#557029] focus:outline-none"
            >
              <option value="semua">Semua prioritas</option>
              {TINGKAT_KEPARAHAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="peta-start"
                className="block text-xs font-semibold text-[#4A5243] mb-1"
              >
                Dari Tanggal
              </label>
              <input
                id="peta-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-2.5 py-2 text-xs text-[#2C3325] focus:border-[#557029] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="peta-end"
                className="block text-xs font-semibold text-[#4A5243] mb-1"
              >
                Sampai
              </label>
              <input
                id="peta-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#8A947D] bg-[#F7F8F2] px-2.5 py-2 text-xs text-[#2C3325] focus:border-[#557029] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7263] pt-1">
          <span>
            Menampilkan <strong>{filteredLaporan.length}</strong> dari{" "}
            {laporanList.length} laporan.
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="font-semibold text-[#557029] hover:underline cursor-pointer"
          >
            Atur ulang semua filter
          </button>
        </div>

        {/* Kanvas Peta + Panel Detail Terpilih */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8">
            <HotmapMap
              laporan={filteredLaporan}
              selectedId={selectedReport?.id ?? null}
              onSelectReport={(id) => setSelectedId(id)}
              detailHrefPrefix={detailHrefPrefix}
              focusTarget={focusTarget}
              heightClass="h-[380px] sm:h-[440px] lg:h-[500px]"
            />
          </div>

          <aside className="lg:col-span-4 rounded-xl border border-[#DCE0D5] bg-[#F7F8F2] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7263]">
                Detail Titik Terpilih
              </span>
              {selectedKeparahan && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${selectedKeparahan.badgeBg} ${selectedKeparahan.badgeText}`}
                >
                  {selectedKeparahan.label}
                </span>
              )}
            </div>

            {!selectedReport ? (
              <p className="text-xs text-[#6B7263] py-6 text-center">
                Pilih titik marker pada peta atau baris pada daftar untuk
                melihat informasi kejadian.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#2C3325] leading-snug">
                    {selectedReport.judul}
                  </h3>
                  <StatusBadge statusKey={selectedReport.statusKey} />
                </div>

                <dl className="divide-y divide-[#DCE0D5] text-xs">
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#6B7263]">Wilayah</dt>
                    <dd className="font-semibold text-[#2C3325] text-right">
                      {selectedReport.wilayah}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#6B7263]">Jenis Kejadian</dt>
                    <dd className="font-semibold text-[#2C3325] text-right">
                      {getJenisKejadianLabel(selectedReport.jenisKejadian)}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#6B7263]">Estimasi Luas</dt>
                    <dd className="font-semibold text-[#2C3325] text-right">
                      {selectedReport.estimasiLuas}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#6B7263]">Koordinat</dt>
                    <dd className="font-mono font-semibold text-[#2C3325] text-right">
                      {formatCoordinates(
                        selectedReport.latitude,
                        selectedReport.longitude,
                        5
                      )}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#6B7263]">Tanggal</dt>
                    <dd className="font-semibold text-[#2C3325] text-right">
                      {formatDate(selectedReport.tanggal, "short")}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#6B7263]">Petugas</dt>
                    <dd className="font-semibold text-[#2C3325] text-right">
                      {selectedReport.petugas}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2 pt-1">
                  {detailHrefPrefix && (
                    <Link
                      href={`${detailHrefPrefix}/${selectedReport.id}`}
                      className="flex-1 text-center rounded-lg bg-[#557029] hover:bg-[#465D21] px-3 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      Buka Detail &amp; Aksi &rarr;
                    </Link>
                  )}
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[#8A947D] bg-white px-3 py-2 text-xs font-semibold text-[#2C3325] hover:bg-[#EEF2E4]"
                    >
                      Google Maps
                    </a>
                  )}
                  {osmUrl && (
                    <a
                      href={osmUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[#8A947D] bg-white px-3 py-2 text-xs font-semibold text-[#4A5243] hover:bg-[#EEF2E4]"
                    >
                      OSM
                    </a>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>

      {/* Tabel Daftar Titik Tersinkronisasi */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#2C3325]">
            Daftar Titik Laporan ({filteredLaporan.length})
          </h2>
          <span className="text-xs text-[#6B7263]">
            Klik baris untuk mengarahkan peta ke lokasi
          </span>
        </div>

        {filteredLaporan.length === 0 ? (
          <EmptyState
            title="Tidak ada laporan sesuai filter"
            description="Coba ubah rentang tanggal, wilayah, status, atau kata kunci pencarian Anda."
          />
        ) : (
          <div className="rounded-xl bg-white border border-[#DCE0D5] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EEF2E4] border-b border-[#DCE0D5] text-[11px] font-bold uppercase tracking-wider text-[#6B7263]">
                    <th className="py-3 px-4 sm:px-5">Kejadian</th>
                    <th className="py-3 px-4">Wilayah</th>
                    <th className="py-3 px-4">Koordinat</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Status</th>
                    {detailHrefPrefix && (
                      <th className="py-3 px-4 sm:px-5 text-right">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE0D5] text-sm">
                  {filteredLaporan.map((item) => {
                    const isSelected = selectedReport?.id === item.id;
                    const kep = getKeparahanMeta(item.tingkatKeparahan);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleSelectFromList(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? "bg-[#FDF2EA]" : "hover:bg-[#F7F8F2]"
                        }`}
                      >
                        <td className="py-3 px-4 sm:px-5">
                          <p className="font-semibold text-[#2C3325]">
                            {item.judul}
                          </p>
                          {kep && (
                            <span
                              className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${kep.badgeBg} ${kep.badgeText}`}
                            >
                              {kep.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs sm:text-sm text-[#6B7263]">
                          {item.wilayah}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-[#6B7263]">
                          {formatCoordinates(item.latitude, item.longitude, 4)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#6B7263]">
                          {formatDate(item.tanggal, "short")}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge statusKey={item.statusKey} />
                        </td>
                        {detailHrefPrefix && (
                          <td
                            className="py-3 px-4 sm:px-5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`${detailHrefPrefix}/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#8A947D] bg-white px-3 py-1.5 text-xs font-semibold text-[#557029] hover:bg-[#EEF2E4]"
                            >
                              Detail &rarr;
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
