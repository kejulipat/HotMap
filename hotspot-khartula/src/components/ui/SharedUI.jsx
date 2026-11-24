import Link from "next/link";
import {
  STATUS_META,
  SUMMARY_CARDS,
  formatDate,
  isValidLatLng,
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

/** Skeleton area konten dashboard; sidebar & header tetap tampil saat pindah halaman. */
export function DashboardPageSkeleton() {
  const block = "rounded-xl bg-[#E6ECE7] animate-pulse";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat halaman">
      <div className="space-y-2">
        <div className={`${block} h-7 w-64 max-w-full`} />
        <div className={`${block} h-4 w-96 max-w-full`} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${block} h-20`} />
        ))}
      </div>
      <div className={`${block} h-72`} />
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
                  {isValidLatLng(item.latitude, item.longitude)
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
