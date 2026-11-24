"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import HotmapMap from "@/components/map/HotmapMap";
import { StatusBadge } from "@/components/ui/SharedUI";
import {
  formatCoordinates,
  getGoogleMapsUrl,
  isValidCoordinatePair,
} from "@/lib/gis";
import {
  STATUS_META,
  SUMMARY_CARDS,
  computeStatusCounts,
  formatDate,
} from "@/lib/normalizers";

export default function LandingExplorer({
  initialLaporan = [],
  wilayahList = [],
  beritaList = [],
  hasQueryError = false,
  currentUser = null,
}) {
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftWilayah, setDraftWilayah] = useState("semua");
  const [draftStatus, setDraftStatus] = useState("semua");

  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    wilayah: "semua",
    status: "semua",
  });

  const defaultSelected =
    initialLaporan.find((item) => item.statusKey === "ditangani") ??
    initialLaporan[0] ??
    null;
  const [selectedId, setSelectedId] = useState(defaultSelected?.id ?? null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [focusTarget, setFocusTarget] = useState(null);

  const wilayahByName = useMemo(() => {
    const map = new Map();
    for (const w of wilayahList) {
      if (w.nama) map.set(w.nama, w);
    }
    return map;
  }, [wilayahList]);

  const baseFilteredLaporan = useMemo(() => {
    return initialLaporan.filter((item) => {
      if (
        appliedFilters.wilayah !== "semua" &&
        item.wilayah !== appliedFilters.wilayah
      ) {
        return false;
      }
      if (
        appliedFilters.startDate &&
        item.tanggal &&
        item.tanggal < appliedFilters.startDate
      ) {
        return false;
      }
      if (
        appliedFilters.endDate &&
        item.tanggal &&
        item.tanggal > appliedFilters.endDate
      ) {
        return false;
      }
      return true;
    });
  }, [
    initialLaporan,
    appliedFilters.wilayah,
    appliedFilters.startDate,
    appliedFilters.endDate,
  ]);

  const counts = useMemo(
    () => computeStatusCounts(baseFilteredLaporan),
    [baseFilteredLaporan]
  );

  const wilayahOptions = useMemo(() => {
    const set = new Set(wilayahList.map((w) => w.nama).filter(Boolean));
    for (const item of initialLaporan) {
      if (item.wilayah) set.add(item.wilayah);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [wilayahList, initialLaporan]);

  const filteredLaporan = useMemo(() => {
    if (appliedFilters.status === "semua") return baseFilteredLaporan;
    return baseFilteredLaporan.filter(
      (item) => item.statusKey === appliedFilters.status
    );
  }, [baseFilteredLaporan, appliedFilters.status]);

  const selectedReport = useMemo(() => {
    return (
      filteredLaporan.find((item) => item.id === selectedId) ??
      filteredLaporan[0] ??
      null
    );
  }, [filteredLaporan, selectedId]);

  function handleApplyFilter(e) {
    e.preventDefault();
    setAppliedFilters({
      startDate: draftStartDate,
      endDate: draftEndDate,
      wilayah: draftWilayah,
      status: draftStatus,
    });
    if (draftWilayah !== "semua") {
      const w = wilayahByName.get(draftWilayah);
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

  function handleResetFilter() {
    setDraftStartDate("");
    setDraftEndDate("");
    setDraftWilayah("semua");
    setDraftStatus("semua");
    setAppliedFilters({
      startDate: "",
      endDate: "",
      wilayah: "semua",
      status: "semua",
    });
  }

  function handleQuickStatusCard(statusKey) {
    setDraftStatus(statusKey);
    setAppliedFilters((prev) => ({
      ...prev,
      status: statusKey,
    }));
  }

  function handleSelectReport(id, shouldFly = false) {
    setSelectedId(id);
    setIsDetailOpen(true);
    if (shouldFly) {
      const found = filteredLaporan.find((r) => r.id === id);
      if (found && isValidCoordinatePair(found.latitude, found.longitude)) {
        setFocusTarget((prev) => ({
          lat: found.latitude,
          lng: found.longitude,
          zoom: 12,
          reportId: found.id,
          seq: (prev?.seq ?? 0) + 1,
        }));
      }
    }
  }

  const googleMapsUrl = selectedReport
    ? getGoogleMapsUrl(selectedReport.latitude, selectedReport.longitude)
    : null;

  return (
    <div className="min-h-screen bg-[#F6F7F3] text-[#14231B] flex flex-col font-sans">
      <PublicNavbar currentUser={currentUser} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
        {hasQueryError && (
          <div
            role="alert"
            className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
          >
            Sebagian data gagal dimuat dari database. Silakan muat ulang halaman
            beberapa saat lagi.
          </div>
        )}

        {/* Hero Header */}
        <section className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1E6B4E]">
              PEMANTAUAN KEBAKARAN HUTAN &amp; LAHAN
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#12241B] leading-[1.2]">
              Pantau titik karhutla di seluruh wilayah, dari laporan warga
              sampai penanganan selesai.
            </h1>
            <p className="text-sm sm:text-base text-[#5E6D64]">
              Data terkini kejadian kebakaran hutan dan lahan. Lihat lokasi,
              status, dan tindak lanjut petugas.
            </p>
          </div>

          <div className="self-start rounded-xl bg-[#EAF1EC] border border-[#D5E2D8] px-4 py-3 min-w-[210px]">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#5F7267]">
              CAKUPAN PEMANTAUAN
            </span>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#155E42]">
              <span className="h-2 w-2 rounded-full bg-[#155E42]" />
              <span>Seluruh Indonesia</span>
            </div>
          </div>
        </section>

        {/* 6 Status Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {SUMMARY_CARDS.map((card) => {
            const isActive = appliedFilters.status === card.key;
            const isPrimaryCard = card.key === "semua";
            const count = counts[card.key] ?? 0;

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => handleQuickStatusCard(card.key)}
                className={`text-left rounded-xl p-4 transition-all border cursor-pointer ${
                  isPrimaryCard
                    ? "bg-[#155E42] text-white border-[#155E42] shadow-sm"
                    : isActive
                    ? "bg-white text-[#14231B] border-[#155E42] ring-2 ring-[#155E42]/20"
                    : "bg-white text-[#14231B] border-[#E3E8E1] hover:border-[#C5D1C8]"
                }`}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {count}
                  </span>
                  <span
                    className={`text-xs ${
                      isPrimaryCard ? "text-white/80" : "text-[#6D7C73]"
                    }`}
                  >
                    laporan
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${card.dotColor}`}
                  />
                  <span
                    className={`truncate ${
                      isPrimaryCard ? "text-white/95" : "text-[#4E5E55]"
                    }`}
                  >
                    {card.label}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Filter Bar */}
        <section className="rounded-xl bg-white border border-[#E3E8E1] p-4 sm:p-5 shadow-2xs">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
          >
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[#5A6960] mb-1.5">
                Dari tanggal
              </label>
              <input
                type="date"
                value={draftStartDate}
                onChange={(e) => setDraftStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[#5A6960] mb-1.5">
                Sampai tanggal
              </label>
              <input
                type="date"
                value={draftEndDate}
                onChange={(e) => setDraftEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-[#5A6960] mb-1.5">
                Wilayah
              </label>
              <select
                value={draftWilayah}
                onChange={(e) => setDraftWilayah(e.target.value)}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
              >
                <option value="semua">Semua wilayah</option>
                {wilayahOptions.map((wilayah) => (
                  <option key={wilayah} value={wilayah}>
                    {wilayah}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[#5A6960] mb-1.5">
                Status
              </label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
              >
                <option value="semua">Semua status</option>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-[#155E42] hover:bg-[#114B35] px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Tampilkan
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3 py-2.5 text-sm font-medium text-[#5A6960] hover:text-[#14231B] transition-colors cursor-pointer"
              >
                Atur ulang
              </button>
            </div>
          </form>
        </section>

        {/* Peta Sebaran Karhutla Interaktif (Leaflet) */}
        <section className="rounded-2xl bg-white border border-[#E3E8E1] p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#12241B]">
                Peta sebaran karhutla
              </h2>
              <p className="text-xs text-[#6B7A71]">
                {filteredLaporan.length} laporan warga &bull;{" "}
                {appliedFilters.wilayah === "semua"
                  ? "Seluruh wilayah"
                  : appliedFilters.wilayah}
              </p>
            </div>
            <Link
              href="/peta"
              className="self-start sm:self-auto rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3.5 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
            >
              Buka Peta Karhutla &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className={isDetailOpen && selectedReport ? "lg:col-span-8" : "lg:col-span-12"}>
              <HotmapMap
                laporan={filteredLaporan}
                selectedId={selectedReport?.id ?? null}
                onSelectReport={(id) => handleSelectReport(id, false)}
                focusTarget={focusTarget}
                heightClass="h-[380px] sm:h-[440px] lg:h-[480px]"
              />
            </div>

            {isDetailOpen && selectedReport && (
              <aside className="lg:col-span-4 rounded-xl border border-[#E2E8E0] bg-[#FBFBFA] p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7A71]">
                      LAPORAN TERPILIH
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(false)}
                      aria-label="Tutup panel laporan terpilih"
                      className="text-[#6B7A71] hover:text-[#14231B] text-base leading-none cursor-pointer"
                    >
                      &#10005;
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#14231B] leading-snug">
                      {selectedReport.judul}
                    </h3>
                    <StatusBadge
                      statusKey={selectedReport.statusKey}
                      className="mt-2"
                    />
                  </div>

                  <div className="rounded-lg bg-white p-3.5 border border-[#E7ECE5]">
                    <span className="block text-xs text-[#6B7A71]">
                      Estimasi luas
                    </span>
                    <span className="mt-0.5 block text-2xl font-bold text-[#14231B]">
                      {selectedReport.estimasiLuas}
                    </span>
                  </div>

                  <dl className="divide-y divide-[#ECEFE9] text-xs">
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-[#6B7A71]">Wilayah</dt>
                      <dd className="font-semibold text-[#14231B] text-right">
                        {selectedReport.wilayah}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-[#6B7A71]">Koordinat</dt>
                      <dd className="font-mono font-semibold text-[#14231B] text-right">
                        {formatCoordinates(
                          selectedReport.latitude,
                          selectedReport.longitude,
                          5
                        )}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-[#6B7A71]">Tanggal</dt>
                      <dd className="font-semibold text-[#14231B] text-right">
                        {selectedReport.tanggal}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-[#6B7A71]">Petugas</dt>
                      <dd className="font-semibold text-[#14231B] text-right">
                        {selectedReport.petugas}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="pt-3 border-t border-[#ECEFE9] flex items-center justify-between gap-2 text-[11px] text-[#7A8880]">
                  <span>
                    Laporan warga &bull; {formatDate(selectedReport.tanggal)}
                  </span>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#155E42] hover:underline"
                    >
                      Google Maps &rarr;
                    </a>
                  )}
                </div>
              </aside>
            )}
          </div>
        </section>

        {/* Daftar Laporan Section */}
        <section className="space-y-3.5 pt-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#12241B]">
                Daftar laporan
              </h2>
              <p className="text-xs sm:text-sm text-[#606F67]">
                Klik baris kejadian untuk mengarahkan peta ke koordinat titik
                laporan.
              </p>
            </div>
            <span className="text-xs font-medium text-[#606F67]">
              {filteredLaporan.length} laporan
            </span>
          </div>

          <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                    <th className="py-3.5 px-4 sm:px-6">Kejadian</th>
                    <th className="py-3.5 px-4">Wilayah &amp; Tanggal</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFE9] text-sm">
                  {filteredLaporan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-10 text-center text-sm text-[#6B7A71]"
                      >
                        Tidak ada laporan yang sesuai dengan filter yang
                        dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredLaporan.map((item, idx) => {
                      const isSelected = selectedReport?.id === item.id;
                      const rowNumber = String(idx + 1).padStart(2, "0");

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectReport(item.id, true)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#FDF2EA]"
                              : "hover:bg-[#F9FAF8]"
                          }`}
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3.5">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${
                                  isSelected
                                    ? "bg-[#F7DFD0] text-[#B8451A]"
                                    : "bg-[#F0F3EE] text-[#64736A]"
                                }`}
                              >
                                {rowNumber}
                              </span>
                              <span className="font-semibold text-[#14231B]">
                                {item.judul}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-[#5F6F66]">
                            {item.wilayah}, {item.tanggal}
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge statusKey={item.statusKey} />
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right text-[#6B7A71]">
                            &rarr;
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Berita Terbaru Section */}
        <section className="space-y-4 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#12241B]">Berita terbaru</h2>
              <p className="text-xs sm:text-sm text-[#606F67]">
                Informasi dan imbauan terbaru dari admin HotMap.
              </p>
            </div>
            <Link
              href="/berita"
              className="text-xs font-semibold text-[#155E42] hover:underline"
            >
              Lihat semua berita &rarr;
            </Link>
          </div>

          {beritaList.length === 0 ? (
            <p className="text-sm text-[#6B7A71]">Belum ada berita terbaru.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {beritaList.map((berita) => (
                <Link
                  key={berita.id}
                  href={`/berita/${berita.slug || berita.id}`}
                  className="group rounded-xl bg-white border border-[#E3E8E1] p-3.5 shadow-2xs hover:border-[#C5D1C8] hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 w-full rounded-lg overflow-hidden mb-3.5 bg-linear-to-b from-[#2E3834] via-[#7A5438] to-[#D47A42]">
                      {berita.gambarUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={berita.gambarUrl}
                          alt={berita.judul}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#14231B] group-hover:text-[#155E42] transition-colors leading-snug">
                      {berita.judul}
                    </h3>
                  </div>
                  <p className="mt-3 text-xs text-[#6B7A71]">
                    {formatDate(berita.tanggal, "short")} &bull;{" "}
                    {berita.penulis}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
