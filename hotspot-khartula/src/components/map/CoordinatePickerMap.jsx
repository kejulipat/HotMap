"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BASEMAP_LAYERS,
  INDONESIA_CENTER,
  INDONESIA_DEFAULT_ZOOM,
  isValidCoordinatePair,
  isWithinIndonesiaBounds,
} from "@/lib/gis";

function createPickerIcon() {
  return L.divIcon({
    className: "hotmap-marker-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:9999px;background:#ffffff;box-shadow:0 0 0 6px rgba(200,90,40,0.32),0 4px 10px rgba(18,36,27,0.32);display:flex;align-items:center;justify-content:center;"><span style="width:13px;height:13px;border-radius:9999px;background:#C85A28;display:block;"></span></div>`,
  });
}

export default function CoordinatePickerMap({
  latitude = null,
  longitude = null,
  wilayahCenter = null,
  onChange = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileRef = useRef(null);
  const onChangeRef = useRef(onChange);

  const [activeBasemap, setActiveBasemap] = useState("osm");
  const [gpsStatus, setGpsStatus] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const hasValidCoord = isValidCoordinatePair(latitude, longitude);
  const insideIndonesia = hasValidCoord
    ? isWithinIndonesiaBounds(latitude, longitude)
    : true;

  // Inisialisasi Leaflet Map untuk coordinate picker
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

    const startCenter = hasValidCoord
      ? [latitude, longitude]
      : wilayahCenter && isValidCoordinatePair(wilayahCenter.lat, wilayahCenter.lng)
      ? [wilayahCenter.lat, wilayahCenter.lng]
      : INDONESIA_CENTER;
    const startZoom = hasValidCoord
      ? 12
      : wilayahCenter && isValidCoordinatePair(wilayahCenter.lat, wilayahCenter.lng)
      ? 10
      : INDONESIA_DEFAULT_ZOOM;

    const map = L.map(container, {
      center: startCenter,
      zoom: startZoom,
      minZoom: 4,
      maxZoom: 18,
    });

    map.on("click", (e) => {
      const nextLat = Number(e.latlng.lat.toFixed(6));
      const nextLng = Number(e.latlng.lng.toFixed(6));
      if (typeof onChangeRef.current === "function") {
        onChangeRef.current(nextLat, nextLng);
      }
    });

    mapRef.current = map;

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

    // Sinkronkan ukuran kanvas Leaflet saat kontainer berubah ukuran
    scheduleInvalidate();
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleInvalidate)
        : null;
    resizeObserver?.observe(container);

    return () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap switcher
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileRef.current) {
      map.removeLayer(tileRef.current);
      tileRef.current = null;
    }

    const cfg = BASEMAP_LAYERS[activeBasemap] ?? BASEMAP_LAYERS.osm;
    const layer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });
    layer.addTo(map);
    tileRef.current = layer;
  }, [activeBasemap]);

  // Sinkronkan marker dengan props latitude/longitude
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasValidCoord) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    if (!markerRef.current) {
      const marker = L.marker([latitude, longitude], {
        draggable: true,
        icon: createPickerIcon(),
      });
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        if (typeof onChangeRef.current === "function") {
          onChangeRef.current(
            Number(pos.lat.toFixed(6)),
            Number(pos.lng.toFixed(6))
          );
        }
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [hasValidCoord, latitude, longitude]);

  // Auto-flyTo saat pengguna memilih wilayah baru pada dropdown
  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !wilayahCenter ||
      !isValidCoordinatePair(wilayahCenter.lat, wilayahCenter.lng)
    ) {
      return;
    }
    map.flyTo([wilayahCenter.lat, wilayahCenter.lng], 10, { duration: 0.6 });
  }, [wilayahCenter]);

  function handleUseGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("Browser tidak mendukung Geolocation GPS.");
      return;
    }

    setGpsLoading(true);
    setGpsStatus("Mendeteksi lokasi GPS perangkat...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(6));
        const nextLng = Number(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
        setGpsStatus("Lokasi GPS berhasil diterapkan.");
        if (typeof onChangeRef.current === "function") {
          onChangeRef.current(nextLat, nextLng);
        }
        if (mapRef.current) {
          mapRef.current.flyTo([nextLat, nextLng], 14, { duration: 0.7 });
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus(
          err?.code === 1
            ? "Izin lokasi ditolak browser. Silakan klik titik langsung pada peta."
            : "Gagal mendeteksi GPS. Klik langsung pada peta atau isi koordinat manual."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="rounded-xl border border-[#CFE0D8] overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E8E1] bg-[#F6F7F3] px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.values(BASEMAP_LAYERS).map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveBasemap(layer.id)}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                activeBasemap === layer.id
                  ? "bg-[#155E42] text-white"
                  : "bg-white text-[#4E5E55] border border-[#DCE2DA] hover:bg-[#EAF1EC]"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="rounded-md bg-[#C85A28] hover:bg-[#B04B1D] px-3 py-1 font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          {gpsLoading ? "Mendeteksi GPS..." : "Gunakan Lokasi GPS Saya"}
        </button>
      </div>

      <div
        ref={containerRef}
        className="h-[320px] sm:h-[360px] w-full"
        aria-label="Pemilih Titik Koordinat Lokasi Kejadian"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-t border-[#E3E8E1] bg-[#FBFBFA] px-3 py-2 text-[11px] text-[#5F6F66]">
        <span>
          Klik di peta untuk menempatkan pin, atau seret pin oranye untuk
          menyesuaikan posisi.
        </span>
        {hasValidCoord && !insideIndonesia && (
          <span className="font-semibold text-[#B83E1B]">
            Peringatan: Koordinat di luar wilayah Indonesia.
          </span>
        )}
        {gpsStatus && (
          <span className="font-semibold text-[#155E42]">{gpsStatus}</span>
        )}
      </div>
    </div>
  );
}
