"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import {
  BASEMAP_LAYERS,
  INDONESIA_CENTER,
  INDONESIA_DEFAULT_ZOOM,
  STATUS_PIN_COLORS,
  formatCoordinates,
  isValidCoordinatePair,
} from "@/lib/gis";
import { STATUS_META, formatDate } from "@/lib/normalizers";

function createStatusMarkerIcon(statusKey, isSelected = false) {
  const color =
    STATUS_PIN_COLORS[statusKey] ?? STATUS_PIN_COLORS.menunggu_verifikasi;
  const size = isSelected ? 28 : 22;
  const inner = isSelected ? 12 : 10;

  return L.divIcon({
    className: "hotmap-marker-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#ffffff;box-shadow:0 0 0 ${
      isSelected ? 6 : 4
    }px ${color.ring},0 3px 8px rgba(18,36,27,0.28);display:flex;align-items:center;justify-content:center;transition:transform 150ms ease;"><span style="width:${inner}px;height:${inner}px;border-radius:9999px;background:${
      color.fill
    };display:block;"></span></div>`,
  });
}

/**
 * Membangun konten popup Leaflet secara aman melalui DOM API (textContent)
 * untuk mencegah kerentanan DOM XSS dari input judul/wilayah/alamat pengguna.
 */
function buildSafePopupNode(item, detailHrefPrefix) {
  const meta = STATUS_META[item.statusKey] ?? STATUS_META.menunggu_verifikasi;
  const root = document.createElement("div");
  root.style.padding = "12px 14px";
  root.style.fontFamily = "inherit";
  root.style.maxWidth = "250px";

  const badge = document.createElement("span");
  badge.textContent = meta.label;
  badge.style.display = "inline-block";
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "700";
  badge.style.padding = "2px 8px";
  badge.style.borderRadius = "6px";
  badge.style.marginBottom = "6px";
  badge.style.background = "#EAF1EC";
  badge.style.color = "#155E42";
  root.appendChild(badge);

  const title = document.createElement("div");
  title.textContent = item.judul || "Laporan Karhutla";
  title.style.fontWeight = "700";
  title.style.fontSize = "13px";
  title.style.color = "#12241B";
  title.style.lineHeight = "1.35";
  root.appendChild(title);

  const info = document.createElement("div");
  info.textContent = `${item.wilayah || "Indonesia"} • ${formatDate(
    item.tanggal,
    "short"
  )}`;
  info.style.fontSize = "11px";
  info.style.color = "#5F6F66";
  info.style.marginTop = "4px";
  root.appendChild(info);

  const coords = document.createElement("div");
  coords.textContent = formatCoordinates(item.latitude, item.longitude, 5);
  coords.style.fontSize = "11px";
  coords.style.fontFamily = "monospace";
  coords.style.color = "#6B7A71";
  coords.style.marginTop = "4px";
  root.appendChild(coords);

  if (detailHrefPrefix && item.id) {
    const link = document.createElement("a");
    link.href = `${detailHrefPrefix}/${encodeURIComponent(item.id)}`;
    link.textContent = "Buka Detail Laporan →";
    link.style.display = "inline-block";
    link.style.marginTop = "8px";
    link.style.fontSize = "12px";
    link.style.fontWeight = "700";
    link.style.color = "#155E42";
    link.style.textDecoration = "underline";
    root.appendChild(link);
  }

  return root;
}

export default function HotmapCanvas({
  laporan = [],
  selectedId = null,
  onSelectReport = null,
  detailHrefPrefix = null,
  focusTarget = null,
  heightClass = "h-[420px] lg:h-[500px]",
  singleMarkerMode = false,
  showControls = true,
  showLegend = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerMapRef = useRef(new Map());

  const [activeBasemap, setActiveBasemap] = useState("osm");
  const [clusterEnabled, setClusterEnabled] = useState(!singleMarkerMode);
  const [tileError, setTileError] = useState(false);

  const validPoints = useMemo(
    () =>
      laporan.filter((item) =>
        isValidCoordinatePair(item.latitude, item.longitude)
      ),
    [laporan]
  );

  const invalidCoordCount = laporan.length - validPoints.length;

  // Inisialisasi instance Leaflet sekali per mount dengan cleanup aman untuk React 19 Strict Mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    const initialCenter =
      singleMarkerMode && validPoints.length === 1
        ? [validPoints[0].latitude, validPoints[0].longitude]
        : INDONESIA_CENTER;
    const initialZoom =
      singleMarkerMode && validPoints.length === 1
        ? 13
        : INDONESIA_DEFAULT_ZOOM;

    const map = L.map(container, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: !singleMarkerMode,
    });

    mapRef.current = map;
    const markerMap = markerMapRef.current;

    let resizeFrame = 0;
    const scheduleInvalidate = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        if (mapRef.current) {
          mapRef.current.invalidateSize({ pan: false, animate: false });
        }
      });
    };

    // Sinkronkan ukuran kanvas Leaflet saat kontainer berubah (mis. panel detail dibuka/ditutup)
    scheduleInvalidate();
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleInvalidate)
        : null;
    resizeObserver?.observe(container);

    return () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
        markersLayerRef.current = null;
      }
      markerMap.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleMarkerMode]);

  // Sinkronkan layer basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const cfg = BASEMAP_LAYERS[activeBasemap] ?? BASEMAP_LAYERS.osm;
    const tileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });

    tileLayer.on("tileerror", () => {
      setTileError(true);
    });
    tileLayer.on("load", () => {
      setTileError(false);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [activeBasemap]);

  // Render marker + clustering secara efisien
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }
    markerMapRef.current.clear();

    const layerGroup =
      clusterEnabled && !singleMarkerMode && typeof L.markerClusterGroup === "function"
        ? L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 48,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction(cluster) {
              const count = cluster.getChildCount();
              const cls =
                count >= 25
                  ? "hotmap-cluster-lg"
                  : count >= 8
                  ? "hotmap-cluster-md"
                  : "hotmap-cluster-sm";
              return L.divIcon({
                html: `<div class="hotmap-cluster-badge ${cls}">${count}</div>`,
                className: "hotmap-cluster-icon",
                iconSize: [38, 38],
              });
            },
          })
        : L.layerGroup();

    for (const item of validPoints) {
      const isSelected = selectedId === item.id;
      const marker = L.marker([item.latitude, item.longitude], {
        icon: createStatusMarkerIcon(item.statusKey, isSelected),
        title: item.judul || "Titik Laporan Karhutla",
        zIndexOffset: isSelected ? 500 : 0,
      });

      marker.bindPopup(() => buildSafePopupNode(item, detailHrefPrefix), {
        maxWidth: 260,
      });

      marker.on("click", () => {
        if (typeof onSelectReport === "function") {
          onSelectReport(item.id);
        }
      });

      layerGroup.addLayer(marker);
      markerMapRef.current.set(item.id, marker);
    }

    layerGroup.addTo(map);
    markersLayerRef.current = layerGroup;

    if (singleMarkerMode && validPoints.length === 1) {
      map.setView([validPoints[0].latitude, validPoints[0].longitude], 13, {
        animate: false,
      });
    }
  }, [
    validPoints,
    selectedId,
    clusterEnabled,
    singleMarkerMode,
    detailHrefPrefix,
    onSelectReport,
  ]);

  // Terbang ke target fokus saat pengguna klik baris daftar atau pilih wilayah
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;

    if (isValidCoordinatePair(focusTarget.lat, focusTarget.lng)) {
      const zoom = focusTarget.zoom ?? Math.max(map.getZoom(), 11);
      map.flyTo([focusTarget.lat, focusTarget.lng], zoom, {
        duration: 0.65,
      });

      if (focusTarget.reportId) {
        const marker = markerMapRef.current.get(focusTarget.reportId);
        if (marker && typeof marker.openPopup === "function") {
          setTimeout(() => {
            if (mapRef.current && marker) {
              marker.openPopup();
            }
          }, 350);
        }
      }
    }
  }, [focusTarget]);

  function handleFitAllMarkers() {
    const map = mapRef.current;
    if (!map) return;
    if (validPoints.length === 0) {
      map.setView(INDONESIA_CENTER, INDONESIA_DEFAULT_ZOOM, { animate: true });
      return;
    }
    if (validPoints.length === 1) {
      map.flyTo([validPoints[0].latitude, validPoints[0].longitude], 12, {
        duration: 0.6,
      });
      return;
    }
    const bounds = L.latLngBounds(
      validPoints.map((p) => [p.latitude, p.longitude])
    );
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 14 });
  }

  function handleResetIndonesia() {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(INDONESIA_CENTER, INDONESIA_DEFAULT_ZOOM, { duration: 0.6 });
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#CFE0D8] bg-[#DFECE6]">
      {/* Toolbar Kontrol Peta */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5E2D8] bg-white/95 px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Pilihan Basemap">
            {Object.values(BASEMAP_LAYERS).map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveBasemap(layer.id)}
                className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  activeBasemap === layer.id
                    ? "bg-[#155E42] text-white"
                    : "bg-[#F4F6F2] text-[#4E5E55] hover:bg-[#EAF1EC]"
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {!singleMarkerMode && (
              <button
                type="button"
                onClick={() => setClusterEnabled((prev) => !prev)}
                className={`rounded-md border px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  clusterEnabled
                    ? "border-[#155E42] bg-[#EAF1EC] text-[#155E42]"
                    : "border-[#DCE2DA] bg-white text-[#5F6F66] hover:bg-[#F6F7F3]"
                }`}
              >
                Klaster: {clusterEnabled ? "Aktif" : "Mati"}
              </button>
            )}

            <button
              type="button"
              onClick={handleFitAllMarkers}
              className="rounded-md border border-[#DCE2DA] bg-white px-2.5 py-1 font-semibold text-[#14231B] hover:bg-[#EAF1EC] cursor-pointer"
            >
              Fokus Titik ({validPoints.length})
            </button>

            <button
              type="button"
              onClick={handleResetIndonesia}
              className="rounded-md border border-[#DCE2DA] bg-white px-2.5 py-1 font-semibold text-[#5F6F66] hover:bg-[#F6F7F3] cursor-pointer"
            >
              Reset RI
            </button>
          </div>
        </div>
      )}

      {/* Kanvas Leaflet */}
      <div className={`relative w-full ${heightClass}`}>
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label="Peta Interaktif Sebaran Laporan Karhutla"
        />

        {/* Peringatan Tile Error */}
        {tileError && (
          <div className="pointer-events-none absolute top-3 left-1/2 z-400 -translate-x-1/2 rounded-lg border border-[#E5B8A7] bg-[#FDF2EA]/95 px-3 py-1.5 text-[11px] font-medium text-[#9B4017] shadow-sm">
            Sebagian tile peta gagal dimuat. Anda dapat mengganti basemap pada tombol di atas.
          </div>
        )}

        {/* Indikator Empty State pada Peta */}
        {validPoints.length === 0 && !singleMarkerMode && (
          <div className="pointer-events-none absolute bottom-12 left-1/2 z-400 -translate-x-1/2 rounded-lg border border-[#DCE2DA] bg-white/95 px-3.5 py-2 text-xs font-medium text-[#4E5E55] shadow-sm text-center">
            Belum ada titik laporan dengan koordinat valid untuk filter saat ini.
          </div>
        )}
      </div>

      {/* Footer Legenda & Disclaimer GIS */}
      {showLegend && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-[#D5E2D8] bg-white/95 px-3.5 py-2.5 text-[11px] text-[#4E5E55]">
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1.5 font-medium">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dotColor}`} />
                {meta.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[#5F6F66]">
            {invalidCoordCount > 0 && (
              <span className="rounded bg-[#FEF5E7] px-2 py-0.5 font-semibold text-[#B5651D]">
                {invalidCoordCount} laporan tanpa koordinat valid
              </span>
            )}
            <span>
              Titik menunjukkan <strong>laporan warga</strong>, bukan deteksi hotspot satelit.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
