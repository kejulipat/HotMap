"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, StatusBadge } from "@/components/ui/SharedUI";
import { formatCoordinates } from "@/lib/gis";
import { STATUS_META, formatDate } from "@/lib/normalizers";
import { TINGKAT_KEPARAHAN_OPTIONS, getKeparahanMeta } from "@/lib/workflow";

const PAGE_SIZE = 15;

export default function LaporanFilterTable({
  laporanList = [],
  wilayahList = [],
  detailHrefPrefix = null,
  initialStatus = "semua",
  currentUserId = null,
  enablePetugasScope = false,
  initialScope = "semua",
  emptyActionLabel = null,
  emptyActionHref = null,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [wilayahFilter, setWilayahFilter] = useState("semua");
  const [prioritasFilter, setPrioritasFilter] = useState("semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [petugasScope, setPetugasScope] = useState(initialScope);
  const [page, setPage] = useState(1);

  const wilayahOptions = useMemo(() => {
    const names = new Set(wilayahList.map((w) => w.nama).filter(Boolean));
    for (const item of laporanList) {
      if (item.wilayah) names.add(item.wilayah);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [wilayahList, laporanList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return laporanList.filter((item) => {
      if (
        enablePetugasScope &&
        petugasScope === "tugas_saya" &&
        currentUserId &&
        item.petugasId !== currentUserId
      ) {
        return false;
      }
      if (statusFilter !== "semua" && item.statusKey !== statusFilter) {
        return false;
      }
      if (wilayahFilter !== "semua" && item.wilayah !== wilayahFilter) {
        return false;
      }
      if (
        prioritasFilter !== "semua" &&
        (item.tingkatKeparahan ?? "") !== prioritasFilter
      ) {
        return false;
      }
      if (startDate && item.tanggal && item.tanggal < startDate) {
        return false;
      }
      if (endDate && item.tanggal && item.tanggal > endDate) {
        return false;
      }
      if (q) {
        const hay = `${item.judul ?? ""} ${item.wilayah ?? ""} ${
          item.alamatLokasi ?? ""
        } ${item.pelapor ?? ""} ${item.petugas ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    laporanList,
    enablePetugasScope,
    petugasScope,
    currentUserId,
    statusFilter,
    wilayahFilter,
    prioritasFilter,
    startDate,
    endDate,
    search,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function resetAll() {
    setSearch("");
    setStatusFilter("semua");
    setWilayahFilter("semua");
    setPrioritasFilter("semua");
    setStartDate("");
    setEndDate("");
    setPetugasScope("semua");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E3E8E1] bg-white p-4 shadow-2xs space-y-3">
        {enablePetugasScope && currentUserId && (
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#ECEFE9]">
            <span className="text-xs font-semibold text-[#4E5E55]">
              Cakupan Tampilan:
            </span>
            <div className="inline-flex rounded-lg border border-[#DCE2DA] bg-[#F6F7F3] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPetugasScope("tugas_saya");
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1 transition-colors cursor-pointer ${
                  petugasScope === "tugas_saya"
                    ? "bg-[#155E42] text-white"
                    : "text-[#4E5E55]"
                }`}
              >
                Tugas Saya
              </button>
              <button
                type="button"
                onClick={() => {
                  setPetugasScope("semua");
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1 transition-colors cursor-pointer ${
                  petugasScope === "semua"
                    ? "bg-[#155E42] text-white"
                    : "text-[#4E5E55]"
                }`}
              >
                Semua Laporan
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-[#5B6B61] mb-1">
              Pencarian
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Judul, lokasi, pelapor..."
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-xs sm:text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#5B6B61] mb-1">
              Wilayah
            </label>
            <select
              value={wilayahFilter}
              onChange={(e) => {
                setWilayahFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-xs sm:text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            >
              <option value="semua">Semua wilayah</option>
              {wilayahOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#5B6B61] mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-xs sm:text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            >
              <option value="semua">Semua status</option>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#5B6B61] mb-1">
              Prioritas
            </label>
            <select
              value={prioritasFilter}
              onChange={(e) => {
                setPrioritasFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-3 py-2 text-xs sm:text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
            >
              <option value="semua">Semua prioritas</option>
              {TINGKAT_KEPARAHAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6B61] mb-1">
                Dari
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-2 py-2 text-xs text-[#14231B]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6B61] mb-1">
                Sampai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-[#DCE2DA] bg-[#FBFBFA] px-2 py-2 text-xs text-[#14231B]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#5F6F66]">
          <span>
            Menampilkan <strong>{filtered.length}</strong> laporan (halaman{" "}
            {safePage} dari {totalPages})
          </span>
          <button
            type="button"
            onClick={resetAll}
            className="font-semibold text-[#155E42] hover:underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title="Tidak ada laporan yang cocok"
          description="Belum ada laporan yang sesuai dengan kriteria filter saat ini."
          actionLabel={emptyActionLabel}
          actionHref={emptyActionHref}
        />
      ) : (
        <div className="rounded-xl bg-white border border-[#E3E8E1] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF2EC] border-b border-[#E1E7DF] text-[11px] font-bold uppercase tracking-wider text-[#5B6B61]">
                  <th className="py-3.5 px-4 sm:px-6">Kejadian</th>
                  <th className="py-3.5 px-4">Wilayah</th>
                  <th className="py-3.5 px-4">Koordinat</th>
                  <th className="py-3.5 px-4">Petugas</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Status</th>
                  {detailHrefPrefix && (
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9] text-sm">
                {paginated.map((item) => {
                  const kep = getKeparahanMeta(item.tingkatKeparahan);
                  const isMine = currentUserId && item.petugasId === currentUserId;
                  return (
                    <tr key={item.id} className="hover:bg-[#F9FAF8] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <p className="font-semibold text-[#14231B]">
                          {item.judul}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {kep && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${kep.badgeBg} ${kep.badgeText}`}
                            >
                              {kep.label}
                            </span>
                          )}
                          {enablePetugasScope && isMine && (
                            <span className="rounded bg-[#EBF4FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#1E62B5]">
                              Tugas Saya
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs sm:text-sm text-[#5F6F66]">
                        {item.wilayah}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#5F6F66]">
                        {formatCoordinates(item.latitude, item.longitude, 4)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                        {item.petugas}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5F6F66]">
                        {formatDate(item.tanggal, "short")}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge statusKey={item.statusKey} />
                      </td>
                      {detailHrefPrefix && (
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <Link
                            href={`${detailHrefPrefix}/${item.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#DCE2DA] px-3 py-1.5 text-xs font-semibold text-[#155E42] hover:bg-[#EAF1EC]"
                          >
                            Detail &rarr;
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#ECEFE9] bg-[#FBFBFA] px-4 py-3 text-xs">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#DCE2DA] bg-white px-3 py-1.5 font-semibold text-[#14231B] disabled:opacity-40 cursor-pointer"
              >
                &larr; Sebelumnya
              </button>
              <span className="font-semibold text-[#5F6F66]">
                Halaman {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-[#DCE2DA] bg-white px-3 py-1.5 font-semibold text-[#14231B] disabled:opacity-40 cursor-pointer"
              >
                Berikutnya &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
