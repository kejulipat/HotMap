import Link from "next/link";
import {
  STATUS_META,
  SUMMARY_CARDS,
  formatDate,
  projectToIndonesiaMap,
} from "@/lib/normalizers";

export function StatusBadge({ statusKey, className = "" }) {
  const meta = STATUS_META[statusKey] ?? STATUS_META.menunggu_verifikasi;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${meta.badgeBg} ${meta.badgeText} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
      {meta.label}
    </span>
  );
}

export function SummaryCardsGrid({ counts = {}, activeStatus = "semua", hrefBase = null }) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {SUMMARY_CARDS.map((card) => {
        const isActive = activeStatus === card.key;
        const isPrimaryCard = card.key === "semua";
        const count = counts[card.key] ?? 0;

        const cardClasses = `block text-left rounded-xl p-4 transition-all border ${
          isPrimaryCard
            ? "bg-[#155E42] text-white border-[#155E42] shadow-sm"
            : isActive
            ? "bg-white text-[#14231B] border-[#155E42] ring-2 ring-[#155E42]/20"
            : "bg-white text-[#14231B] border-[#E3E8E1] hover:border-[#C5D1C8]"
        }`;

        const inner = (
          <>
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
          </>
        );

        if (hrefBase) {
          const href =
            card.key === "semua" ? hrefBase : `${hrefBase}?status=${card.key}`;
          return (
            <Link key={card.key} href={href} className={cardClasses}>
              {inner}
            </Link>
          );
        }

        return (
          <div key={card.key} className={cardClasses}>
            {inner}
          </div>
        );
      })}
    </section>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B4017]"
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title = "Belum ada data",
  description = "Data belum tersedia untuk saat ini.",
  actionLabel = null,
  actionHref = null,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD6CE] bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1EC] text-[#155E42]">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 15h6" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-[#14231B]">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#606F67]">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#155E42] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#114B35] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function LoadingSpinner({ label = "Memuat data..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#5E6D64]">
      <span className="h-8 w-8 animate-spin rounded-full border-3 border-[#D5E2D8] border-t-[#155E42]" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B7A71]">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
            {idx > 0 && <span aria-hidden="true">/</span>}
            {isLast || !item.href ? (
              <span className="font-semibold text-[#14231B]">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-[#155E42] transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function MapOverviewBox({
  laporan = [],
  title = "Pratinjau Sebaran Koordinat Laporan",
  subtitle = "Menampilkan titik koordinat laporan warga yang valid. Integrasi peta GIS interaktif (Leaflet) dijadwalkan pada Fase 2.",
  detailHrefPrefix = null,
}) {
  const geoPoints = laporan.filter(
    (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
  );

  return (
    <section className="rounded-2xl bg-white border border-[#E3E8E1] p-4 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#12241B]">{title}</h2>
          <p className="text-xs text-[#6B7A71]">{subtitle}</p>
        </div>
        <span className="self-start sm:self-auto rounded-lg bg-[#EAF1EC] border border-[#D5E2D8] px-3 py-1.5 text-xs font-semibold text-[#155E42]">
          {geoPoints.length} titik koordinat valid
        </span>
      </div>

      <div className="relative rounded-xl bg-[#DFECE6] border border-[#CFE0D8] min-h-[340px] sm:min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 opacity-35 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #bdd2c8 1px, transparent 1px), linear-gradient(to bottom, #bdd2c8 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="absolute top-3 right-3 z-10 w-8 h-10 rounded-lg bg-white/95 border border-[#D5E0DA] shadow-xs flex flex-col items-center justify-center text-[10px] font-bold text-[#33423A]">
          <span>N</span>
          <span className="text-xs leading-none">&uarr;</span>
        </div>

        <svg
          viewBox="0 0 1000 450"
          className="w-full h-full min-h-[340px] sm:min-h-[400px] object-contain p-5 opacity-90"
          aria-label="Pratinjau Kanvas Peta Wilayah Indonesia"
        >
          <path
            d="M75,90 L135,120 L215,215 L245,275 L210,300 L145,225 L90,145 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
          <path
            d="M235,320 L385,332 L415,348 L360,358 L235,342 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
          <path
            d="M295,125 L385,105 L440,145 L425,235 L350,255 L290,215 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
          <path
            d="M475,145 L545,135 L555,165 L505,190 L535,235 L505,270 L470,225 L485,175 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
          <path
            d="M430,342 L530,346 L575,358 L525,368 L430,356 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
          <path
            d="M600,175 L645,165 L655,220 L615,235 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
          <path
            d="M685,185 L785,175 L845,225 L840,310 L765,285 L705,240 Z"
            fill="#C4D7B8"
            stroke="#7D9B76"
            strokeWidth="1.5"
          />
        </svg>

        {geoPoints.map((item) => {
          const pos = projectToIndonesiaMap(item.latitude, item.longitude);
          const meta = STATUS_META[item.statusKey] ?? STATUS_META.menunggu_verifikasi;
          const markerDot = (
            <span
              title={`${item.judul} (${item.wilayah}) — ${item.latitude}, ${item.longitude}`}
              className={`flex items-center justify-center w-6 h-6 rounded-full ring-4 ${meta.pinRing} bg-white shadow-md hover:scale-110 transition-transform`}
            >
              <span className={`w-3 h-3 rounded-full ${meta.pinBg}`} />
            </span>
          );

          return (
            <div
              key={item.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              {detailHrefPrefix ? (
                <Link href={`${detailHrefPrefix}/${item.id}`}>
                  {markerDot}
                </Link>
              ) : (
                markerDot
              )}
            </div>
          );
        })}

        <p className="absolute bottom-3 left-4 text-[11px] text-[#4E5E55] bg-white/80 backdrop-blur px-2.5 py-1 rounded-md border border-[#D5E2D8]">
          Titik menunjukkan laporan warga, bukan deteksi hotspot satelit.
        </p>
      </div>
    </section>
  );
}

export function LaporanTable({
  laporan = [],
  detailHrefPrefix = null,
  emptyTitle = "Belum ada laporan",
  emptyDescription = "Belum ada laporan karhutla yang tercatat saat ini.",
  actionLabel = null,
  actionHref = null,
}) {
  if (laporan.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
    );
  }

  return (
    <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
              <th className="py-3.5 px-4 sm:px-6">Kejadian</th>
              <th className="py-3.5 px-4">Wilayah</th>
              <th className="py-3.5 px-4">Koordinat</th>
              <th className="py-3.5 px-4">Tanggal</th>
              <th className="py-3.5 px-4">Status</th>
              {detailHrefPrefix && (
                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEFE9] text-sm">
            {laporan.map((item) => (
              <tr key={item.id} className="hover:bg-[#F9FAF8] transition-colors">
                <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#14231B]">
                  {item.judul}
                </td>
                <td className="py-3.5 px-4 text-xs sm:text-sm text-[#5F6F66]">
                  {item.wilayah}
                </td>
                <td className="py-3.5 px-4 text-xs font-mono text-[#5F6F66]">
                  {Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
                    ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                    : "-"}
                </td>
                <td className="py-3.5 px-4 text-xs sm:text-sm text-[#5F6F66]">
                  {formatDate(item.tanggal, "short")}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge statusKey={item.statusKey} />
                </td>
                {detailHrefPrefix && (
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <Link
                      href={`${detailHrefPrefix}/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DCE2DA] px-3 py-1.5 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC] transition-colors"
                    >
                      Detail &rarr;
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
