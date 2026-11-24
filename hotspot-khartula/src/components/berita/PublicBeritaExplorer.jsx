"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/SharedUI";
import { formatDate } from "@/lib/normalizers";

const CATEGORIES = [
  { key: "semua", label: "Semua Kategori" },
  { key: "informasi", label: "Informasi" },
  { key: "peringatan", label: "Peringatan Dini" },
  { key: "penanganan", label: "Penanganan" },
  { key: "edukasi", label: "Edukasi" },
];

export default function PublicBeritaExplorer({ beritaList = [] }) {
  const [kategori, setKategori] = useState("semua");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beritaList.filter((b) => {
      if (kategori !== "semua" && b.kategori !== kategori) return false;
      if (q) {
        const hay = `${b.judul ?? ""} ${b.ringkasan ?? ""} ${b.isi ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [beritaList, kategori, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setKategori(cat.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                kategori === cat.key
                  ? "bg-[#155E42] text-white border-[#155E42]"
                  : "bg-white text-[#4E5E55] border-[#DCE2DA] hover:bg-[#EAF1EC]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul atau topik berita..."
          className="w-full sm:w-64 rounded-lg border border-[#DCE2DA] bg-white px-3.5 py-2 text-sm text-[#14231B] focus:border-[#155E42] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada berita ditemukan"
          description="Belum ada artikel berita yang cocok dengan kategori atau kata kunci pencarian."
          actionLabel={beritaList.length === 0 ? "Lihat Peta Karhutla" : null}
          actionHref={beritaList.length === 0 ? "/peta" : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map((berita) => (
            <Link
              key={berita.id}
              href={`/berita/${berita.slug || berita.id}`}
              className="group rounded-xl bg-white border border-[#E3E8E1] p-4 shadow-2xs hover:border-[#C5D1C8] hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-40 w-full rounded-lg overflow-hidden mb-3.5 bg-linear-to-b from-[#2E3834] via-[#7A5438] to-[#D47A42]">
                  {berita.gambarUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={berita.gambarUrl}
                      alt={berita.judul}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-block rounded-md bg-[#EAF1EC] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#155E42]">
                    {berita.kategori}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#14231B] group-hover:text-[#155E42] transition-colors leading-snug">
                  {berita.judul}
                </h2>
                {berita.ringkasan && (
                  <p className="mt-2 text-xs text-[#606F67] line-clamp-2">
                    {berita.ringkasan}
                  </p>
                )}
              </div>
              <p className="mt-4 pt-3 border-t border-[#ECEFE9] text-xs text-[#6B7A71]">
                {formatDate(berita.tanggal, "long")} &bull; {berita.penulis}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
