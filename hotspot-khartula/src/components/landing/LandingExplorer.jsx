"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import HotmapMap from "@/components/map/HotmapMap";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  CLIENT_CACHE_PREFIX,
  PUBLIC_SNAPSHOT_TTL_MS,
  writeBrowserCache,
} from "@/lib/client-cache";
import {
  formatCoordinates,
  isValidCoordinatePair,
} from "@/lib/gis";
import { STATUS_META, formatDate } from "@/lib/normalizers";

const EMPTY_SUBSCRIBE = () => () => {};
const LANDING_SNAPSHOT_STORAGE_KEY = `${CLIENT_CACHE_PREFIX}landing:public-snapshot`;

function readRawLandingSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LANDING_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(LANDING_SNAPSHOT_STORAGE_KEY);
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

const ROLE_PORTAL_HREF = {
  admin: "/admin",
  petugas: "/petugas",
  pelapor: "/pelapor",
};

const LANDING_BASEMAPS = ["osm", "satellite"];

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

  const [focusTarget, setFocusTarget] = useState(null);
  const [shouldMountMap, setShouldMountMap] = useState(false);
  const mapSectionRef = useRef(null);

  const rawCachedSnapshot = useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    readRawLandingSnapshot,
    () => null
  );

  const cachedFallback = useMemo(() => {
    if (!hasQueryError || !rawCachedSnapshot) return null;
    try {
      return JSON.parse(rawCachedSnapshot)?.value ?? null;
    } catch {
      return null;
    }
  }, [hasQueryError, rawCachedSnapshot]);

  // Simpan snapshot data publik di browser agar kunjungan ulang / gangguan jaringan tetap cepat
  useEffect(() => {
    if (!hasQueryError && (initialLaporan.length > 0 || wilayahList.length > 0)) {
      writeBrowserCache(
        "landing:public-snapshot",
        {
          laporan: initialLaporan,
          wilayah: wilayahList,
          berita: beritaList,
        },
        PUBLIC_SNAPSHOT_TTL_MS
      );
    }
  }, [hasQueryError, initialLaporan, wilayahList, beritaList]);

  // Tunda mount Leaflet + tile peta sampai pengguna menggulir mendekati section peta
  useEffect(() => {
    if (shouldMountMap) return;
    const node = mapSectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldMountMap(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMountMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "350px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMountMap]);

  const effectiveLaporan =
    hasQueryError && initialLaporan.length === 0 && cachedFallback?.laporan
      ? cachedFallback.laporan
      : initialLaporan;
  const effectiveWilayah =
    hasQueryError && wilayahList.length === 0 && cachedFallback?.wilayah
      ? cachedFallback.wilayah
      : wilayahList;
  const effectiveBerita =
    hasQueryError && beritaList.length === 0 && cachedFallback?.berita
      ? cachedFallback.berita
      : beritaList;

  const wilayahByName = useMemo(() => {
    const map = new Map();
    for (const w of effectiveWilayah) {
      if (w.nama) map.set(w.nama, w);
    }
    return map;
  }, [effectiveWilayah]);

  const wilayahOptions = useMemo(() => {
    const set = new Set(effectiveWilayah.map((w) => w.nama).filter(Boolean));
    for (const item of effectiveLaporan) {
      if (item.wilayah) set.add(item.wilayah);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [effectiveWilayah, effectiveLaporan]);

  const filteredLaporan = useMemo(() => {
    return effectiveLaporan.filter((item) => {
      if (
        appliedFilters.wilayah !== "semua" &&
        item.wilayah !== appliedFilters.wilayah
      ) {
        return false;
      }
      if (
        appliedFilters.status !== "semua" &&
        item.statusKey !== appliedFilters.status
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
  }, [effectiveLaporan, appliedFilters]);

  const showcaseItems = useMemo(() => {
    const priority = {
      ditangani: 0,
      selesai: 1,
      terverifikasi: 2,
      menunggu_verifikasi: 3,
      ditolak: 4,
    };
    return [...effectiveLaporan]
      .sort(
        (a, b) =>
          (priority[a.statusKey] ?? 9) - (priority[b.statusKey] ?? 9)
      )
      .slice(0, 3);
  }, [effectiveLaporan]);

  const hasActiveFilter =
    appliedFilters.wilayah !== "semua" ||
    appliedFilters.status !== "semua" ||
    Boolean(appliedFilters.startDate) ||
    Boolean(appliedFilters.endDate);

  function scrollToMapSection() {
    setShouldMountMap(true);
    if (typeof document === "undefined") return;
    const el = document.getElementById("peta-sebaran");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
    scrollToMapSection();
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

  function handleFocusReportOnMap(item) {
    if (item && isValidCoordinatePair(item.latitude, item.longitude)) {
      setFocusTarget((prev) => ({
        lat: item.latitude,
        lng: item.longitude,
        zoom: 12,
        reportId: item.id,
        seq: (prev?.seq ?? 0) + 1,
      }));
    }
    scrollToMapSection();
  }

  const portalHref = currentUser?.role
    ? ROLE_PORTAL_HREF[currentUser.role] ?? "/login"
    : "/login";

  const heroPrimaryHref =
    currentUser?.role === "petugas" ? "/petugas/peta" : "/pelapor/laporan/buat";
  const heroPrimaryLabel =
    currentUser?.role === "petugas" ? "Buka Peta Tugas" : "Laporkan Kejadian";

  const featureItems = [
    {
      title: "Peta GIS Interaktif",
      description:
        "Pantau sebaran titik laporan warga secara visual dengan klaster otomatis, legenda status, dan pilihan citra satelit.",
      ctaLabel: "Buka Peta",
      href: "/peta",
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      ),
    },
    {
      title: "Pelaporan Warga",
      description:
        "Laporkan titik api atau asap pekat dilengkapi koordinat akurat pada peta serta unggahan foto bukti lapangan.",
      ctaLabel: "Buat Laporan",
      href: "/pelapor/laporan/buat",
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      ),
    },
    {
      title: "Verifikasi & Penugasan",
      description:
        "Admin memverifikasi laporan dan menugaskan petugas lapangan, sementara progres pemadaman tercatat kronologis.",
      ctaLabel: currentUser ? "Buka Portal" : "Masuk Sistem",
      href: portalHref,
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "Informasi & Edukasi",
      description:
        "Ikuti peringatan dini kekeringan lahan gambut, laporan pemadaman, dan panduan pencegahan karhutla terbaru.",
      ctaLabel: "Baca Berita",
      href: "/berita",
      icon: (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v14H4z" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2C3325] flex flex-col font-sans">
      <PublicNavbar currentUser={currentUser} />

      <main className="flex-1">
        {/* 1. HERO SECTION (2 Kolom Asimetris + Foto Latar Full-Bleed WebP, Full Viewport) */}
        <section className="relative w-full min-h-[calc(100dvh-110px)] flex items-center overflow-hidden bg-[#2C3B21]">
          <Image
            src="/images/hero-forest.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-r from-[#1A2413]/88 via-[#223018]/70 to-[#2C3B21]/45"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-[#1A2413]/55 via-transparent to-[#1A2413]/50"
          />

          <div className="relative w-full mx-auto max-w-300 px-4 sm:px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Kolom Kiri: Headline Serif + Subjudul + CTA Pil */}
              <div className="lg:col-span-7 space-y-5">
                <p className="hm-animate-fade-up inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#D7E3C3]">
                  <span className="h-2 w-2 rounded-full bg-[#A8C66C]" />
                  SIPKARHUTLA &bull; Cakupan Seluruh Indonesia
                </p>

                <h1 className="hm-animate-fade-up hm-delay-1 font-serif text-[34px] sm:text-[44px] font-bold leading-[1.15] tracking-tight text-white">
                  Pantau &amp; Tangani Karhutla di Seluruh Wilayah Indonesia.
                </h1>

                <p className="hm-animate-fade-up hm-delay-2 max-w-xl text-[15px] leading-relaxed text-white/90">
                  Data terkini kejadian kebakaran hutan dan lahan berbasis laporan warga.
                  Lihat titik lokasi pada peta interaktif, status verifikasi, hingga tindak lanjut petugas.
                </p>

                <div className="hm-animate-fade-up hm-delay-3 pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href={heroPrimaryHref}
                    className="inline-flex items-center justify-center rounded-full bg-[#557029] hover:bg-[#465D21] border border-[#8CB04E]/45 px-7 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    {heroPrimaryLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={scrollToMapSection}
                    className="inline-flex items-center justify-center rounded-full border border-white/65 bg-white/10 hover:bg-white hover:text-[#2C3325] px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                  >
                    Lihat Peta Sebaran &darr;
                  </button>
                </div>
              </div>

              {/* Kolom Kanan: Kartu Form Melayang (Filter Pantauan Cepat Aktif) */}
              <div className="lg:col-span-5">
                <div className="hm-animate-scale-in hm-delay-2 rounded-xl bg-white p-6 hm-floating-card border border-[#DCE0D5]">
                  <div className="mb-5 space-y-1">
                    <h2 className="font-serif text-[22px] font-semibold text-[#2C3325] leading-snug">
                      Filter Pantauan Cepat
                    </h2>
                    <p className="text-[13px] text-[#6B7263]">
                      Saring titik laporan pada peta sebaran secara langsung.
                    </p>
                  </div>

                  <form onSubmit={handleApplyFilter} className="space-y-4">
                    <div>
                      <label
                        htmlFor="hero-filter-wilayah"
                        className="block text-[12px] font-medium text-[#2C3325] mb-1.5"
                      >
                        Wilayah Pemantauan
                      </label>
                      <select
                        id="hero-filter-wilayah"
                        value={draftWilayah}
                        onChange={(e) => setDraftWilayah(e.target.value)}
                        className="w-full rounded-sm border border-[#8A947D] bg-white px-3 py-2.5 text-[14px] text-[#2C3325] focus:border-[#557029] focus:outline-none"
                      >
                        <option value="semua">Semua wilayah ({wilayahOptions.length})</option>
                        {wilayahOptions.map((wilayah) => (
                          <option key={wilayah} value={wilayah}>
                            {wilayah}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="hero-filter-status"
                        className="block text-[12px] font-medium text-[#2C3325] mb-1.5"
                      >
                        Status Penanganan
                      </label>
                      <select
                        id="hero-filter-status"
                        value={draftStatus}
                        onChange={(e) => setDraftStatus(e.target.value)}
                        className="w-full rounded-sm border border-[#8A947D] bg-white px-3 py-2.5 text-[14px] text-[#2C3325] focus:border-[#557029] focus:outline-none"
                      >
                        <option value="semua">Semua status</option>
                        {Object.entries(STATUS_META).map(([key, meta]) => (
                          <option key={key} value={key}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="hero-filter-start"
                          className="block text-[12px] font-medium text-[#2C3325] mb-1.5"
                        >
                          Dari Tanggal
                        </label>
                        <input
                          id="hero-filter-start"
                          type="date"
                          value={draftStartDate}
                          onChange={(e) => setDraftStartDate(e.target.value)}
                          className="w-full rounded-sm border border-[#8A947D] bg-white px-3 py-2 text-[14px] text-[#2C3325] focus:border-[#557029] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="hero-filter-end"
                          className="block text-[12px] font-medium text-[#2C3325] mb-1.5"
                        >
                          Sampai Tanggal
                        </label>
                        <input
                          id="hero-filter-end"
                          type="date"
                          value={draftEndDate}
                          onChange={(e) => setDraftEndDate(e.target.value)}
                          className="w-full rounded-sm border border-[#8A947D] bg-white px-3 py-2 text-[14px] text-[#2C3325] focus:border-[#557029] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-1 space-y-2">
                      <button
                        type="submit"
                        className="w-full rounded-full bg-[#557029] hover:bg-[#465D21] px-5 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
                      >
                        Tampilkan di Peta
                      </button>

                      {hasActiveFilter && (
                        <button
                          type="button"
                          onClick={handleResetFilter}
                          className="w-full rounded-full border border-[#8A947D] bg-white hover:bg-[#F7F8F2] px-4 py-2 text-[12px] font-semibold text-[#2C3325] transition-colors cursor-pointer"
                        >
                          Atur Ulang Filter
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FEATURE STRIP (4 Kolom, Latar Krem Hangat #F7F8F2) */}
        <section className="w-full bg-[#F7F8F2] border-b border-[#DCE0D5] py-16">
          <div className="mx-auto max-w-300 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureItems.map((item, idx) => (
                <RevealOnScroll key={item.title} delay={idx * 70} className="h-full">
                  <div className="group h-full flex flex-col items-center text-center rounded-xl px-4 py-4 transition-colors duration-200 hover:bg-white/75">
                    <div className="mb-4 text-[#6F8E3D] transition-transform duration-300 ease-out group-hover:-translate-y-1">
                      {item.icon}
                    </div>
                    <h2 className="font-serif text-[18px] font-semibold text-[#2C3325]">
                      {item.title}
                    </h2>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-[#6B7263] flex-1">
                      {item.description}
                    </p>
                    <Link
                      href={item.href}
                      className="mt-5 inline-flex items-center justify-center rounded-full bg-[#557029] hover:bg-[#465D21] px-5 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      {item.ctaLabel}
                    </Link>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* 3. PETA SEBARAN RINGKAS (Switch Basemap + Reset Peta Indonesia di Pojok Kanan) */}
        <section
          id="peta-sebaran"
          ref={mapSectionRef}
          className="w-full bg-white py-16 scroll-mt-20"
        >
          <div className="mx-auto max-w-300 px-4 sm:px-6 space-y-6">
            {hasQueryError && (
              <div
                role="alert"
                className="rounded-lg border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B3417]"
              >
                {cachedFallback
                  ? "Menampilkan data tersimpan lokal sementara koneksi database dipulihkan."
                  : "Sebagian data gagal dimuat dari database. Silakan muat ulang halaman beberapa saat lagi."}
              </div>
            )}

            <RevealOnScroll className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="font-serif text-[30px] font-bold text-[#2C3325] leading-tight">
                  Peta Sebaran Laporan Karhutla
                </h2>
                <p className="text-[14px] text-[#6B7263]">
                  Menampilkan <strong>{filteredLaporan.length}</strong> laporan warga &bull;{" "}
                  {appliedFilters.wilayah === "semua"
                    ? "Seluruh wilayah Indonesia"
                    : appliedFilters.wilayah}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] text-[#6B7263]">
                  <span>Klik titik marker pada peta untuk melihat informasi ringkas kejadian.</span>
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className="font-semibold text-[#557029] hover:underline cursor-pointer"
                    >
                      (Reset filter)
                    </button>
                  )}
                </div>

                <Link
                  href="/peta"
                  className="group inline-flex items-center justify-center rounded-full border border-[#8A947D] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#F7F8F2] transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Buka Peta Lengkap</span>
                  <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                </Link>
              </div>
            </RevealOnScroll>

            {shouldMountMap ? (
              <HotmapMap
                laporan={filteredLaporan}
                focusTarget={focusTarget}
                allowedBasemaps={LANDING_BASEMAPS}
                showActionControls={false}
                heightClass="h-100 sm:h-115 lg:h-125"
              />
            ) : (
              <div className="h-100 sm:h-115 lg:h-125 w-full rounded-xl border border-[#DCE0D5] bg-[#EEF2E4] flex flex-col items-center justify-center gap-2 text-xs font-medium text-[#6B7263]">
                <span>Peta interaktif akan dimuat otomatis saat area ini terlihat...</span>
              </div>
            )}
          </div>
        </section>

        {/* 4. FEATURED ARTICLES / BERITA TERKINI (3 Kolom Tanpa Border Kartu Luar) */}
        <section className="w-full bg-[#F7F8F2] border-y border-[#DCE0D5] py-16">
          <div className="mx-auto max-w-300 px-4 sm:px-6 space-y-10">
            <RevealOnScroll className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="font-serif text-[30px] font-bold text-[#2C3325]">
                Berita &amp; Informasi Terkini
              </h2>
              <p className="text-[14px] text-[#6B7263]">
                Peringatan dini, dokumentasi penanganan, dan edukasi pencegahan kebakaran hutan dan lahan.
              </p>
            </RevealOnScroll>

            {effectiveBerita.length === 0 ? (
              <p className="text-center text-[14px] text-[#6B7263]">
                Belum ada berita yang dipublikasikan.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {effectiveBerita.map((berita, idx) => (
                  <RevealOnScroll key={berita.id} delay={idx * 80} className="h-full">
                    <article className="group h-full flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/berita/${berita.slug || berita.id}`}
                          className="block aspect-16/10 w-full rounded-lg overflow-hidden mb-4 bg-[#E6ECE0] border border-[#DCE0D5]"
                        >
                          {berita.gambarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={berita.gambarUrl}
                              alt={berita.judul}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            /* Placeholder foto artikel siap diganti melalui modul berita admin */
                            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-[#6F8E3D] px-4 text-center">
                              <svg
                                className="h-8 w-8 opacity-75 transition-transform duration-300 group-hover:scale-105"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                aria-hidden="true"
                              >
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <circle cx="8.5" cy="10" r="1.5" />
                                <path d="M21 16l-5-5-4 4-2-2-5 5" />
                              </svg>
                              <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B7263]">
                                Placeholder Foto Berita
                              </span>
                            </div>
                          )}
                        </Link>

                        <h3 className="font-serif text-[18px] font-semibold text-[#2C3325] group-hover:text-[#557029] transition-colors leading-snug">
                          <Link href={`/berita/${berita.slug || berita.id}`}>
                            {berita.judul}
                          </Link>
                        </h3>

                        <p className="mt-2 text-[14px] text-[#6B7263] line-clamp-3 leading-relaxed">
                          {berita.ringkasan ||
                            `${formatDate(berita.tanggal, "long")} — Publikasi resmi ${berita.penulis}.`}
                        </p>
                      </div>

                      <div className="mt-4 pt-1">
                        <Link
                          href={`/berita/${berita.slug || berita.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-[#8A947D] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#EEF2E4] transition-all duration-200 active:scale-[0.98]"
                        >
                          Baca Selengkapnya
                        </Link>
                      </div>
                    </article>
                  </RevealOnScroll>
                ))}
              </div>
            )}

            <div className="text-center pt-2">
              <Link
                href="/berita"
                className="group inline-flex items-center justify-center rounded-full border border-[#8A947D] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#EEF2E4] transition-all duration-200 active:scale-[0.98]"
              >
                <span>Lihat Semua Berita</span>
                <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. SHOWCASE / SOROTAN PENANGANAN & WILAYAH (3 Kolom, Rasio 4:3, Sudut Tajam + Bilah Caption Solid) */}
        <section className="w-full bg-white py-16">
          <div className="mx-auto max-w-300 px-4 sm:px-6 space-y-10">
            <RevealOnScroll className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="font-serif text-[30px] font-bold text-[#2C3325]">
                Sorotan Penanganan &amp; Wilayah
              </h2>
              <p className="text-[14px] text-[#6B7263]">
                Ringkasan kejadian prioritas yang sedang ditangani maupun telah selesai dipadamkan di berbagai daerah.
              </p>
            </RevealOnScroll>

            {showcaseItems.length === 0 ? (
              <p className="text-center text-[14px] text-[#6B7263]">
                Belum ada sorotan laporan penanganan yang tercatat.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {showcaseItems.map((item, idx) => {
                  const statusInfo =
                    STATUS_META[item.statusKey] ?? STATUS_META.menunggu_verifikasi;
                  return (
                    <RevealOnScroll key={item.id} delay={idx * 80} className="h-full">
                      <button
                        type="button"
                        onClick={() => handleFocusReportOnMap(item)}
                        className="hm-interactive-card group h-full w-full text-left rounded-none overflow-hidden border border-[#DCE0D5] bg-white flex flex-col cursor-pointer"
                      >
                        {/* Placeholder foto dokumentasi lapangan rasio 4:3, sudut tajam (siap diganti foto) */}
                        <div className="relative aspect-4/3 w-full bg-[#EEF2E4] flex flex-col items-center justify-center gap-2 px-6 text-center">
                          <svg
                            className="h-9 w-9 text-[#6F8E3D] opacity-80 group-hover:scale-105 transition-transform duration-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            aria-hidden="true"
                          >
                            <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
                            <circle cx="12" cy="11" r="2.2" />
                          </svg>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7263]">
                            Placeholder Foto Lapangan
                          </span>
                          <span className="font-mono text-[11px] text-[#2C3325]/80">
                            {formatCoordinates(item.latitude, item.longitude, 4)}
                          </span>
                          <span className="absolute top-3 left-3 rounded-sm bg-white/95 border border-[#DCE0D5] px-2.5 py-1 text-[11px] font-semibold text-[#2C3325]">
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Bilah Caption Solid Menempel Langsung di Sisi Bawah */}
                        <div className="w-full bg-[#557029] group-hover:bg-[#465D21] px-4 py-3.5 text-white transition-colors duration-200">
                          <p className="font-serif text-[16px] font-semibold leading-snug line-clamp-1 text-white">
                            {item.judul}
                          </p>
                          <p className="mt-0.5 text-[12px] text-white/85 truncate">
                            {item.wilayah} &bull; {item.estimasiLuas}
                          </p>
                        </div>
                      </button>
                    </RevealOnScroll>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
