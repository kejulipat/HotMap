import Link from "next/link";
import { StatusBadge } from "@/components/ui/SharedUI";
import { formatDate } from "@/lib/normalizers";

export default function LaporanDetailView({
  laporan,
  backHref,
  backLabel = "Kembali ke daftar",
  children = null,
}) {
  const hasCoords =
    Number.isFinite(laporan.latitude) && Number.isFinite(laporan.longitude);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#155E42] hover:underline"
          >
            &larr; {backLabel}
          </Link>
          <h1 className="mt-1.5 text-2xl font-bold text-[#12241B]">
            {laporan.judul}
          </h1>
        </div>
        <StatusBadge statusKey={laporan.statusKey} className="self-start sm:self-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
              Deskripsi Kejadian
            </h2>
            <p className="mt-2 text-sm text-[#2B3B32] leading-relaxed whitespace-pre-line">
              {laporan.deskripsi || "Belum ada deskripsi kejadian."}
            </p>
          </div>

          <div className="rounded-xl border border-[#E7ECE5] bg-[#F6F7F3] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6B61]">
              Catatan Verifikasi / Tindak Lanjut
            </h3>
            <p className="mt-1.5 text-sm text-[#14231B]">
              {laporan.catatanVerifikasi ||
                "Belum ada catatan verifikasi dari admin atau petugas."}
            </p>
          </div>

          {children}
        </div>

        <aside className="rounded-2xl border border-[#E3E8E1] bg-white p-6 shadow-2xs space-y-4 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6B61]">
            Informasi Laporan
          </h2>
          <dl className="divide-y divide-[#ECEFE9] text-xs">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">ID Laporan</dt>
              <dd className="font-mono font-semibold text-[#14231B] truncate max-w-[160px]">
                {laporan.id}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Wilayah</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.wilayah}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Koordinat</dt>
              <dd className="font-mono font-semibold text-[#14231B] text-right">
                {hasCoords
                  ? `${laporan.latitude}, ${laporan.longitude}`
                  : "Belum diisi"}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Pelapor</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.pelapor}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Petugas</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {laporan.petugas}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#6B7A71]">Tanggal Lapor</dt>
              <dd className="font-semibold text-[#14231B] text-right">
                {formatDate(laporan.tanggal, "long")}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
