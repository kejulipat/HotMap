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
  const scrollContainerRef = useRef(null);
  const activeSectionIdxRef = useRef(0);
  const isAnimatingScrollRef = useRef(false);
  const scrollAnimFrameRef = useRef(0);
  const wheelCooldownTimerRef = useRef(null);
  const scrollSyncTimerRef = useRef(null);

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

  // Helper animasi scroll section-ke-section tanpa konflik CSS scroll-snap saat bolak-balik
  function jumpToDesktopSection(targetIdx) {
    const container = scrollContainerRef.current;
    if (!container) return;
    const sections = Array.from(
      container.querySelectorAll("[data-snap-section]")
    );
    if (sections.length === 0) return;

    const lastIdx = sections.length - 1;
    const clampedIdx = Math.max(0, Math.min(lastIdx, targetIdx));
    const navOffset = 72;
    const containerRect = container.getBoundingClientRect();
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const targetSec = sections[clampedIdx];
    const secTop =
      targetSec.getBoundingClientRect().top -
      containerRect.top +
      container.scrollTop;

    const targetTop =
      clampedIdx === 0
        ? 0
        : clampedIdx === lastIdx
        ? maxScroll
        : Math.max(0, Math.min(maxScroll, secTop - navOffset));

    activeSectionIdxRef.current = clampedIdx;
    if (clampedIdx >= 2) {
      setShouldMountMap(true);
    }

    if (scrollAnimFrameRef.current) {
      window.cancelAnimationFrame(scrollAnimFrameRef.current);
      scrollAnimFrameRef.current = 0;
    }
    if (wheelCooldownTimerRef.current) {
      window.clearTimeout(wheelCooldownTimerRef.current);
      wheelCooldownTimerRef.current = null;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      container.scrollTop = targetTop;
      isAnimatingScrollRef.current = false;
      return;
    }

    const startTop = container.scrollTop;
    const delta = targetTop - startTop;
    if (Math.abs(delta) < 2) {
      isAnimatingScrollRef.current = false;
      return;
    }

    isAnimatingScrollRef.current = true;
    const duration = 520;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out halus
      const eased = 1 - Math.pow(1 - t, 3);
      container.scrollTop = startTop + delta * eased;

      if (t < 1) {
        scrollAnimFrameRef.current = window.requestAnimationFrame(step);
      } else {
        scrollAnimFrameRef.current = 0;
        container.scrollTop = targetTop;
        wheelCooldownTimerRef.current = window.setTimeout(() => {
          isAnimatingScrollRef.current = false;
        }, 160);
      }
    };

    scrollAnimFrameRef.current = window.requestAnimationFrame(step);
  }

  // Pada Desktop (>=1024px), satu guliran roda mouse langsung berpindah deterministik ke section berikutnya/sebelumnya
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const syncIndexFromScroll = () => {
      if (isAnimatingScrollRef.current || window.innerWidth < 1024) return;
      const sections = Array.from(
        container.querySelectorAll("[data-snap-section]")
      );
      if (sections.length === 0) return;

      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      if (maxScroll > 0 && container.scrollTop >= maxScroll - 24) {
        activeSectionIdxRef.current = sections.length - 1;
        return;
      }

      const navOffset = 72;
      const containerRect = container.getBoundingClientRect();
      const currentScroll = container.scrollTop + navOffset;
      let nearestIdx = 0;
      let minDist = Infinity;

      sections.forEach((sec, idx) => {
        const secTop =
          sec.getBoundingClientRect().top - containerRect.top + container.scrollTop;
        const dist = Math.abs(secTop - currentScroll);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = idx;
        }
      });

      activeSectionIdxRef.current = nearestIdx;
    };

    const handleScroll = () => {
      if (isAnimatingScrollRef.current) return;
      if (scrollSyncTimerRef.current) {
        window.clearTimeout(scrollSyncTimerRef.current);
      }
      scrollSyncTimerRef.current = window.setTimeout(syncIndexFromScroll, 120);
    };

    const handleWheel = (e) => {
      if (window.innerWidth < 1024) return;
      if (e.ctrlKey) return;

      const targetEl = e.target;
      if (
        targetEl instanceof Element &&
        targetEl.closest("select, textarea, [data-allow-wheel]")
      ) {
        return;
      }

      const sections = Array.from(
        container.querySelectorAll("[data-snap-section]")
      );
      if (sections.length === 0) return;

      // Selalu cegah scroll liar saat sedang transisi agar tidak memantul balik
      if (isAnimatingScrollRef.current) {
        e.preventDefault();
        return;
      }

      if (Math.abs(e.deltaY) < 12) return;

      const navOffset = 72;
      const containerRect = container.getBoundingClientRect();
      const lastIdx = sections.length - 1;
      const direction = e.deltaY > 0 ? 1 : -1;
      const currentIdx = Math.max(0, Math.min(lastIdx, activeSectionIdxRef.current));

      const activeSection = sections[currentIdx];
      if (activeSection && currentIdx < lastIdx) {
        const activeTop =
          activeSection.getBoundingClientRect().top -
          containerRect.top +
          container.scrollTop;
        const viewBottom = container.scrollTop + container.clientHeight;
        const sectionBottom = activeTop + activeSection.offsetHeight;

        // Jika section sedikit lebih tinggi dari layar pendek, biarkan scroll internal mencapai tepi dulu
        if (direction > 0 && sectionBottom - viewBottom > 28) {
          return;
        }
        if (direction < 0 && container.scrollTop + navOffset - activeTop > 28) {
          return;
        }
      }

      const nextIdx = currentIdx + direction;
      if (nextIdx < 0 || nextIdx > lastIdx) return;

      e.preventDefault();
      jumpToDesktopSection(nextIdx);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", handleScroll);
      if (scrollAnimFrameRef.current) {
        window.cancelAnimationFrame(scrollAnimFrameRef.current);
      }
      if (wheelCooldownTimerRef.current) {
        window.clearTimeout(wheelCooldownTimerRef.current);
      }
      if (scrollSyncTimerRef.current) {
        window.clearTimeout(scrollSyncTimerRef.current);
      }
    };
  }, []);

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
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      jumpToDesktopSection(2);
      return;
    }
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
      number: "01",
      title: "Peta GIS Interaktif",
      description:
        "Pantau sebaran titik laporan warga secara visual dengan klaster otomatis, legenda status, dan pilihan citra satelit.",
      ctaLabel: "Buka Peta",
      href: "/peta",
      bgImage: "/images/feature-1.webp",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Pelaporan Warga",
      description:
        "Laporkan titik api atau asap pekat dilengkapi koordinat akurat pada peta serta unggahan foto bukti lapangan.",
      ctaLabel: "Buat Laporan",
      href: "/pelapor/laporan/buat",
      bgImage: "/images/feature-2.webp",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Verifikasi & Penugasan",
      description:
        "Admin memverifikasi laporan dan menugaskan petugas lapangan, sementara progres pemadaman tercatat kronologis.",
      ctaLabel: currentUser ? "Buka Portal" : "Masuk Sistem",
      href: portalHref,
      bgImage: "/images/feature-3.webp",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Informasi & Edukasi",
      description:
        "Ikuti peringatan dini kekeringan lahan gambut, laporan pemadaman, dan panduan pencegahan karhutla terbaru.",
      ctaLabel: "Baca Berita",
      href: "/berita",
      bgImage: "/images/feature-4.webp",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v14H4z" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      ),
    },
  ];

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen lg:h-dvh lg:overflow-y-auto lg:scroll-pt-18 bg-white text-[#2C3325] flex flex-col font-sans"
    >
      <PublicNavbar currentUser={currentUser} />

      <main className="flex-1">
        {/* 1. HERO SECTION (2 Kolom Asimetris + Foto Latar Full-Bleed WebP, Full Viewport) */}
        <section
          data-snap-section
          className="relative w-full min-h-[calc(100dvh-72px)] flex items-center overflow-hidden bg-[#2C3B21]"
        >
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

        {/* 2. FEATURE STRIP (4 Sekat Full-Bleed Sama Lebar dengan Foto Latar Hover Pop-Up & Cerah) */}
        <section
          data-snap-section
          className="w-full overflow-hidden bg-[#16200E] border-b border-[#DCE0D5] lg:h-[calc(100dvh-72px)]"
        >
          <div className="grid h-full w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-white/20">
            {featureItems.map((item, idx) => (
              <article
                key={item.title}
                className="group relative flex min-h-85 sm:min-h-100 lg:min-h-0 h-full w-full flex-col items-center justify-center overflow-hidden px-7 py-12 text-center ring-1 ring-inset ring-white/10 transition-all duration-500 ease-out hover:z-20 lg:hover:scale-[1.02] hover:ring-white/40 hover:shadow-[0_24px_56px_rgba(10,16,7,0.55)] motion-reduce:transition-none motion-reduce:transform-none"
              >
                {/* Foto Latar Sekat (siap diganti di public/images/feature-1..4.webp) */}
                <Image
                  src={item.bgImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-center brightness-65 scale-100 transition-all duration-500 ease-out group-hover:scale-108 group-hover:brightness-105 motion-reduce:transition-none motion-reduce:transform-none"
                />

                {/* Overlay Gelap yang Mencerah Halus saat Hover */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[#131C0C]/62 transition-colors duration-500 ease-out group-hover:bg-[#131C0C]/26"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-linear-to-t from-[#0E1509]/80 via-[#0E1509]/28 to-[#0E1509]/45"
                />

                {/* Konten Fitur yang Terangkat Halus saat Hover */}
                <RevealOnScroll
                  delay={idx * 70}
                  className="relative z-10 w-full max-w-xs"
                >
                  <div className="flex flex-col items-center transition-transform duration-300 ease-out group-hover:-translate-y-2 motion-reduce:transition-none motion-reduce:transform-none">
                    <span className="mb-4 font-mono text-[11px] font-semibold tracking-[0.22em] text-[#D7E3C3]/80">
                      {item.number}
                    </span>

                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-xs text-[#D7E3C3] transition-all duration-300 group-hover:scale-110 group-hover:border-white/55 group-hover:bg-white/20 group-hover:text-white">
                      {item.icon}
                    </div>

                    <h2 className="font-serif text-[22px] font-bold text-white leading-snug">
                      {item.title}
                    </h2>

                    <p className="mt-3 text-[14px] leading-relaxed text-white/85 transition-colors duration-300 group-hover:text-white">
                      {item.description}
                    </p>

                    <Link
                      href={item.href}
                      className="mt-7 inline-flex items-center justify-center rounded-full border border-white/40 bg-[#557029]/90 px-6 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[#243314] group-hover:shadow-md active:scale-[0.98]"
                    >
                      {item.ctaLabel}
                    </Link>
                  </div>
                </RevealOnScroll>
              </article>
            ))}
          </div>
        </section>

        {/* 3. PETA SEBARAN RINGKAS (Switch Basemap + Reset Peta Indonesia di Pojok Kanan, Panduan & Tombol di Bawah Peta) */}
        <section
          id="peta-sebaran"
          data-snap-section
          ref={mapSectionRef}
          className="w-full bg-white py-16 lg:py-8 lg:min-h-[calc(100dvh-72px)] flex items-center scroll-mt-18"
        >
          <div className="w-full mx-auto max-w-300 px-4 sm:px-6 space-y-5">
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

            <RevealOnScroll>
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
            </RevealOnScroll>

            {shouldMountMap ? (
              <HotmapMap
                laporan={filteredLaporan}
                focusTarget={focusTarget}
                allowedBasemaps={LANDING_BASEMAPS}
                showActionControls={false}
                scrollWheelZoom={false}
                heightClass="h-95 sm:h-105 lg:h-[min(54dvh,450px)]"
              />
            ) : (
              <div className="h-95 sm:h-105 lg:h-[min(54dvh,450px)] w-full rounded-xl border border-[#DCE0D5] bg-[#EEF2E4] flex flex-col items-center justify-center gap-2 text-xs font-medium text-[#6B7263]">
                <span>Peta interaktif akan dimuat otomatis saat area ini terlihat...</span>
              </div>
            )}

            {/* Panduan Klik Marker & Tombol Buka Peta Lengkap di Bawah Peta */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#6B7263]">
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
                className="group inline-flex items-center justify-center rounded-full border border-[#8A947D] bg-white px-5 py-2 text-[12px] font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#F7F8F2] transition-all duration-200 active:scale-[0.98]"
              >
                <span>Buka Peta Lengkap</span>
                <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. FEATURED ARTICLES / BERITA TERKINI (3 Kolom Tanpa Border Kartu Luar) */}
        <section
          data-snap-section
          className="w-full bg-[#F7F8F2] border-y border-[#DCE0D5] py-16 lg:py-10 lg:min-h-[calc(100dvh-72px)] flex items-center"
        >
          <div className="w-full mx-auto max-w-300 px-4 sm:px-6 space-y-8">
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

        {/* 5. SHOWCASE / SOROTAN PENANGANAN & WILAYAH (Editorial Terpusat + Placeholder feature-1..4.webp) */}
        <section
          data-snap-section
          className="w-full bg-linear-to-b from-white via-[#FAFBF6] to-[#F1F4E8] py-16 lg:py-12 lg:min-h-[calc(100dvh-72px)] flex items-center"
        >
          <div className="w-full mx-auto max-w-300 px-4 sm:px-6 space-y-10">
            <RevealOnScroll className="w-full text-center flex flex-col items-center space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C9D6B5] bg-[#EEF2E4] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#465D21]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6F8E3D]" />
                Sorotan Operasional
              </span>
              <h2 className="w-full text-center font-serif text-[30px] sm:text-[34px] font-bold text-[#2C3325] leading-tight">
                Sorotan Penanganan &amp; Wilayah
              </h2>
              <div
                aria-hidden="true"
                className="h-0.5 w-14 rounded-full bg-[#6F8E3D]/70"
              />
              <p className="mx-auto max-w-xl text-center text-[14px] leading-relaxed text-[#6B7263]">
                Ringkasan kejadian prioritas yang sedang ditangani maupun telah selesai dipadamkan di berbagai daerah. Pilih kartu untuk langsung fokus ke lokasinya di peta.
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
                  const placeholderImg = `/images/feature-${(idx % 4) + 1}.webp`;
                  return (
                    <RevealOnScroll key={item.id} delay={idx * 80} className="h-full">
                      <button
                        type="button"
                        onClick={() => handleFocusReportOnMap(item)}
                        className="hm-interactive-card group h-full w-full text-left rounded-xl overflow-hidden border border-[#DCE0D5] hover:border-[#6F8E3D]/70 bg-white shadow-xs flex flex-col cursor-pointer"
                      >
                        {/* Area Visual 4:3 menggunakan placeholder feature-1..4.webp */}
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-[#1D2814]">
                          <Image
                            src={placeholderImg}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 33vw, 100vw"
                            className="object-cover object-center brightness-80 scale-100 transition-all duration-500 ease-out group-hover:scale-108 group-hover:brightness-105"
                          />
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-linear-to-t from-[#11190B]/85 via-[#11190B]/25 to-[#11190B]/35 transition-opacity duration-300 group-hover:opacity-80"
                          />

                          {/* Badge Status (Kiri Atas) */}
                          <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCE0D5] px-3 py-1 text-[11px] font-semibold text-[#2C3325] shadow-xs">
                            <span
                              className={`h-2 w-2 rounded-full ${statusInfo.dotColor}`}
                            />
                            {statusInfo.label}
                          </span>

                          {/* Koordinat (Kanan Atas) */}
                          <span className="absolute top-3.5 right-3.5 rounded-full bg-black/45 backdrop-blur-xs border border-white/15 px-2.5 py-1 font-mono text-[10px] font-medium text-white/95">
                            {formatCoordinates(item.latitude, item.longitude, 3)}
                          </span>

                          {/* Info Lokasi & Aksi Fokus di Bagian Bawah Visual */}
                          <div className="absolute inset-x-3.5 bottom-3 flex items-center justify-between gap-2 text-white">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90 truncate">
                              <svg
                                className="h-3.5 w-3.5 shrink-0 text-[#C5DF8F]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
                                <circle cx="12" cy="11" r="2.2" />
                              </svg>
                              <span className="truncate">{item.wilayah}</span>
                            </span>

                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/25 px-2.5 py-0.5 text-[10px] font-semibold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#243314]">
                              <span>Lihat di Peta</span>
                              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                &rarr;
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Bilah Caption Solid Menempel Langsung di Sisi Bawah */}
                        <div className="w-full flex-1 bg-[#465D21] group-hover:bg-[#384B1A] px-4 py-3.5 text-white transition-colors duration-200">
                          <p className="font-serif text-[16px] font-semibold leading-snug line-clamp-1 text-white">
                            {item.judul}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-white/85">
                            <span className="truncate">
                              Luas: {item.estimasiLuas}
                            </span>
                            <span className="shrink-0 text-[11px] text-white/75">
                              {formatDate(item.tanggal, "short")}
                            </span>
                          </div>
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

      <div data-snap-section>
        <PublicFooter />
      </div>
    </div>
  );
}
