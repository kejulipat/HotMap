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

export default function PublicBeritaExplorer({
  beritaList = [],
  initialSearch = "",
}) {
  const [kategori, setKategori] = useState("semua");
  const [search, setSearch] = useState(initialSearch);

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DCE0D5]">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setKategori(cat.key)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold border transition-colors cursor-pointer ${
                kategori === cat.key
                  ? "bg-[#557029] text-white border-[#557029]"
                  : "bg-white text-[#2C3325] border-[#8A947D] hover:bg-[#F7F8F2]"
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
          className="w-full sm:w-64 rounded-[4px] border border-[#8A947D] bg-white px-3.5 py-2 text-[14px] text-[#2C3325] placeholder:text-[#6B7263] focus:border-[#557029] focus:outline-none"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((berita) => (
            <article key={berita.id} className="group flex flex-col justify-between">
              <div>
                <Link
                  href={`/berita/${berita.slug || berita.id}`}
                  className="block aspect-[16/10] w-full rounded-[8px] overflow-hidden mb-4 bg-[#EEF2E4] border border-[#DCE0D5]"
                >
                  {berita.gambarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={berita.gambarUrl}
                      alt={berita.judul}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    /* Placeholder foto artikel siap diganti melalui unggah gambar berita */
                    <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-[#6F8E3D] px-4 text-center">
                      <svg
                        className="h-8 w-8 opacity-75"
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
                      <span className="text-[11px] font-medium text-[#6B7263] uppercase tracking-wider">
                        Placeholder Foto Berita
                      </span>
                    </div>
                  )}
                </Link>

                <div className="flex items-center gap-2 mb-2 text-[12px] font-medium text-[#6B7263]">
                  <span className="rounded-[4px] bg-[#EEF2E4] px-2 py-0.5 font-semibold capitalize text-[#3F561E]">
                    {berita.kategori}
                  </span>
                  <span>&bull;</span>
                  <span>{formatDate(berita.tanggal, "short")}</span>
                </div>

                <h2 className="font-serif text-[18px] font-semibold text-[#2C3325] group-hover:text-[#557029] transition-colors leading-snug">
                  <Link href={`/berita/${berita.slug || berita.id}`}>
                    {berita.judul}
                  </Link>
                </h2>

                {berita.ringkasan && (
                  <p className="mt-2 text-[14px] text-[#6B7263] line-clamp-3 leading-relaxed">
                    {berita.ringkasan}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-2">
                <Link
                  href={`/berita/${berita.slug || berita.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#8A947D] px-4 py-1.5 text-[12px] font-semibold text-[#2C3325] hover:border-[#557029] hover:bg-[#F7F8F2] transition-colors"
                >
                  Baca Selengkapnya
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
