/**
 * Utilitas GIS & spasial untuk HotMap (tanpa ketergantungan window/DOM agar aman di SSR & unit test).
 */

export const INDONESIA_CENTER = [-2.5, 118.0];
export const INDONESIA_DEFAULT_ZOOM = 5;

export const INDONESIA_BOUNDS = {
  minLat: -11.5,
  maxLat: 6.5,
  minLng: 94.5,
  maxLng: 142.0,
};

export const STATUS_PIN_COLORS = {
  menunggu_verifikasi: { fill: "#D9822B", ring: "rgba(217, 130, 43, 0.28)" },
  terverifikasi: { fill: "#2B7FD9", ring: "rgba(43, 127, 217, 0.28)" },
  ditangani: { fill: "#D9532B", ring: "rgba(217, 83, 43, 0.30)" },
  selesai: { fill: "#2E8555", ring: "rgba(46, 133, 85, 0.28)" },
  ditolak: { fill: "#7A8680", ring: "rgba(122, 134, 128, 0.28)" },
};

export const BASEMAP_LAYERS = {
  osm: {
    id: "osm",
    label: "Peta Jalan (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    id: "satellite",
    label: "Citra Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
  topo: {
    id: "topo",
    label: "Topografi",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
};

export function isValidCoordinatePair(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isSentinelZeroCoordinate(lat, lng) {
  return Math.abs(lat) < 1e-9 && Math.abs(lng) < 1e-9;
}

export function isWithinIndonesiaBounds(lat, lng) {
  if (!isValidCoordinatePair(lat, lng)) return false;
  return (
    lat >= INDONESIA_BOUNDS.minLat &&
    lat <= INDONESIA_BOUNDS.maxLat &&
    lng >= INDONESIA_BOUNDS.minLng &&
    lng <= INDONESIA_BOUNDS.maxLng
  );
}

export function formatCoordinates(lat, lng, precision = 5) {
  if (!isValidCoordinatePair(lat, lng)) return "-";
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export function getGoogleMapsUrl(lat, lng) {
  if (!isValidCoordinatePair(lat, lng)) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function getOsmUrl(lat, lng, zoom = 14) {
  if (!isValidCoordinatePair(lat, lng)) return null;
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
    lat
  )}&mlon=${encodeURIComponent(lng)}#map=${zoom}/${lat}/${lng}`;
}
