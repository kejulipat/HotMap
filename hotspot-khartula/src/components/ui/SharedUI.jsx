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
      className={`inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[12px] font-semibold ${meta.badgeBg} ${meta.badgeText} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
      {meta.label}
    </span>
  );
}

export function SummaryCardsGrid({ counts = {}, activeStatus = "semua", hrefBase = null }) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {SUMMARY_CARDS.map((card) => {
        const isActive = activeStatus === card.key;
        const isPrimaryCard = card.key === "semua";
        const count = counts[card.key] ?? 0;

        const cardClasses = `block text-left rounded-[8px] p-4 transition-colors border ${
          isPrimaryCard
            ? "bg-[#557029] text-white border-[#557029]"
            : isActive
            ? "bg-[#F7F8F2] text-[#2C3325] border-[#557029] ring-1 ring-[#557029]"
            : "bg-white text-[#2C3325] border-[#DCE0D5] hover:border-[#8A947D]"
        }`;

        const inner = (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                {count}
              </span>
              <span
                className={`text-[12px] font-medium ${
                  isPrimaryCard ? "text-white/85" : "text-[#6B7263]"
                }`}
              >
                laporan
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[12px] font-medium">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${card.dotColor}`}
              />
              <span
                className={`truncate ${
                  isPrimaryCard ? "text-white" : "text-[#2C3325]"
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
      className="rounded-[8px] border border-[#E5B8A7] bg-[#FDF2EA] px-4 py-3 text-sm text-[#9B3417]"
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
    <div className="rounded-[8px] border border-dashed border-[#8A947D] bg-[#F7F8F2] px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#DCE0D5] bg-white text-[#6F8E3D]">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 15h6" />
        </svg>
      </div>
      <h3 className="font-serif text-[18px] font-semibold text-[#2C3325]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[14px] text-[#6B7263]">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-[#557029] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#465D21] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function LoadingSpinner({ label = "Memuat data..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#6B7263]">
      <span className="h-8 w-8 animate-spin rounded-full border-3 border-[#DCE0D5] border-t-[#557029]" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/** Skeleton area konten dashboard; sidebar & header tetap tampil saat pindah halaman. */
export function DashboardPageSkeleton() {
  const block = "rounded-[8px] bg-[#E8ECE0] animate-pulse";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat halaman">
      <div className="space-y-2">
        <div className={`${block} h-7 w-64 max-w-full`} />
        <div className={`${block} h-4 w-96 max-w-full`} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-[#6B7263]">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
            {idx > 0 && <span aria-hidden="true">/</span>}
            {isLast || !item.href ? (
              <span className="font-semibold text-[#2C3325]">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-[#557029] transition-colors"
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
    <div className="rounded-[8px] bg-white border border-[#DCE0D5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F8F2] border-b border-[#DCE0D5] text-[12px] font-semibold uppercase tracking-wider text-[#6B7263]">
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
          <tbody className="divide-y divide-[#DCE0D5] text-[14px]">
            {laporan.map((item) => (
              <tr key={item.id} className="hover:bg-[#F7F8F2]/80 transition-colors">
                <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#2C3325]">
                  {item.judul}
                </td>
                <td className="py-3.5 px-4 text-[13px] text-[#6B7263]">
                  {item.wilayah}
                </td>
                <td className="py-3.5 px-4 text-[12px] font-mono text-[#6B7263]">
                  {isValidLatLng(item.latitude, item.longitude)
                    ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                    : "-"}
                </td>
                <td className="py-3.5 px-4 text-[13px] text-[#6B7263]">
                  {formatDate(item.tanggal, "short")}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge statusKey={item.statusKey} />
                </td>
                {detailHrefPrefix && (
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <Link
                      href={`${detailHrefPrefix}/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#8A947D] px-3.5 py-1 text-[12px] font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#EEF2E4] transition-colors"
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
